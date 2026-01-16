#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

root = Path('/home/bigdan7/Projects/Service-Connect')

checks = [
    (root / 'client/public/fonts/glyph-sprite.png', 4, 3),
    (root / 'client/public/fonts/months-sprite.png', 4, 3),
]

for path, cols, rows in checks:
    img = Image.open(path).convert('RGBA')
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        raise SystemExit(f"{path} has no visible pixels")
    w, h = img.size
    if w % cols or h % rows:
        print(f"WARN: {path} size not divisible by grid: {w}x{h} vs {cols}x{rows}")
    print(f"OK: {path} size={w}x{h} bbox={bbox}")

print('Sprite checks complete.')
