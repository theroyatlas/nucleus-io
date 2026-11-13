# Local technical validation

The procedure/results below describe the first validation batch. Batch 2b
adds a bounded motion preference policy and an empty favicon declaration;
see [the current contract and evidence limits](MOTION_PREFERENCE.md). Node 18,
no-WebGL fallback and physical mobile acceptance remain unverified/unresolved.

This is implementation verification, not independent acceptance or a visual
assessment. No product styling, copy, colors, animation design, or gameplay
mechanism was changed for this validation.

## Reproduce the local entry

1. From the repository root, run `npm ci --no-audit --no-fund`.
2. Run `npm run dev -- --host 127.0.0.1 --strictPort --port 3000`.
3. Open `http://127.0.0.1:3000/` in a WebGL2-capable browser. External font
   resources require network access. Wait for the loading overlay to clear.
4. Run `npm run build` separately to check bundling. It does not validate
   interactions or accessibility. Run `npm test` for the Node built-in reset
   input regression tests; no external test framework was installed.
5. Stop the server with Ctrl+C. Do not use `file://` or an unpinned `npx vite`.

The 2026-11-11 run used a free port, 4317, via the same CLI override. Node
24.22.1 / npm 11.19.1 were actually executed. Node 18 compatibility is based
only on the installed lockfile packages' engine declarations (Vite 5.4.21:
`^18.0.0 || >=20.0.0`; Rollup 4.64.10: `>=18.0.0`). A Node 18 runtime run
remains unverified. Do not equate those declarations with a runtime pass.

## Browser procedure

Use isolated browser contexts at 1280 x 800 and 390 x 844. For each size,
test both `prefers-reduced-motion: no-preference` and `reduce`, with WebGL
available and with WebGL context creation forced to return null. Save the
original rendered page, console errors, failed requests, and input events.

- For normal rendering, inspect the application's renderer context, WebGL
  version, and unmasked GPU renderer. Do not label software rendering as a
  hardware GPU test.
- Use browser keyboard input (hold/release W and Space, then R), recording
  `isTrusted`, key state, position, and velocity before/while/after input.
- In a touch-enabled mobile context, send browser touch start/move/end to
  the joystick and UP button, then tap RESET. Record `isTrusted`, joystick
  state, key state, position and rotation. This is browser touch emulation,
  not physical phone acceptance. A mouse click on a button is not touch
  evidence.
- Set reduced motion through browser media emulation before navigation.
  Confirm the actual `matchMedia` result and compare render frame and
  animation time samples. Do not replace `matchMedia` with a fake function.
- For the no-WebGL case, before application scripts run, intercept only
  `getContext('webgl'|'webgl2'|'experimental-webgl')` on canvas prototypes
  and return null. Keep other context types intact. Do not replace the
  product DOM, renderer, or fallback content. Record the rejected context
  requests and preserve the actual failure screenshot, even if blank.

The implementation worker's raw browser records and screenshots are held
outside the repository. They include the test driver and console data;
they are not published by this change.

## Known limitations

The baseline browser run exposed a missed-reset bug: a trusted keyboard R
press/release or touch RESET tap completed between frames, clearing the key
before `updateShip` read it. The fix retains that reset request until the
next ship update. Held-key behavior is preserved; blur, command clearing,
and touch cancellation discard pending input. The regression tests cover
short keyboard/touch pulses, consumption, ordinary movement, text input,
focus loss, and cancellation. These synthetic Node event fixtures are not browser
input evidence. The original failing `npm test` placeholder output was
retained externally before adding the focused tests.

The final cold-server check used installed Microsoft Edge in headless mode,
reporting WebGL2 on NVIDIA GeForce RTX 5060 Ti through ANGLE / Direct3D11.
All four available-WebGL size/preference combinations recorded movement,
released input, and restoration to the starting position after a short reset.
The four forced-no-WebGL combinations retained the initialization error and
the original page screenshot. Twenty final screenshots cover the eight
combinations; earlier baseline and failed instrumentation records remain
separate. This does not declare all product requirements passed.

- There is no dedicated no-WebGL fallback: renderer initialization throws
  before input and UI setup. The emergency timer only dismisses the loading
  overlay after eight seconds; it does not recover initialization.
- At the first-batch baseline, the source did not handle reduced motion.
  Batch 2b now masks grain/warp and freezes environment decoration while
  preserving the game/render loop, as specified in the linked contract.
- Adding fallback UI or extending motion adaptation beyond that bounded
  contract still needs an owner-approved product decision.
- Build output can warn that a minified chunk exceeds 500 kB. The warning
  was retained; no threshold was raised to hide it.
- First-batch available-WebGL runs recorded no JavaScript page errors, but
  recorded a missing `favicon.ico` (HTTP 404). Batch 2b declares an empty data
  icon instead of creating new artwork; see its narrower browser evidence.
- Headless browser results, viewport emulation, dependency engine metadata,
  and successful bundling are separate evidence categories. They do not
  prove physical mobile behavior, every GPU, every supported Node version,
  offline operation, or production deployment.
