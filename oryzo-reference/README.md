# ORYZO — Fidelity Benchmark (LOISEAU LAB)

This is an **isolated, non-published research harness** for measuring a future original reconstruction of [oryzo.ai](https://oryzo.ai/). It is **not** the Oryzo source project or the proprietary original asset bundle.

## Based on
- Source-first playbook: https://github.com/SkyNotSilent/true-web-clone (MIT-licensed workflow)
- Its public Oryzo case-study documentation: https://github.com/SkyNotSilent/true-web-clone/tree/main/examples/oryzo-ai
- Official AI Studio Build mode with GitHub import/sync: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## First run

From `oryzo-reference/`:

```bash
npm install
npx playwright install chromium
npm run capture
```

This captures the live public reference to `captures/source/`, including the rendered DOM, visible checkpoints, runtime indicators, public network resource URLs, and console/request failures. Playwright is required locally. Some GPU effects may differ under headless Chromium: verify with a real Chrome browser too.

Next, start **your own** reconstruction project on `http://127.0.0.1:3000` and run:

```bash
MODE=local URL=http://127.0.0.1:3000 npm run capture
npm run compare
```

Windows PowerShell:

```powershell
$env:MODE="local"; $env:URL="http://127.0.0.1:3000"; npm run capture
Remove-Item Env:MODE; Remove-Item Env:URL
npm run compare
```

See `GOOGLE_AI_STUDIO_PROMPT.md` for the reconstruction phase, and `CHECKLIST.md` for acceptance gates.

## What the public True Web Clone Oryzo report actually establishes

The author reports a previous *local test* with ~25 MB / 156 files / 107 special scene resources / six canvas and zero local failed requests. **Those output files are not included in the public GitHub repository.** Its `outputs/oryzo-true-web-clone/` path is a report of an earlier local output, not a downloadable directory.

Notable resource families in its case study: Astro bundles, Rive/WASM, `.buf` 3D animation buffers, `.sog` splats, textures, media and lazily loaded gallery files. Our initial captures **must not** be presented as a verified 100% clone.

## Separation from LOISEAU

Do not edit `src/App.tsx`, `src/scenes` or LOISEAU's live experience on this branch. Perform reference research and benchmarking here, then build a separately-owned implementation. No third-party Oryzo logos, proprietary models, fonts or original campaign content may be shipped in a published LOISEAU site without permission.

## Verification language

Report actual screenshot/error/network metrics for each tested view and interaction. Do not call the job `100% identical` without matching motion timelines, layout, responsive behavior, input states, resource requests, and performance on target devices. A zero-404 check alone is not enough.
