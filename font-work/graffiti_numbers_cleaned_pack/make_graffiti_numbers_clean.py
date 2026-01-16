#!/usr/bin/env python3
"""
Extract + normalize "GRAFFITI_FAT_NUMBERS.png" into per-digit transparent PNGs,
with a "clean" (solid stroke) set and a separate "shadow" set.

Key properties:
- Does NOT do naive equal-square slicing.
- Finds glyph groups by background-subtracted line mask + dilation, then connected components.
- Cleans stroke with morphology (opening/closing) and slight dilation to make lines solid.
- Outputs:
  - tight_clean/*.png (tight-cropped glyphs, transparent)
  - tight_shadow/*_shadow.png
  - aligned_clean_1024/*.png (baseline-centered, 1024x1024 transparent)
  - aligned_shadow_1024/*_shadow.png
  - previews/*.png (sheets on dark/white)
  - qc_numbers.json (bbox mapping + border-alpha checks)

Usage:
  python3 make_graffiti_numbers_clean.py --in GRAFFITI_FAT_NUMBERS.png --out graffiti_numbers_clean

Dependencies: pillow, numpy, scipy
"""
from __future__ import annotations
import argparse, json, math, os, zipfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def extract_crop(im_rgb: Image.Image, x0:int, y0:int, x1:int, y1:int, pad:int=30):
    W,H = im_rgb.size
    x0=max(0,x0-pad); y0=max(0,y0-pad); x1=min(W,x1+pad); y1=min(H,y1+pad)
    return im_rgb.crop((x0,y0,x1,y1))


def clean_mask_from_crop(crop_rgb: Image.Image, blur_sigma:float=6, diff_thr:float=8,
                         open_iter:int=1, close_iter:int=2, dil_iter:int=1):
    g = np.array(crop_rgb.convert("L")).astype(np.float32)
    blur = ndimage.gaussian_filter(g, sigma=blur_sigma)
    d = g - blur
    m = d > diff_thr
    m = ndimage.binary_opening(m, iterations=open_iter)
    m = ndimage.binary_closing(m, iterations=close_iter)
    if dil_iter > 0:
        m = ndimage.binary_dilation(m, iterations=dil_iter)
    return m


def rgba_from_mask(crop_rgb: Image.Image, mask: np.ndarray, alpha_blur:float=0.6, color=(255,255,255)):
    rgb = np.array(crop_rgb.convert("RGB"), dtype=np.uint8)
    rgb[:,:,:] = np.array(color, dtype=np.uint8)
    a = mask.astype(np.float32)
    if alpha_blur and alpha_blur > 0:
        a = ndimage.gaussian_filter(a, sigma=alpha_blur)
    a = np.clip(a, 0, 1)
    alpha = (a*255).astype(np.uint8)
    rgba = np.dstack([rgb, alpha])
    return Image.fromarray(rgba.astype(np.uint8)).convert("RGBA")


def bbox_alpha(alpha_arr: np.ndarray):
    ys, xs = np.where(alpha_arr > 0)
    if xs.size == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()+1), int(ys.max()+1)


def tight_crop_rgba(rgba: Image.Image, pad:int=10):
    a = np.array(rgba.split()[-1])
    bb = bbox_alpha(a)
    if bb is None:
        return rgba
    x0,y0,x1,y1 = bb
    x0=max(0,x0-pad); y0=max(0,y0-pad)
    x1=min(rgba.size[0], x1+pad); y1=min(rgba.size[1], y1+pad)
    return rgba.crop((x0,y0,x1,y1))


def add_shadow_rgba(rgba: Image.Image, dx:int=14, dy:int=14, blur:int=8, opacity:int=180):
    a = rgba.split()[-1]
    sh = a.filter(ImageFilter.GaussianBlur(radius=blur))
    sh_arr = (np.array(sh, dtype=np.float32) * (opacity/255.0)).clip(0,255).astype(np.uint8)
    sh_img = Image.new("RGBA", rgba.size, (0,0,0,0))
    sh_img.putalpha(Image.fromarray(sh_arr))
    base = Image.new("RGBA", rgba.size, (0,0,0,0))
    base.alpha_composite(sh_img, (dx,dy))
    base.alpha_composite(rgba, (0,0))
    return base


