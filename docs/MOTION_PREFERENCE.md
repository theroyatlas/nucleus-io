# Bounded motion preference contract

This is a functional accessibility adaptation, not a new visual direction or
complete reduced-motion/WCAG conformance claim.

- Read the real `matchMedia('(prefers-reduced-motion: reduce)')` before scene
  rendering starts. Observe its `change` event; switching preferences needs no
  reload or additional UI toggle.
- Under `no-preference`, retain the existing quality flags, shader programs,
  environment animation, CSS, camera, input and flight physics.
- Under `reduce`, disable film grain and boost warp passes. Their time/speed
  uniforms stop advancing; warp speed is cleared. Leave bloom, vignette,
  chromatic aberration, tone mapping and palette unchanged.
- Freeze `updateEnvironment` in place: nebula rotation and shader time, cosmic
  dust drift/breathing, grid time, nebula ring rotation, star-cluster pulses,
  filaments, pillars, horizon arcs and deep-field halos. Resume from the frozen
  state using the next frame's ordinary dt; do not catch up elapsed wall time.
- Keep the requestAnimationFrame/composer loop, flight controls, trail,
  collision physics, game mechanics and collection feedback running.
- Treat preference as a mask over the **current** quality tier. A preference
  change never writes localStorage, selects high quality, resets bloom
  intensity, or enables a pass disabled by the current low/medium tier.
  Explicit quality changes also obey the active preference mask.
- Scope limit: existing CSS entrance/loader/HUD animations, camera following,
  user-selected cinematic navigation, collision shake, orbiting gameplay
  objects and explosion feedback are unchanged. A wider motion alternative
  needs a separately bounded product decision and tests.

## Favicon

The page had no explicit favicon; the browser could request `/favicon.ico`
implicitly and receive 404. `rel="icon" href="data:,"` declares an empty icon
without making an HTTP image request. No icon artwork or asset was generated.
The local headless evidence recorded the explicit data URL and no favicon
response/failure or console error. It did not record a complete request ledger,
and the same headless baseline did not reproduce the implicit request. This
does not prove zero initiated requests or cross-browser network suppression.

## Validation boundary (2026-11-11, batch 2b)

`npm test`: 14 reported tests (the original parent plus five reset subtests,
and a new parent plus seven motion subtests). GPU construction is a fixture in
the motion unit harness; Three math/objects and production scene/vfx source
are exercised with synthetic fixtures. Original reset tests and assertions are
unchanged.

Live installed Edge/ANGLE/D3D11 checks cover 1280 x 800 and 390 x 844, both
initial media preferences, preference changes/restoration, quality interaction,
render progress and trusted W input while reduced. Before/after screenshots
are technical evidence, not visual acceptance. External CSS fonts were replaced
with empty local responses and the CDN Three font with the identical installed
Three font file; the test made no external font request. Font-dependent icons
and typography in these screenshots are therefore not production evidence.

The BOOST experiment uses synthetic initial conditions and runs the actual
app loop and `updateShip` with trusted W
versus W+Space keyboard events, a controlled RAF queue, dt=1/60, VIPER multiplier
1, identical direction, position [1000,1000,-1000] away from collisions, and
initial velocity [0,0,7]. For n frames, q=exp(-10/60), target T=40 or 100:

    v(n) = T + (7 - T) * q^n
    z(n) = -1000 + (n*T + (7-T)*q*(1-q^n)/(1-q)) / 60

An external Python calculation checks all 180 frames per trace. The first
speed ratio is about 1.763386; at frame 180 it is about 2.5. The nonzero initial
velocity and exponential damping explain why the first ratio is not 2.5.
Space alone is only a negative control, not the acceleration proof. This is a
controlled browser experiment, not a wall-clock flight benchmark.

Node 24.22.1 ran tests/build. Node 18 execution remains unverified;
no runtime or global dependency was downloaded. No-WebGL fallback and the 390px
layout remain unchanged and await the owner's decision. This batch is author
verification, not independent acceptance or a production/deployment pass.
