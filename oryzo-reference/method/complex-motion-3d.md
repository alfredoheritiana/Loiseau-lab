# Complex Motion and 3D Clone Notes

Load this reference when a source site uses canvas, WebGL, Three.js, Rive, 3D product scenes, scroll-synchronized animation, compressed splats, shader-driven visuals, or large lazy-loaded media galleries.

## Core Lesson

Complex animated sites are often not "HTML plus CSS." They are small frontend runtimes that stream scene assets over time. A good clone must preserve the runtime and its asset graph:

- original HTML structure
- original CSS and JS bundles
- wasm runtimes
- 3D buffers and animation buffers
- texture folders
- Rive/Lottie files
- MSDF font atlases
- video/gallery assets
- local HTTP serving with correct MIME types

Do not judge completion from the first page load only. Many sites reveal missing resources only after scroll, hover, a preloader completes, a canvas scene initializes, or a product/gallery module becomes active.

## Resource Types To Treat As First-Class

Include these extensions in clone discovery and local server MIME handling:

- Runtime and app: `.html`, `.js`, `.mjs`, `.css`, `.json`, `.webmanifest`
- Images and texture maps: `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.svg`, `.ico`
- Fonts and text rendering: `.woff`, `.woff2`, `.ttf`, `.otf`, MSDF `.json` plus atlas `.png`/`.webp`
- 3D and animation data: `.buf`, `.bin`, `.glb`, `.gltf`, `.obj`, `.fbx`, `.riv`, `.lottie`
- GPU/compressed assets: `.ktx2`, `.basis`, `.hdr`, `.exr`, `.sog`, `.wasm`
- Media: `.mp4`, `.webm`, `.mov`, poster images
- Documents referenced by the UI: `.pdf`

Preserve directory structure for these assets. Runtime bundles often reference hard-coded paths such as `/models/table/DESK.buf` or `/textures/coffee/BASE_COLOR.webp`; flattening files will break them.

## Capture Strategy

1. Capture the initial source baseline:
   - rendered HTML
   - original HTML
   - `performance.getEntriesByType("resource")`
   - console logs and request failures
   - desktop/mobile screenshots
   - canvas count, canvas sizes, and obvious runtime globals

2. Exercise the source before finalizing inventory:
   - wait for preloaders
   - scroll through major sections
   - hover interactive hero/canvas areas
   - click tabs, product selectors, gallery thumbnails, video buttons, nav menu
   - record resource entries again after each interaction

3. Build a direct-reuse candidate:
   - keep original HTML, CSS, and JS unless they actively break local execution
   - remove analytics and tracking
   - rewrite same-origin paths to local paths
   - localize third-party runtime binaries only when they are normal public browser assets, such as a public Rive wasm URL

4. Verify locally and iterate:
   - serve through HTTP, not `file://`
   - open the local page with Playwright
   - read local 404s from console/request logs
   - download the exact missing same-origin resources
   - refresh and repeat
   - stop only when local 404s are gone or remaining failures are intentionally external/domain-bound

This iterative 404-driven loop is normal for 3D sites. A single static scrape often misses the majority of scene assets.

## Local Server Requirements

Use a local HTTP server with explicit MIME types:

- `.js`/`.mjs`: JavaScript module MIME
- `.wasm`: `application/wasm`
- `.buf`, `.bin`, `.riv`, `.sog`: `application/octet-stream`
- `.webmanifest`: manifest JSON
- `.woff2`: font MIME
- `.avif`, `.webp`, `.mp4`, `.webm`: correct media MIME

If the source uses wasm, module JS, WebGL buffers, Rive, or video, tell the user that direct `file://` opening is not a valid verification path.

## Common Failure Patterns

### "The page loads, then many new 404s appear"

This usually means the runtime reached a later preload phase. Continue the local 404 loop. The first wave may be hero assets; later waves may include table scenes, gallery videos, product configurator models, MSDF fonts, or compressed splats.

### "Preloader still exists"

Check whether the page is actually ready before forcing fixes:

- HTML/body classes such as `is-ready`
- main canvas exists and has viewport-sized dimensions
- text content is visible in the accessibility snapshot
- scroll works
- failed local resources are zero

Some sites keep a preloader canvas in the DOM as part of the transition or visual stack. Do not remove it until a concrete blocking behavior is proven.

### "Images report loaded 0/N"

Modern pages often use `<picture>`, CSS backgrounds, WebGL textures, canvas rendering, or lazy images. `document.images` is not enough for clone completeness. Prefer request logs, canvas presence, visual screenshots, and interaction tests.

### "Playwright screenshot times out"

Heavy WebGL pages may make screenshot capture slow or flaky. Split verification:

- first run metrics-only verification: title, canvas count, scroll, failed requests, console errors
- then try screenshots with longer timeouts
- do not block asset-completeness work on screenshot flakiness

### "Some public files fail randomly"

CDN/Cloudflare/TLS/DNS failures can be transient. Retry single failed resources several times with normal browser user-agent headers. If repeated failures persist, mark them in the report instead of hiding them.

### "Third-party service cannot be cloned"

Leave domain-bound services external or build a fallback:

- Vimeo/YouTube player: keep external iframe/player unless video file itself is public and directly accessible
- Google Maps: replace with local fallback if API key rejects localhost
- Adobe Typekit: localize CSS when possible; use local bundled fonts or fallback if font binaries are domain/session constrained
- analytics/tag managers: remove or stub

## Verification Targets For 3D Sites

Record these in `VERIFY.json` or the final report:

- local URL
- local failed request count
- console error count after filtering expected banners/browser warnings
- canvas count and sizes
- wasm/Rive/3D model files present
- scroll position after scripted scroll
- key interactive sections exercised
- output file count and approximate size
- remaining external services and why they were not localized

## Example Outcome Shape

For a complex WebGL clone, a good final report might say:

- Directly reused original HTML/CSS/JS.
- Localized WebGL models, textures, Rive files, wasm, splats, MSDF fonts, and gallery media.
- Served locally through HTTP because `file://` is invalid for module JS/wasm/binary scene assets.
- Verified with Playwright: 0 local failed requests, expected canvas count, scroll works.
- Left Vimeo/analytics/Typekit binaries external or fallback because they are third-party/domain-bound.
