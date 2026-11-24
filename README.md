# @oak-some/special-kms

A reusable 3D door configurator library for React applications built on top of [React Three Fiber](https://docs.pmnd.rs/react-three-fiber). It provides a single `SpecialKms` component that renders fully configurable 3D cabinet door, panel, bin, and drawer models with support for custom materials, handles, and dimensions.

---

## Table of Contents

- [Installation](#installation)
- [Peer Dependencies](#peer-dependencies)
- [Quick Start](#quick-start)
- [SpecialKms Props](#specialkms-props)
- [Available Models (cpid)](#available-models-cpid)
- [Materials](#materials)
- [Handler Configuration](#handler-configuration)
- [Door Cuts](#door-cuts)
- [Full Example](#full-example)
- [TypeScript](#typescript)

---

## Installation

**1. Create or update `.npmrc` in your project root:**

```
@oak-some:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Generate a token at [github.com/settings/tokens](https://github.com/settings/tokens) with the `read:packages` scope.

**2. Install the package and its peer dependencies:**

```bash
npm install @oak-some/special-kms @react-three/fiber @react-three/drei @react-spring/three @react-three/csg three @mui/material @emotion/react @emotion/styled
```

---

## Peer Dependencies

| Package | Version |
|---|---|
| `react` | `>=18.0.0` |
| `react-dom` | `>=18.0.0` |
| `@react-three/fiber` | `>=8.0.0` |
| `@react-three/drei` | `>=9.0.0` |
| `@react-three/csg` | `>=4.0.0` |
| `@react-spring/three` | `>=10.0.3` |
| `@mui/material` | `>=5.0.0` |
| `@emotion/react` | `>=11.0.0` |
| `@emotion/styled` | `>=11.0.0` |
| `three` | `>=0.160.0` |

---

## Quick Start

`SpecialKms` is a Three.js object — it must be rendered inside a `<Canvas>` from `@react-three/fiber`.

```jsx
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SpecialKms } from "@oak-some/special-kms";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 300], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[0, 5, 5]} intensity={1.5} castShadow />
        <OrbitControls />

        <Suspense fallback={null}>
          <group scale={0.1}>
            <SpecialKms
              cpid="Door_FA_2a"
              width={500}
              height={2200}
              depth={18}
              position={[0, 0, 0]}
              materials={{ doorMaterial: "#ffffff" }}
            />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}
```

> **Dimensions are in millimeters.** A standard door is `500` wide × `2200` tall × `18` deep. Use `<group scale={0.1}>` to scale mm down to Three.js world units, then set the camera accordingly.
>
> **Always wrap `<SpecialKms>` in `<Suspense fallback={null}>`.** The component uses `@react-three/csg` for geometry which suspends while computing — without it the model renders nothing.

---

## SpecialKms Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `cpid` | `string` | context value | Model ID. Determines which door/panel/bin/drawer to render. See [Available Models](#available-models-cpid). |
| `width` | `number` | preset value | Width in **mm** (e.g. `500`). |
| `height` | `number` | preset value | Height in **mm** (e.g. `2200`). |
| `depth` | `number` | preset value | Total depth in **mm** (e.g. `18`). |
| `frontDepth` | `number` | — | Depth of the front face layer in mm. |
| `backDepth` | `number` | — | Depth of the back face layer in mm. |
| `cutYPosition` | `number` | — | Vertical position of a horizontal cut line on the door surface in mm. |
| `doorPivot` | `"left"` \| `"right"` | `"left"` | Which side the door is hinged on. |
| `doorOpening` | `"in"` \| `"out"` | `"in"` | Direction the door swings open. |
| `handleSide` | `"left"` \| `"right"` | `"right"` | Side where the handle is positioned. |
| `handlerHeight` | `number` | — | Vertical position of the handle on the door in mm. |
| `is2D` | `boolean` | `false` | Renders a flat 2D representation instead of a 3D model. |
| `frameVariant` | `"top"` \| `"bottom"` \| `"none"` \| `"full"` \| `"center"` | — | Frame style variant. |
| `debugEdges` | `boolean` | `true` (3D) | Show debug edges. Automatically disabled in 2D mode. |
| `position` | `[number, number, number]` | `[0, 0, 0]` | Position in 3D space `[x, y, z]`. |
| `materials` | `MaterialProps` | — | Colors or textures for different parts of the door. See [Materials](#materials). |
| `handler` | `HandlerConfigProps` | — | Handle configuration. See [Handler Configuration](#handler-configuration). |
| `doorCutsParam` | `DoorCutsParam` | — | Decorative cut slots on the door surface. See [Door Cuts](#door-cuts). |

---

## Available Models (cpid)

Pass any of the following strings as the `cpid` prop to select a model.

### Doors
Full-height cabinet doors.

| cpid | Default Handler |
|---|---|
| `Door_FA_1` | None |
| `Door_FA_2a` | HL01 |
| `Door_FA_2b` | HL02 |
| `Door_FA_2c` | HL03 |
| `Door_FA_2d` | HL04 |
| `Door_FA_2e` | HL05 |
| `Door_FA_3` | HL01 |
| `Door_FA_4a` | HL04 |
| `Door_FA_4b` | HL04 |
| `Door_FA_5a` | HL05 |
| `Door_FA_5b` | HL05 |
| `Door_FA_6` | HL04 |
| `Door_FA_7` | HL04 |
| `Door_FA_7_P` | HL04 |
| `Door_FA_8` | HL04 |

### Panels
Shorter decorative panels.

`Panel_FA_1`, `Panel_FA_2a`, `Panel_FA_2b`, `Panel_FA_2c`, `Panel_FA_2d`, `Panel_FA_2e`, `Panel_FA_3`, `Panel_FA_4a`, `Panel_FA_4b`, `Panel_FA_5a`, `Panel_FA_5b`, `Panel_FA_6`, `Panel_FA_7`, `Panel_FA_7_P`, `Panel_FA_8`

### Bins
Wide shallow cabinet doors.

`Bin_FA_1`, `Bin_FA_2a`, `Bin_FA_2b`, `Bin_FA_2c`, `Bin_FA_2d`, `Bin_FA_2e`, `Bin_FA_3`, `Bin_FA_4a`, `Bin_FA_4b`, `Bin_FA_5a`, `Bin_FA_5b`, `Bin_FA_6`, `Bin_FA_7`, `Bin_FA_7_P`, `Bin_FA_8`

### Drawers
Wide shallow drawer fronts. FA_6, FA_7, FA_7_P, and FA_8 have positional variants.

`Drawer_FA_1`, `Drawer_FA_2a`, `Drawer_FA_2b`, `Drawer_FA_2c`, `Drawer_FA_2d`, `Drawer_FA_2e`, `Drawer_FA_3`, `Drawer_FA_4a`, `Drawer_FA_4b`, `Drawer_FA_5a`, `Drawer_FA_5b`, `Drawer_FA_6_Top`, `Drawer_FA_6_Center`, `Drawer_FA_6_Bottom`, `Drawer_FA_7_Top`, `Drawer_FA_7_Center`, `Drawer_FA_7_Bottom`, `Drawer_FA_7_P_Top`, `Drawer_FA_7_P_Center`, `Drawer_FA_7_P_Bottom`, `Drawer_FA_8_Top`, `Drawer_FA_8_Center`, `Drawer_FA_8_Bottom`

---

## Materials

The `materials` prop accepts an object with three optional keys:

```ts
materials={{
  doorMaterial: ...,   // main door body
  frontMaterial: ...,  // front face
  backMaterial: ...,   // back face
}}
```

Each key accepts a `MaterialDefinition`, which can be a CSS color string, a hex string, an object with opacity, or a `THREE.Material` instance.

---

### Approach 1 — CSS / hex color string

The simplest way. Pass any valid CSS color or hex string.

```jsx
<SpecialKms
  cpid="Door_FA_2a"
  materials={{
    doorMaterial: "#3a3a3a",
    frontMaterial: "rgb(200, 150, 100)",
    backMaterial: "white",
  }}
/>
```

---

### Approach 2 — Color string with opacity

```jsx
<SpecialKms
  cpid="Door_FA_2a"
  materials={{
    doorMaterial: { value: "#ffffff", opacity: 0.8 },
  }}
/>
```

---

### Approach 3 — THREE.js Material with `useMemo`

Use `useMemo` to build a `THREE.MeshStandardMaterial` with full control over roughness, metalness, etc. This is safe to use directly in any component inside or outside `<Canvas>`.

```jsx
import React from "react";
import * as THREE from "three";
import { SpecialKms } from "@oak-some/special-kms";

function Scene() {
  const doorMaterial = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8B5E3C",
        roughness: 0.6,
        metalness: 0.1,
      }),
    []
  );

  return (
    <SpecialKms
      cpid="Door_FA_2a"
      materials={{ doorMaterial }}
    />
  );
}
```

> **Always wrap `new THREE.MeshStandardMaterial(...)` in `useMemo`** to avoid creating a new material object on every render.

---

### Approach 4 — Texture with `useLoader` ⚠️ Must be inside Canvas

`useLoader` from `@react-three/fiber` uses the R3F context and **must be called inside a component that renders within `<Canvas>`**. Calling it in a component that wraps `<Canvas>` (like your root `App`) will throw an error.

**Correct pattern — extract a `Scene` component:**

```jsx
import React from "react";
import { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SpecialKms } from "@oak-some/special-kms";

// This component lives INSIDE Canvas, so useLoader works here
function Scene() {
  const texture = useLoader(
    THREE.TextureLoader,
    "https://example.com/wood-texture.jpg"
  );
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const doorMaterial = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
      }),
    [texture]
  );

  return (
    <group scale={0.1}>
      <SpecialKms
        cpid="Door_FA_2a"
        materials={{ doorMaterial }}
        position={[0, 0, 0]}
      />
    </group>
  );
}

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 300], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[0, 5, 5]} intensity={1.5} castShadow />
        <OrbitControls />

        {/* Suspense is required because useLoader suspends */}
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

