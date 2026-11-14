# NUCLEUS.IO

A flyable 3D portfolio: pilot a spaceship through a neon void, open project orbs, and collide with physics text.

**[Live demo](https://nucleus-io.vercel.app)**

![NUCLEUS.IO — spaceship in front of neon ROY WANG lettering](docs/preview.jpg)

## What it is

NUCLEUS.IO is Roy Wang's developer portfolio as a small WebGL world. Flight has inertia. Glass orbs open the projects. Neon lettering scatters when you hit it. A garbage-collector ring and a few orbiting bugs are there as toys, not a difficulty curve.

`WASD` fly · `Shift` / `Ctrl` up and down · `Space` boost · mouse aim · `R` reset.

## On a phone

The first visit with a coarse pointer opens Projects after load. Close the list and the browser remembers. Cards link to a public repo or demo. A project with no public URL shows Unavailable or In Development instead of an empty link row.

## Highlights

- Post stack written in GLSL: bloom, vignette, chromatic aberration, film grain, and a boost-time radial blur
- Sound synthesized in the Web Audio API — no sample files
- Project orbs, a garbage-collector ring for “memory leak” cubes, and orbiting bugs
- Neon 3D text with impact physics

## Tech

Vanilla ES modules, [Three.js](https://threejs.org/) 0.160, and [Vite](https://vitejs.dev/). Three is the only npm dependency; the page also ships a CDN import map so the modules resolve in the browser.

## Run locally

Use Node.js 18 or 20+ and a browser with WebGL2. The committed lockfile
resolves Vite 5.4.21 (`^18.0.0 || >=20.0.0`) and Rollup 4.64.10
(`>=18.0.0`); these are dependency compatibility declarations, not evidence
that every Node version was tested. The local validation used Node.js
24.22.1 and npm 11.19.1; Node 18 execution has not been verified.

```bash
npm ci --no-audit --no-fund
npm run dev -- --host 127.0.0.1 --strictPort --port 3000
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Run these commands from
the repository root. `npm ci` uses `package-lock.json`, and `npm run dev`
uses the installed local Vite binary. `--strictPort` fails if the port is
occupied instead of silently selecting another port; explicitly choose a
free port if needed. Stop the server with Ctrl+C.

Serve it over HTTP: `file://` is not a supported local entry. An internet
connection is still needed for the external font resources. A local Vite
server alone does not make this an offline application.

```bash
npm run build
```

The build checks bundling only. `npm test` runs Node's built-in tests for
short reset input pulses, input clearing, and the bounded motion-preference
policy; it does not run a browser. See [motion preference](docs/MOTION_PREFERENCE.md)
for its behavior and remaining limits, and
[local technical validation](docs/TECHNICAL_VALIDATION.md) for the browser
checks, failure cases, and evidence limits.

## Known limitations

- **There is no fallback screen when WebGL is unavailable.** Renderer
  initialization fails; dismissing the loading overlay does not restore the
  application. Use a WebGL2-capable browser.
- Reduced motion is bounded to grain/boost warp and environment decoration.
  Gameplay, camera motion and existing CSS animations remain; this is not a
  complete reduced-motion or WCAG conformance claim.
- Node 18 has not been executed for validation. Physical phones, other GPUs,
  cross-browser behavior and the 390px layout have not received full acceptance.
- Unit tests use synthetic input and GPU-construction fixtures. Passing tests
  and a build do not establish a browser, whole-product or production pass.
  The build's existing chunk-size warning remains visible.

The live demo is a separate deployment; local preparation does not establish
that it serves this revision.
