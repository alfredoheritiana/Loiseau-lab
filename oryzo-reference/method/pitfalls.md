# True Web Clone Pitfalls

Load this reference when a local clone looks close but has blank sections, missing animations, failed scripts, wrong assets, or non-smooth interactions.

If the site uses canvas, WebGL, Three.js, Rive, 3D models, compressed splats, wasm, or scroll-driven 3D scenes, also read `complex-motion-3d.md`. Those sites often need iterative runtime-resource discovery, not just static HTML/CSS/JS capture.

## Direct Reuse Limits

- Public frontend files can usually be reused: HTML, CSS, JS bundles, images, SVG, fonts, video files, Lottie JSON, and public JSON payloads.
- Server behavior usually cannot be reused: form submission, booking flows, authenticated APIs, WordPress nonce-protected admin AJAX, dashboards, payments, private feeds, and CMS writes.
- Third-party services often bind keys to the original domain. Google Maps commonly fails locally with `RefererNotAllowedMapError`. Keep map containers and location data, then build a local fallback instead of using the original key.
- Tracking, ads, cookie consent, tag managers, and social pixels should normally be blocked or stubbed.

## Resource Rewrite Pitfalls

- Do not rewrite `https://example.com/...` into malformed paths like `https:assets/...`.
- Rewrite escaped JSON URLs such as `https:\/\/example.com\/path\/asset.json`.
- Cover `srcset`, `poster`, CSS `url(...)`, inline `style`, `data-src`, `data-json`, and plugin-specific data attributes.
- Keep enough directory structure or hashed filenames to avoid collisions.
- Verify resource completeness with the browser's failed request log, not just by checking files on disk.

## Motion Pitfalls

- If `window.gsap`, `window.ScrollTrigger`, `window.Swiper`, `window.lottie`, or `window.lenis` is absent locally but present on the source site, the clone is not motion-complete.
- Original theme JS may require exact DOM shape, global config variables, script order, and plugin markup. Fix those before replacing all motion.
- Lottie may need JSON paths rewritten inside attributes or JS config.
- Swiper may render markup but have no instance. Check `el.swiper`, not only `.swiper` nodes.
- Too many `ScrollTrigger` scrub animations can make a clone feel worse than the source. Use scroll-scrub only where the original visibly needs continuous scroll binding.
- Custom smooth scroll often feels worse than Lenis or the source library. Prefer the detected source library.

## Visual Gaps That Are Not Normal Assets

- Blank map block: likely domain-bound Google Maps or another map SDK.
- Blank social/feed grid: likely server-side feed API, token, or CORS issue. Use downloaded public thumbnails and fallback cards.
- Missing hero media: check video poster, `source`, lazy-load attributes, and WebP/AVIF variants.
- Loader never exits: original JS crashed before removing loader; force body visible and disable loader only after capturing the failure.
- Fonts wrong: check `@font-face` URL rewriting and MIME type from the local server.
- Blank or incomplete canvas scene: check missing `.wasm`, `.riv`, `.buf`, `.bin`, `.glb`, `.sog`, texture folders, MSDF font atlases, and late-loaded resources exposed only after scroll/hover.
- Screenshot timeout on a heavy canvas page: run a metrics-only verification first, then retry screenshots with longer timeouts.

## Verification Checklist

- Serve through local HTTP, not only `file://`.
- Capture source and clone screenshots at desktop and mobile widths.
- Record console errors, console warnings, and request failures.
- Check loaded image count against total image count.
- Check local script/style count.
- Check runtime library globals and actual rendered animation nodes.
- Check canvas count, canvas dimensions, wasm/model/texture request status, and whether scripted scroll triggers more local 404s.
- Scroll, hover, and click through core sections before calling the clone complete.
