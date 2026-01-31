#!/usr/bin/env python3
from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

def ink_bbox(gray: np.ndarray, ink_thresh: int) -> tuple[int,int,int,int] | None:
    mask = gray < ink_thresh
    if not mask.any():
        return None
    ys, xs = np.where(mask)
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    return x0, y0, x1, y1

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in-dir", default="glyph_png", help="Input directory with glyph PNGs")
    ap.add_argument("--out-dir", default="glyph_png_norm", help="Output directory")
    ap.add_argument("--canvas", default="512x512", help="Canvas size WxH, e.g. 512x512")
    ap.add_argument("--ink-thresh", type=int, default=245, help="Ink threshold")
    ap.add_argument("--bottom-margin", type=int, default=60, help="Margin from bottom where glyph 'sits'")
    ap.add_argument("--side-margin", type=int, default=40, help="Min margin left/right")
    args = ap.parse_args()

    cw, ch = args.canvas.lower().split("x")
    CW, CH = int(cw), int(ch)

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
        glyph = im.crop((x0, y0, x1, y1))

        gw, gh = glyph.size

        # Scale down if glyph is too large for canvas margins
        max_w = CW - 2 * args.side_margin
        max_h = CH - args.bottom_margin - 40  # top margin ~40
        scale = min(1.0, max_w / max(1, gw), max_h / max(1, gh))

        if scale < 1.0:
            glyph = glyph.resize((int(gw * scale), int(gh * scale)), Image.Resampling.LANCZOS)
            gw, gh = glyph.size

        # Create white canvas
        out = Image.new("L", (CW, CH), 255)

        # Horizontal center
        px = (CW - gw) // 2

        # Bottom-align: put glyph bottom at (CH - bottom_margin)
        py = (CH - args.bottom_margin) - gh

        # Paste (glyph is black on white)
        out.paste(glyph, (px, py))

        # Binarize for clean vectorization later
        out = out.point(lambda v: 0 if v < args.ink_thresh else 255)

        out_path = out_dir / p.name
        out.save(out_path)

    print(f"Normalized PNGs written to: {out_dir.resolve()}")

if __name__ == "__main__":
    main()
