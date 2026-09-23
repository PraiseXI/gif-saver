# GIF Saver

A small, phone-friendly website for previewing and saving direct GIF links. No account needed.

## Use

Paste a direct GIF URL (usually ending in `.gif`), select **Preview GIF**, then touch and hold the preview to save it to Photos or your gallery. **Download GIF** also works when the GIF host permits cross-origin downloads. On iPhone, browser downloads usually appear in Files → Downloads; touch-and-hold is the path to Photos.

GIF hosts may block previews or downloads. Web page links from GIF platforms are not direct GIF file links.

## Develop

```sh
npm ci
npm run build
npm run serve
```

Open http://127.0.0.1:8765. TypeScript source is in `src/`; Vite generates `dist/` for GitHub Pages.

## Verify

```sh
npx playwright install chromium
npm test
```

Tests use a real browser to check invalid links, GIF preview and downloaded bytes, blocked downloads, and non-GIF responses. GitHub Actions runs these checks before each deployment.