def composite_on_bg(rgba: Image.Image, bg=(15,15,15)):
    bg_im = Image.new("RGB", rgba.size, bg)
    bg_im.paste(rgba, mask=rgba.split()[-1])
    return bg_im


def aligned_canvas(rgba_tight: Image.Image, canvas:int=1024, baseline_y:int=960, target_h:int=860):
    a = np.array(rgba_tight.split()[-1])
    bb = bbox_alpha(a)
    if bb is None:
        return Image.new("RGBA", (canvas,canvas), (0,0,0,0)), {"scale":1.0,"paste_x":0,"paste_y":0,"bbox_h":0}
    x0,y0,x1,y1 = bb
    bb_h = y1 - y0
    scale = target_h / max(1, bb_h)
    new_w = max(1, int(round(rgba_tight.size[0] * scale)))
    new_h = max(1, int(round(rgba_tight.size[1] * scale)))
    resized = rgba_tight.resize((new_w,new_h), resample=Image.BICUBIC)
    a2 = np.array(resized.split()[-1])
    bb2 = bbox_alpha(a2)
    x0,y0,x1,y1 = bb2
    cx = (x0+x1)/2.0
    bottom = y1
    paste_x = int(round(canvas/2 - cx))
    paste_y = int(round(baseline_y - bottom))
    out = Image.new("RGBA", (canvas,canvas), (0,0,0,0))
    out.alpha_composite(resized, (paste_x,paste_y))
    return out, {"scale":float(scale),"paste_x":int(paste_x),"paste_y":int(paste_y),"bbox_h":int(bb_h)}


def make_sheet(img_paths, cols:int, bg=(15,15,15), out_path:Path|None=None):
    imgs = [Image.open(p).convert("RGBA") for p in img_paths]
    w,h = imgs[0].size
    rows = math.ceil(len(imgs)/cols)
    sheet = Image.new("RGB", (w*cols, h*rows), bg)
    for idx,img in enumerate(imgs):
        r=idx//cols; c=idx%cols
        comp = composite_on_bg(img, bg=bg)
        sheet.paste(comp, (c*w, r*h))
    if out_path:
        sheet.save(out_path)
    return sheet


