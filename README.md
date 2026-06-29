# Cover4EBook

Cover4EBook is a direct-to-studio web app for generating ebook covers for books that do not already have one. The app accepts a story mood brief, a novel excerpt, or a direct natural-language description, generates multiple cover-art variants with OpenAI image generation, lets the user restyle and reposition title and author text on top of the artwork, and exports the final cover to local files.

## Product Shape

- One full-stack Next.js App Router app.
- Direct studio entry instead of a marketing landing page.
- Anonymous single-user workflow with local draft persistence in IndexedDB.
- Server-side OpenAI image generation.
- `OPENAI_API_KEY` is read only on the server and is never exposed to the frontend bundle.
- No attempt is made to reuse any Codex or ChatGPT login session for image generation.
- Browser-side title and author overlays that remain editable until export.
- Manual line breaks for title and author text.
- Direct canvas resize handles for text boxes so the overlay width and type size can be adjusted visually.
- Expanded font palette including Chinese classic styles, English editorial styles, and more artistic display options.
- Export formats: `png`, `jpg`, `webp`, `pdf`.
- Upload-background fallback mode for cases where the user wants to supply their own base artwork and skip the API.

## Main Folders

- `src/app` - App Router pages, global styles, and API routes.
- `src/components/studio` - the main creative studio UI.
- `src/lib` - shared types, prompt composition, OpenAI integration, IndexedDB helpers, and export utilities.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file from `.env.example` and provide `OPENAI_API_KEY`.
3. Start the app:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Environment Contract

- `OPENAI_API_KEY` - required for server-side image generation.
- `OPENAI_IMAGE_MODEL` - optional image model override. Default is `gpt-image-1`.
- `OPENAI_IMAGE_QUALITY` - optional quality override. Default is `high`.
- `COVER4EBOOK_ACCEPTANCE_MOCK` - optional server-side mock mode for browser acceptance runs. Default is `0`.

## Studio Workflow

1. Enter the book title and author.
2. Choose one source mode:
   - `story_mood`
   - `excerpt`
   - `direct_description`
3. Add source text.
4. Choose a curated art direction preset and optional style override.
5. Generate three cover variants.
6. Select a variant and adjust title and author directly on the canvas or in the inspector.
7. Export the composed cover.

Text editing details:

- Use the inspector text areas to place manual line breaks exactly where you want them.
- Drag the title or author blocks directly on the canvas to reposition them.
- Drag the resize handle on a selected text block to change the text box width and the content size directly on the canvas.
- Adjust title and author colors independently in the inspector.
- Choose from serif, sans, Chinese classic, script, poster, and editorial font styles.

For the no-API fallback:

1. Switch to `Upload background`.
2. Choose an image file from local disk.
3. The uploaded image becomes the active cover art layer.
4. Continue editing title and author overlays, then export normally.

## Persistence

- Drafts are stored locally in IndexedDB.
- The active project id is remembered in local storage.
- No login or cloud project storage is included in v1.

## Export Notes

- The app always exports from a browser-side composed canvas.
- `showSaveFilePicker` is used when the browser supports it and the user grants access.
- Browsers without that capability fall back to the standard download flow.
- Pure web deployment cannot silently write arbitrary local paths in the background.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test
```

## Browser Acceptance

Playwright acceptance is configured to prefer local Microsoft Edge with `channel: "msedge"`. If Edge is not available, the config falls back to Playwright Chromium.

The screenshot acceptance flow covers these states:

- homepage
- generated state
- editing state
- export state
- upload-background fallback state

Run the retained acceptance script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_playwright_acceptance.ps1
```

Screenshots are written to `output/playwright/screenshots/`.

## Open Source Safety

The repository ignore rules intentionally exclude local environment files, logs, certificates, keys, local databases, private directories, and generated outputs so API keys, credentials, and personal machine artifacts are not committed when the project is published to GitHub.

`next build` is expected to work in a normal environment. In this specific Windows sandbox, the build directory can be locked by the host and cause `EPERM` during `rename/unlink`.