**Why not this?** ❌

```jsx
// WRONG — useLoader is outside Canvas, this will crash
function App() {
  const texture = useLoader(THREE.TextureLoader, "..."); // ❌ no R3F context here

  return (
    <Canvas>
      <SpecialKms materials={{ doorMaterial: new THREE.MeshStandardMaterial({ map: texture }) }} />
    </Canvas>
  );
}
```

---

## Handler Configuration

The `handler` prop controls the position, rotation, and material of the door handle. It also lets you override which handle type to use via `cpid`.

```ts
handler={{
  cpid: "HL01",             // override the handle type
  xPosition: 0,             // horizontal offset in mm
  yPosition: 300,           // vertical position on the door in mm
  rotation: 0,              // handle rotation in degrees
  rotationX: 0,             // X-axis rotation in degrees
  rotationY: 0,             // Y-axis rotation in degrees
  handlerHeight: 130,       // handle length/height in mm
  zPosition: 0,             // depth offset in mm
  handlerMaterial: "#888888", // any MaterialDefinition (string, object, or THREE.Material)
}}
```

### Handle Types (cpid)

| Value | Description |
|---|---|
| `None` | No handle |
| `HL01` | Recessed slot handle |
| `HL02` | Recessed capsule handle |
| `HL03` | Minimal recessed handle |
| `HL04` | Surface-mounted bar handle |
| `HL05` | Slim bar handle |
| `HLModel` | Custom 3D model handle |

