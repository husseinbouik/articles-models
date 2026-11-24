# Article Models — Parametric Door & Panel Configurator

> **Live demo:** https://husseinbouik.github.io/articles-models/
>
> A self-training side project on parametric configurator logic, by **Hussein Bouik**.

An interactive 3D configurator for made-to-measure furniture fronts — doors, panels, drawers and bins — built as a reusable React Three Fiber component library plus the demo app that drives it. Pick a model family, then shape it live: dimensions, depths, mid-rails, pivots, edge lines, materials and handles all update the procedural geometry in real time.

## Features

- **13 model families** (FA_1 – FA_8 variants), each generating doors, panels, drawers and bins from parameters — no static meshes
- **Procedural geometry** computed from width / height / depth, front & back depths, front panel width and mid-rail position
- **CSG handle cut-outs** — five procedural handle profiles (HL01–HL05) are subtracted from the slab with `@react-three/csg`
- **One real GLB handle** — the HLModel option swaps the procedural handles for a loaded glTF door knob (metallic PBR; the scene uses a PMREM `RoomEnvironment` so the metal actually reflects)
- **Live configurator UI** — model picker, dimension sliders, handler settings, edge-line controls, inner-panel materials, shadow toggle, dark/light themes
- **Performance-minded rendering** — `frameloop="demand"` (renders only on change), DPR capped at 2×

## Tech stack

- **React 18 + TypeScript** (Create React App)
- **React Three Fiber + drei** for the 3D scene, **three.js** underneath
- **@react-three/csg** for boolean handle cut-outs
- **MUI (Material UI)** for the configurator panels
- **Rollup** for the library build (`src/lib` → `dist`)

## Run it locally

```bash
npm install
npm start          # demo app on http://localhost:3000 (root base)
```

Production builds:

```bash
npm run build          # root base — for serving from a domain root
npm run build:pages    # base /articles-models/ — the GitHub Pages build
npm run rollup         # library build only (dist/)
```

The base path is environment-driven: CRA's `PUBLIC_URL` decides where asset
URLs point. `build` leaves it at the root; `build:pages` sets
`PUBLIC_URL=/articles-models` for the Pages deployment. The GLB handle URL is
built from `PUBLIC_URL` (`<base>/models/handles/door_handler_demo.glb`) and the
file is copied from `public/` into every build.

## Project layout

- `src/lib/` — the configurator library: model families (`components/models/FA_*`), handle profiles (`components/handlers/`), the configurator state (`context/DoorContext`) and the panel UI (`components/Interface`)
- `src/App.tsx` — the demo app: canvas, studio lighting/environment and the showcase header
- `public/models/handles/door_handler_demo.glb` — the real handle model used by the HLModel option

## Notes

- Door face materials load a wood texture from a CDN URL in the demo app; if that URL is unreachable the texture simply stays untextured.
- Model dimensions are in millimetres, scaled ×0.1 in the scene.

## Credits

Created by **Hussein Bouik** as a self-training side project on parametric configurator logic.

The door-knob GLB is a third-party Sketchfab asset (CC-BY-4.0, by pipotgrz1885; attribution embedded in the file).
