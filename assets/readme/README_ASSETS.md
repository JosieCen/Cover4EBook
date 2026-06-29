# README Asset Shot List

This file is the shot list and provenance record for repository-local README visuals. The Playwright capture flow regenerates the application screenshots and workflow graphic. The three gallery covers are final static artwork and are not overwritten by that flow.

## Recommended assets

| File | Recommended size | What to capture | Where it is used |
| --- | --- | --- | --- |
| `hero.png` | 1600 x 900 | A polished full-width studio screenshot showing the input panel, generated variants, and live cover preview in one frame | README hero section |
| `workflow.png` | 1400 x 840 | A clean visual of the end-to-end flow, ideally showing source text, variant generation, editor, and export result in a single composite image | Demo gallery and workflow support |
| `gallery-1.png` | 1024 x 1536 | *The Secret Garden* as a vintage illustrated children's book cover | Demo gallery |
| `gallery-2.png` | 1024 x 1536 | *The Secret Garden* as a cinematic mysterious garden poster | Demo gallery |
| `gallery-3.png` | 1024 x 1536 | *The Secret Garden* as an elegant literary paperback cover | Demo gallery |
| `editor.png` | 1600 x 1000 | The editor UI while a text layer is selected, so drag handles, font controls, and inspector options are visible | Demo gallery |

## Capture guidance

- Use real in-app screenshots for `hero.png` and `editor.png`.
- Prefer one consistent window size and browser chrome style across all captures.
- Keep the hero shot bright, readable, and centered on the cover preview.
- Keep gallery images as portrait cover artwork that remains legible on GitHub without opening the image.
- For the editor shot, make sure the title and author controls are visibly active.
- If you later add an animated demo, keep it as an additional asset instead of replacing the static hero image.

## Asset provenance

| Asset | Source |
| --- | --- |
| `hero.png` | Playwright screenshot of the real local application using upload mode and deterministic demo artwork |
| `editor.png` | Playwright screenshot of the real local application with the title layer selected |
| `workflow.png` | Deterministic HTML/CSS composition rendered to PNG by Playwright |
| `gallery-1.png` | Static README artwork generated with the Codex built-in image generation tool; underlying model identifier is not exposed |
| `gallery-2.png` | Static README artwork generated with the Codex built-in image generation tool; underlying model identifier is not exposed |
| `gallery-3.png` | Static README artwork generated with the Codex built-in image generation tool; underlying model identifier is not exposed |

The gallery assets are build-time documentation artwork only. They do not change Cover4EBook's runtime behavior, call the project API, or create a dependency on a Codex or ChatGPT login session.

## Suggested capture checklist

1. Run `scripts/capture_readme_assets.ps1` with the existing project dependencies installed.
2. The script enables `COVER4EBOOK_ACCEPTANCE_MOCK=1` and captures `hero.png`, `editor.png`, and `workflow.png`.
3. The script verifies that all six README assets exist and fails if any are missing.
4. Replace the gallery PNG files directly when new final cover artwork is approved; the Playwright flow intentionally leaves them unchanged.
