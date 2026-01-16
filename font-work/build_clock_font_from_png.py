#!/usr/bin/env python3
import os
import fontforge

FONT_NAME = "JanGraffClock"
PNG_DIR = "/home/bigdan7/Projects/Service-Connect/font-work/glyph_png_norm"
OUT_TTF = f"/home/bigdan7/Projects/Service-Connect/font-work/{FONT_NAME}.ttf"

EM = 1000
ASCENT = 800
DESCENT = 200

ADV_DIGIT = 650
ADV_PUNCT = 360
TIGHTEN = 40

MAP = {
    "0": ord("0"), "1": ord("1"), "2": ord("2"), "3": ord("3"), "4": ord("4"),
    "5": ord("5"), "6": ord("6"), "7": ord("7"), "8": ord("8"), "9": ord("9"),
    "colon": ord(":"), "dash": ord("-"),
}

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
        png = os.path.join(PNG_DIR, f"{name}.png")
        if not os.path.exists(png):
            continue

        g = f.createChar(cp)

        # Import bitmap, then autotrace to outlines
        g.importImage(png)
        g.autoTrace()

        g.correctDirection()
        g.removeOverlap()
        g.simplify()
        g.round()

        # Scale to ascent nicely
        xmin, ymin, xmax, ymax = g.boundingBox()
        h = max(1.0, ymax - ymin)
        s = (ASCENT * 0.90) / h
        g.transform((s, 0, 0, s, 0, 0))

        # Baseline align
        xmin, ymin, xmax, ymax = g.boundingBox()
        g.transform((1, 0, 0, 1, -xmin + 20, -ymin + 20))

        adv = ADV_DIGIT if name.isdigit() else ADV_PUNCT
        g.width = adv

        # Center horizontally in advance box
        xmin, ymin, xmax, ymax = g.boundingBox()
        gw = xmax - xmin
        dx = ((adv - gw) / 2.0) - xmin
        g.transform((1, 0, 0, 1, dx - (TIGHTEN/2.0), 0))

        g.removeOverlap()
        g.correctDirection()
        g.round()

        added += 1

    if added == 0:
        raise SystemExit("ERROR: No PNG glyphs imported from glyph_png_norm")

    f.autoHint()
    f.generate(OUT_TTF)
    print("Wrote", OUT_TTF, "glyphs:", added)

if __name__ == "__main__":
    main()
