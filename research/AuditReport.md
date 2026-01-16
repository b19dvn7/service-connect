# Evidence Audit Report

## Scope
Validate web-typography approach for a custom graffiti-style date/time mark that renders consistently across devices.

## Source set (screened in)
- MDN @font-face (https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)
- MDN font-display (https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- W3C WOFF2 spec (https://www.w3.org/TR/WOFF2/)
- Google Fonts FAQ (https://developers.google.com/fonts/faq)
- MDN SVG <text> (https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)

## Claim matrix summary
See `ClaimMatrix.csv` for claim-by-claim evidence, caveats, and confidence.

## Conflicts / gaps
- **WOFF2 support across legacy browsers**: W3C states "implemented in all major browsers" but does not enumerate versions. If legacy devices are critical, we need a compatibility matrix.
- **SVG filter support**: MDN notes SVG <text> can use filters; exact rendering fidelity varies. Needs device testing if filters are used for the graffiti effect.

## Assumptions
- Target browsers include modern evergreen browsers (Chrome/Edge/Firefox/Safari) on desktop/mobile.
- If a custom font is used, licensing is permitted for web embedding and redistribution as WOFF/WOFF2.

## Unknowns
- Exact user device/browser distribution and lowest supported versions.
- Whether the desired graffiti look can be achieved with a webfont alone or requires an SVG logo.

## What would increase confidence
- A device/browser compatibility test plan on actual target devices.
- Confirmed font license allowing web embedding and derivative work.

## Recommendation from evidence perspective
- Prefer **WOFF2 + WOFF fallback** with `font-display: swap` (or `optional`) and a safe fallback font.
- For exact “graffiti logo” fidelity, use an **SVG asset** for the date/time mark, and use a font only for fallback.
