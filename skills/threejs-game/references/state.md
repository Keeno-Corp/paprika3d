# game-state

The skill's game-state library: state in typed arrays, a generated `window.__game`, rewind, and Rapier in a worker (`state/` in the plugin). SKILL.md says when to use it.

game-state writes `window.__game` for you. Copy its files first, as SKILL.md says; import from `./game-state.js`; `three` stays the game's own import.

```js
import { createState, list, physics, loop } from './game-state.js';
const state = createState({                       // the observe() schema's shape, with defaults: observe() is state.toJSON()
  player: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, grounded: false },
  platforms: list(256, { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 }), // list(capacity, item defaults): numbers and booleans only
  coins: list(256, { x: 0, y: 0, z: 0 }),
  collected: 0, won: false,
  held: { left: false, right: false, jump: false }, // held keys live in the state too; extra keys beside the schema's are fine
});
// read and write it in that shape: state.player.x += 1; const c = state.coins.push({ x: 3 }); state.coins.remove(c);
const world = await physics(state, {              // Rapier, in a worker; leave physics out if the game needs none
  player: { size: [0.6, 1.8, 0.6], lockRotations: true }, // FULL sizes, as three.js: box [w, h, d], sphere [diameter], capsule [height, diameter]
  platforms: { size: p => [p.w, p.h, p.d], type: 'fixed' },
  coins: { shape: 'sphere', size: [0.8], sensor: true },
});
loop({ state, physics: world, tick, render, describe });
```

- `tick(inputs)` is the game's rules for one frame. `inputs` are the key events since the last frame (`{ key }` on press, `{ key, down: false }` on release, `key` being the `event.code`: `KeyW`, `Space`, `ArrowLeft`, whatever Shift or the layout; a held key's repeats are no new press) and `act()` objects. Read and write only `state` and `world`. Use `state.random()`, never `Math.random`. `tick` runs once per 1/60 s of game time whatever the display's rate (twice a frame at 30 fps, every other frame at 120), so treat one tick as 1/60 s and never read time. Only the first tick of a frame gets that frame's inputs.
- Lists iterate in order and have `length`, `at(i)`, `push(item)` (returns the item) and `remove(item)`; spread one (`[...state.coins]`) to `map` or `filter`. Removing the current item inside `for (const c of state.coins)` is safe.
- A body's options beside `shape` and `size`: `type` (`'dynamic'` by default, `'fixed'`, or `'kinematic'`, moved by `setVelocity`), `lockRotations`, `sensor`, `events`, and Rapier's own `friction` (default 0.5), `restitution` (0), `density` (1), `linearDamping` and `angularDamping` (0) and `ccd` (off; turn it on for a fast, small body that would pass through a thin wall).
- Bodies follow their item's `x/y/z`, `vx/vy/vz` and `qx/qy/qz/qw` when it has them, and start at the item's rotation, so a fixed ramp can be tilted; `push` and `remove` on a bound list add and remove bodies. `world.setVelocity(item, v)`, `world.impulse(item, v)`, `world.teleport(item, p)`. `world.events` lists the step's sensor overlaps, and contacts of bodies given `events: true`, as `{ a, b, started, sensor }` with items, so `e.a === state.player` works. `world.ray({ from: item, dir, maxToi })` is answered next frame in `world.hits` (an item or null), in the order queued.
- `render()` draws from the state each frame. Give meshes names, as usual. On a 100 or 120 Hz display some frames run no tick, so what is drawn straight from the state stutters: for what the player watches move, keep `const pose = game.between(() => [p.x, p.y, p.z])` from what `loop` returned and draw `pose()` in `render`. It is between the last two ticks, and exactly the newest one on the harness's clock.
- Call `loop` before any `renderer.compileAsync`: the first frame draws the plain scene, and the effects (`water()`, `foliage()`, `post()`, scan materials, a noise sky) join after it from `render`, each batch compiled with `compileAsync` and added when it resolves, never awaited before `loop` nor held with `__clock.hold` (`optimize.md`, Load time).
- Measure the staged load cold with `perf` or `open` and `network: "broadband"` (20 Mbps, 40 ms, no cache; `{ downKbps, upKbps, latencyMs }` for another), never a hand-written throttle: the first-visit line gives the first scene frame, the bytes before it, and whether a software renderer drew it (then only the bytes count).
- A river's `water({ flow })` moves what `float()` holds, so float logs, boats and the player's raft in `tick` (once a tick, after `water.update(seconds)` with the game's seconds kept in the store, ticks / 60), copy their x, z into the store, and keep that drift out of `render`; `water.current(x, z)` gives a raft's steering or a paddle the current to work against. A floating thing with its own physics body takes `drift: 0` and the current as a force instead.
- `loop` sets `window.__game`, listens for keys, and keeps a short rewind in memory: `back(n)` on what it returns. `setState` on a body's `x/y/z` teleports it and stops it, unless the same state gives `vx/vy/vz`. Nothing is written to disk.

## Its Rapier and the project's

Its `physics()` runs its own Rapier (`@dimforge/rapier3d-deterministic-compat` 0.21.0) in a worker file of 4.4 MB the game ships; `templates/rapier.ts` instead uses the project's own `@dimforge/rapier3d-compat` on the main thread, for a game that needs neither rewind nor a worker. The two are separate copies, so the project's version need not match the worker's. In a plain page, map it with `"@dimforge/rapier3d-compat": "./node_modules/@dimforge/rapier3d-compat/dist/rapier.mjs"` (the file in 0.20 and 0.21; 0.19 has `rapier.mjs` at its root, and any version's package.json names it in `module`), then `import RAPIER from "@dimforge/rapier3d-compat"; await RAPIER.init();`. Before using Rapier's character controller (moving platforms, a capsule that will not move), read the note at the top of `templates/rapier.ts`.