### Handler material — all valid forms

```jsx
// String color
handler={{ handlerMaterial: "#silver" }}

// With opacity
handler={{ handlerMaterial: { value: "#888888", opacity: 0.9 } }}

// THREE.js material (use useMemo)
const handlerMaterial = React.useMemo(
  () => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.2, metalness: 0.5 }),
  []
);
handler={{ handlerMaterial }}
```

---

## Door Cuts

The `doorCutsParam` prop adds decorative vertical cut slots to the door surface.

```ts
doorCutsParam={{
  width: 40,           // width of each cut slot in mm
  numberOfCuts: 3,     // how many slots
  segmentWidth: 10,    // spacing between slots in mm
}}
```

---

## Full Example

```jsx
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SpecialKms } from "@oak-some/special-kms";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 300], fov: 50 }} shadows>
        <ambientLight intensity={1} />
        <directionalLight position={[0, 5, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />
        <OrbitControls target={[0, 0, 0]} />

        <Suspense fallback={null}>
          <group scale={0.1}>
            <SpecialKms
              cpid="Door_FA_2a"

              width={500}
              height={2200}
              depth={18}
              frontDepth={3}
              backDepth={3}

              doorPivot="left"
              doorOpening="in"
              handleSide="right"

              position={[0, 0, 0]}

              materials={{
                doorMaterial: "#ffffff",
                frontMaterial: "#eeeeee",
                backMaterial: "#cccccc",
              }}

              handler={{
                cpid: "HL01",
                xPosition: 0,
                yPosition: 300,
                handlerHeight: 130,
                handlerMaterial: "#888888",
              }}

              doorCutsParam={{
                width: 40,
                numberOfCuts: 3,
                segmentWidth: 10,
              }}
            />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}
```

### Multiple doors side by side

```jsx
<Suspense fallback={null}>
  <group scale={0.1}>
    <SpecialKms cpid="Door_FA_1"  position={[-600, 0, 0]} width={500} height={2200} depth={18} />
    <SpecialKms cpid="Door_FA_2b" position={[0,    0, 0]} width={500} height={2200} depth={18} />
    <SpecialKms cpid="Door_FA_6"  position={[600,  0, 0]} width={500} height={2200} depth={18} />
  </group>
</Suspense>
```

### 2D flat view

```jsx
<SpecialKms cpid="Panel_FA_3" is2D={true} width={500} height={600} />
```

---

## TypeScript

The package ships with full TypeScript definitions.

```ts
import type {
  MaterialDefinition,
  MaterialProps,
  HandlerConfigProps,
  DoorCutsParam,
} from "@oak-some/special-kms";
```

---

## License

MIT — Tecnibo
