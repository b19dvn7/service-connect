#!/usr/bin/env python3
from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

def ink_bbox(gray: np.ndarray, ink_thresh: int):
    mask = gray < ink_thresh
    if not mask.any():
        return None
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in-dir", default="glyph_png")
    ap.add_argument("--out-dir", default="glyph_png_norm")
    ap.add_argument("--canvas", default="512x512")
    ap.add_argument("--ink-thresh", type=int, default=245)
    ap.add_argument("--target-height", type=int, default=380, help="Desired glyph ink height in px")
    ap.add_argument("--bottom-margin", type=int, default=70, help="Distance from bottom to baseline")
    ap.add_argument("--side-margin", type=int, default=40)
    ap.add_argument("--keep-pad", type=int, default=10, help="Extra pad around ink when cropping")
    args = ap.parse_args()

    CW, CH = map(int, args.canvas.lower().split("x"))

    in_dir = Path(args.in_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    pngs = sorted(in_dir.glob("*.png"))
    if not pngs:
        raise SystemExit(f"No PNGs found in {in_dir}")

    for p in pngs:
        im = Image.open(p).convert("L")
        arr = np.array(im)

        bb = ink_bbox(arr, args.ink_thresh)
        if bb is None:
            continue

        x0, y0, x1, y1 = bb
        # add a little safety pad inside each glyph crop
        x0 = max(0, x0 - args.keep_pad)
        y0 = max(0, y0 - args.keep_pad)
        x1 = min(arr.shape[1], x1 + args.keep_pad)
        y1 = min(arr.shape[0], y1 + args.keep_pad)

        glyph = im.crop((x0, y0, x1, y1)).convert("L")
        gw, gh = glyph.size

        # Scale to target ink height (scale up or down)
        scale = args.target_height / max(1, gh)
        new_w = max(1, int(round(gw * scale)))
        new_h = max(1, int(round(gh * scale)))
        glyph = glyph.resize((new_w, new_h), Image.Resampling.LANCZOS)
        gw, gh = glyph.size

        # If too wide, downscale to fit canvas margins
        max_w = CW - 2 * args.side_margin
        if gw > max_w:
            scale2 = max_w / gw
            glyph = glyph.resize((max(1, int(gw * scale2)), max(1, int(gh * scale2))), Image.Resampling.LANCZOS)
            gw, gh = glyph.size

        # Create white canvas
        out = Image.new("L", (CW, CH), 255)

        # Center horizontally
        px = (CW - gw) // 2

        # Baseline alignment: put bottom of glyph at (CH - bottom_margin)
        py = (CH - args.bottom_margin) - gh

        out.paste(glyph, (px, py))

        # Hard binarize
        out = out.point(lambda v: 0 if v < args.ink_thresh else 255)

        out.save(out_dir / p.name)

    print(f"Normalized PNGs written to: {out_dir.resolve()}")

if __name__ == "__main__":
    main()
