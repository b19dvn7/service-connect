# Sprite Runbook

## Build
- Ensure source assets are present:
  - `font-work/graffiti_numbers_cleaned_pack/aligned_clean_1024/0.png`..`9.png`
  - `font-work/months_outline_sets/white_outline/JAN.png`..`DEC.png`
- Run the build script (manual):
  - Rebuild digits sprite from aligned_clean_1024 with 4x3 grid and blank tiles for `:` and `-`.
  - Rebuild months sprite from white_outline with 4x3 grid.

## Verify
- Run: `python3 font-work/check_sprites.py`
- Hard refresh `http://localhost:5000` (Ctrl+Shift+R)

## Troubleshoot
- If months are missing: ensure `--month-w`/`--month-h` are set in `.sprite-clock`.
- If sprites look cached: bump `?v=` in `client/src/styles/graff.css`.

## Rollback
- Restore previous sprites from git or rebuild using the prior `numbers_singles` set.