def to_builtin(obj):
    if isinstance(obj, dict):
        return {str(k): to_builtin(v) for k,v in obj.items()}
    if isinstance(obj, (list,tuple)):
        return [to_builtin(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    return obj


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True, help="Input numbers sheet PNG")
    ap.add_argument("--out", dest="out", required=True, help="Output directory")
    args = ap.parse_args()

    inp = Path(args.inp)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    im = Image.open(inp).convert("RGB")
    gray = np.array(im.convert("L")).astype(np.float32)
    blur = ndimage.gaussian_filter(gray, sigma=8)
    diff = gray - blur

    # line mask + dilation to merge internal holes -> glyph groups
    mask_line = diff > 10.0
    group_mask = ndimage.binary_dilation(mask_line, iterations=25)
    lbl, n = ndimage.label(group_mask)
    if n < 10:
        raise SystemExit(f"Expected at least 10 glyph groups, got {n}")

    objects = ndimage.find_objects(lbl)
    bboxes = []
    for i, sl in enumerate(objects, start=1):
        if sl is None:
            continue
        ys, xs = sl
        y0,y1 = ys.start, ys.stop
        x0,x1 = xs.start, xs.stop
        area = int((lbl[sl] == i).sum())
        bboxes.append((i, x0,y0,x1,y1, area))

    # Sort groups top-to-bottom, left-to-right
    def centroid(bb):
        _,x0,y0,x1,y1,_ = bb
        return ((x0+x1)/2, (y0+y1)/2)

    bboxes_sorted = sorted(bboxes, key=lambda bb: (centroid(bb)[1], centroid(bb)[0]))

    # This sheet contains duplicates for 6 and 7 (bottom row). Export them as *_alt too.
    # Mapping verified visually against the provided sheet.
    id_map = {"0":3,"1":2,"2":1,"3":4,"4":7,"5":8,"6":5,"7":6,"6_alt":9,"7_alt":10,"8":11,"9":12}
    bbox_by_id = {i:(x0,y0,x1,y1) for i,x0,y0,x1,y1,_ in bboxes}

    # Output dirs
    for sub in ["tight_clean","tight_shadow","aligned_clean_1024","aligned_shadow_1024","previews"]:
        (out/sub).mkdir(parents=True, exist_ok=True)

    metrics = {}
    for name, gid in id_map.items():
        x0,y0,x1,y1 = bbox_by_id[gid]
        crop = extract_crop(im, x0,y0,x1,y1, pad=30)
        mask = clean_mask_from_crop(crop, blur_sigma=6, diff_thr=8, open_iter=1, close_iter=2, dil_iter=1)
        rgba = rgba_from_mask(crop, mask, alpha_blur=0.6)
        tight = tight_crop_rgba(rgba, pad=10)
        tight.save(out/"tight_clean"/f"{name}.png")
        sh_tight = add_shadow_rgba(tight, dx=14, dy=14, blur=8, opacity=180)
        sh_tight.save(out/"tight_shadow"/f"{name}_shadow.png")

        aligned, am = aligned_canvas(tight, canvas=1024, baseline_y=960, target_h=860)
        aligned.save(out/"aligned_clean_1024"/f"{name}.png")
        sh_aligned = add_shadow_rgba(aligned, dx=20, dy=20, blur=12, opacity=160)
        sh_aligned.save(out/"aligned_shadow_1024"/f"{name}_shadow.png")

        # quick previews
        composite_on_bg(tight, bg=(12,12,12)).save(out/"previews"/f"{name}_tight_dark.png")
        composite_on_bg(tight, bg=(245,245,245)).save(out/"previews"/f"{name}_tight_white.png")

        # QC: border alpha check on aligned
        a = np.array(aligned.split()[-1])
        border = np.concatenate([a[0,:], a[-1,:], a[:,0], a[:,-1]])
        metrics[name] = {"align": am, "aligned_border_alpha_max": int(border.max())}

    # Sheets
    order_0_9 = ["0","1","2","3","4","5","6","7","8","9"]
    clean_paths = [out/"aligned_clean_1024"/f"{n}.png" for n in order_0_9]
    shadow_paths = [out/"aligned_shadow_1024"/f"{n}_shadow.png" for n in order_0_9]
    make_sheet(clean_paths, cols=5, bg=(15,15,15), out_path=out/"previews"/"sheet_0-9_clean_dark.png")
    make_sheet(shadow_paths, cols=5, bg=(245,245,245), out_path=out/"previews"/"sheet_0-9_shadow_white.png")

    qc = {
        "input": str(inp),
        "glyph_groups_found": int(n),
        "id_map": id_map,
        "bboxes_sorted": [(int(i), int(x0), int(y0), int(x1), int(y1), int(a)) for i,x0,y0,x1,y1,a in bboxes_sorted],
        "metrics": metrics,
    }
    (out/"qc_numbers.json").write_text(json.dumps(to_builtin(qc), indent=2), encoding="utf-8")

    # Zip everything
    zip_path = out.with_suffix(".zip")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for root,_,files in os.walk(out):
            for f in files:
                p = Path(root)/f
                z.write(p, arcname=str(p.relative_to(out)))
    print(f"Wrote: {zip_path}")

if __name__ == "__main__":
    main()
