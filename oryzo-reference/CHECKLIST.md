# Fidelity gates: Oryzo reference → independently implemented prototype

| Gate | Evidence needed | Status |
| --- | --- | --- |
| Public baseline | Captures at desktop 1440×900 and mobile 390×844 | NOT RUN |
| Initial runtime | Canvas count, sizes, errors, source resource list | NOT RUN |
| Late-loading | Scroll all sections and record post-scroll assets | NOT RUN |
| Interactivity | Menu, text/hover, configurator, message flip, gallery, video and buttons | NOT RUN |
| Visual static | Same viewport/scroll screenshot alignment, documented pixel-diff | NOT RUN |
| Scroll/motion | Compare timelines at equivalent normalized scroll checkpoints and user inputs | NOT RUN |
| Responsive | Test 390, 768, 1024, 1440 widths and reduced-motion | NOT RUN |
| Reliability | Zero critical console errors and no local 404s after full interactions | NOT RUN |
| Independence | Production assets and code are original/licensed | NOT RUN |

## Important facts, not assumptions
- True Web Clone is a **Codex skill/playbook**, not an importable finished Oryzo website.
- Its public Oryzo sample contains verification notes, not the original local 156-file clone.
- Google AI Studio supports importing an app's existing GitHub code, but does **not** automatically execute a Codex skill merely because it is imported.
- The source DOM or a screenshot cannot reveal the complete GPU motion logic, texture graph and lazy-loaded assets.
- Browsers/GPUs may produce non-deterministic per-pixel output even for functionally equivalent WebGL rendering.

## Section-specific checklist
1. Intro/preloader → exact timing, loader exit, camera transitions.
2. Hero object → camera framing, motion and pointer response.
3. Editorial sections → spacing, pinned sections, animated text.
4. Interactive hand / Rive → gesture result and event states.
5. Wearable/gallery → assets, interaction, transitions.
6. Feature data / encipher UI → controls, state changes.
7. Reviews and product variants → selection states.
8. Footer/contact → layout and navigation.
9. Touch UX → gesture parity and fallback controls.
10. A11y/performance → focus, reduced-motion, mobile GPU fallbacks.

## Progress reporting
For every gate, attach the screenshot directory and `network.json` path. Record each failure with reproducible steps. An Oryzo-specific design system is **not** a LOISEAU design system.
