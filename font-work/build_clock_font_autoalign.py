#!/usr/bin/env python3
import os
import fontforge

FONT_NAME = "JanGraffClock"
SVG_DIR = os.path.join(os.getcwd(), "glyph_svg")
OUT_TTF = os.path.join(os.getcwd(), f"{FONT_NAME}.ttf")

EM = 1000
ASCENT = 800
DESCENT = 200

ADV_DIGIT = 650   # lower = tighter
ADV_PUNCT = 360
TIGHTEN = 40      # 20..80

MAP = {
    "0": ord("0"), "1": ord("1"), "2": ord("2"), "3": ord("3"), "4": ord("4"),
    "5": ord("5"), "6": ord("6"), "7": ord("7"), "8": ord("8"), "9": ord("9"),
    "colon": ord(":"), "dash": ord("-"),
}

def import_and_clean(g, path):
    g.clear()
    g.importOutlines(path)
    g.correctDirection()
    g.removeOverlap()
    g.simplify()
    g.round()

def scale_to_ascent(g, frac=0.90):
    xmin, ymin, xmax, ymax = g.boundingBox()
    h = max(1.0, ymax - ymin)
    s = (ASCENT * frac) / h
    g.transform((s, 0, 0, s, 0, 0))

def baseline_align(g):
    xmin, ymin, xmax, ymax = g.boundingBox()
    g.transform((1, 0, 0, 1, 0, -ymin + 20))

def center_horiz(g, adv):
    xmin, ymin, xmax, ymax = g.boundingBox()
    gw = xmax - xmin
    dx = ((adv - gw) / 2.0) - xmin
    g.transform((1, 0, 0, 1, dx, 0))

def tighten(g, amount):
    if amount > 0:
        g.transform((1, 0, 0, 1, -amount/2.0, 0))

def main():
    f = fontforge.font()
    f.encoding = "UnicodeFull"
    f.em = EM
    f.ascent = ASCENT
    f.descent = DESCENT

    f.fontname = FONT_NAME
    f.familyname = FONT_NAME
    f.fullname = FONT_NAME

    added = 0
    for name, cp in MAP.items():
        path = os.path.join(SVG_DIR, f"{name}.svg")
        if not os.path.exists(path):
            continue

        g = f.createChar(cp)
        import_and_clean(g, path)
        scale_to_ascent(g, 0.90)
        baseline_align(g)

        adv = ADV_DIGIT if name.isdigit() else ADV_PUNCT
        g.width = adv

        center_horiz(g, adv)
        tighten(g, TIGHTEN)

        g.removeOverlap()
        g.correctDirection()
        g.round()
        added += 1

    if added == 0:
        raise SystemExit(f"ERROR: No glyphs imported. Expected SVGs in {SVG_DIR}")

    f.autoHint()
    f.generate(OUT_TTF)
    print("Wrote", OUT_TTF, "glyphs:", added)

if __name__ == "__main__":
    main()
