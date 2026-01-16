# Inventor Brief — Custom Graffiti Date/Time Mark

## If you only do 3 things
1) Decide **font vs SVG** for the graffiti look (font = dynamic text, SVG = exact look).
2) If font: build **WOFF2 + WOFF** and load via `@font-face` with `font-display` (MDN) for fast render. (https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face, https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
3) Validate on target devices; if SVG filters are used, verify rendering across browsers (MDN SVG text). (https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)

## Objective & constraints
- Match a specific **graffiti/bubble** letter style for the date/time mark.
- Must render consistently across **desktop + mobile**.
- Keep it **fast** and **reliable** (no layout jumps).
- Respect **font licensing** for any third‑party font. (https://developers.google.com/fonts/faq)

## What’s known (with citations) + what’s uncertain
**Known**
- `@font-face` requires a `src` descriptor and supports references to font resources with format hints. (https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)
- `font-display` controls how fonts are displayed during load. (https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- WOFF2 is a standardized webfont format and is widely used in major browsers. (https://www.w3.org/TR/WOFF2/)
- Google Fonts are open source and free for commercial use (for fonts from Google Fonts). (https://developers.google.com/fonts/faq)
- SVG `<text>` can use gradients/patterns/masks/filters. (https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)

**Uncertain**
- Exact browser/device mix and whether **legacy** browsers require extra formats.
- Whether a **pure font** can match the exact graffiti outline, or if a **vector logo** is required.

## Options (2–4) with tradeoffs
| Option | Summary | Pros | Cons | Failure modes | Best for |
|---|---|---|---|---|---|
| A) Custom font (preferred for dynamic time) | Draw glyphs for JAN + digits in a font editor; export WOFF2+WOFF; load via `@font-face` | Dynamic date/time; consistent sizing; normal CSS layout | Requires font creation; licensing considerations | Font fails to load; layout jump | When you need live text and consistent style |
| B) SVG text + filters | Use `<svg><text>` and apply mask/filter to simulate graffiti outlines | Dynamic; fine‑tuned effects | Filters can render differently per browser | Visual mismatch on some devices | When you need dynamic text and custom texture |
| C) SVG asset (static or server‑rendered) | Use an SVG logo for the mark; update by regenerating image | Exact look | Hard to keep truly “live” without regeneration | Stale date/time | When exact art is more important than live time |

## Recommendation + rationale
**Recommendation: Option A (custom font) + WOFF2/WOFF + `font-display`**. It keeps the time live and gives the most consistent cross‑device behavior. Use SVG filters only if the font alone can’t reach the look.

## Safety / misuse review + mitigations
- **License risk**: If using a third‑party font, confirm web‑embedding rights; prefer open‑source fonts or a custom font. (https://developers.google.com/fonts/faq)
- **Compatibility risk**: Provide WOFF2 + WOFF and a fallback stack; test on target devices.

## Reproducibility notes
- Use a font editor (FontForge/Glyphs/Fontself) to draw the glyphs and export `woff2` + `woff`.
- Add CSS:
  ```css
  @font-face {
    font-family: "GraffitiDate";
    src: url("/fonts/GraffitiDate.woff2") format("woff2"),
         url("/fonts/GraffitiDate.woff") format("woff");
    font-display: swap;
  }
  ```
- Use the font on the date/time element and include fallback fonts.

## Next actions (ordered checklist)
1) Decide: **custom font vs SVG** (dynamic text required? choose font).
2) Create glyph set: `JAN`, digits `0–9`, separators.
3) Export **WOFF2 + WOFF** and place in `/public/fonts`.
4) Add `@font-face` with `font-display: swap` and fallback.
5) Test on at least one mobile + one desktop browser; adjust weight/outline.
6) If still not matching, add **SVG filters** or outline layers in CSS.
