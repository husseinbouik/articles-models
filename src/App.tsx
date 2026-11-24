import { Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import SpecialKms from "./lib/components/SpecialKms.tsx";
import { Interface } from "./lib/components/Interface.tsx";
import { useConfigurator } from "./lib/context/DoorContext.tsx";
import * as THREE from "three";
import React from "react";

// Builds the door material and, because frameloop="demand" only renders on
// demand, asks R3F for a render once the async texture has decoded — otherwise
// the door would stay untextured until the first orbit drag.
function useDoorMaterial() {
  const invalidate = useThree(s => s.invalidate);

  return React.useMemo(() => {
    const texture = new THREE.TextureLoader().load(
      "https://imagedelivery.net/aYYmWUcv7lRhpLdU4ojPsA/copy_2%2FUN_0H266_V1A.jpg/public",
      () => invalidate(), // texture decoded → request one render
    );

    texture.rotation = Math.PI / 2; // 90° in radians
    // Repeat wrapping so the image tiles cleanly after rotation.
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({
      map: texture,
    });
  }, [invalidate]);
}

// Gives the scene an image-based environment (three's RoomEnvironment,
// generated locally with PMREM — no network HDR fetch). Without an
// environment map, metallic PBR surfaces receive almost nothing from
// ambient/directional lights alone and render nearly black — this is what
// made the GLB door knob (HLModel) look invisible: its Sketchfab material
// is metal (metallic ≈ 1 via its metallicRoughness texture), so it had
// nothing to reflect. With an env map it shades as the chrome/metal it is.
function SceneEnvironment() {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const invalidate = useThree(s => s.invalidate);

  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const renderTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = renderTarget.texture;
    // frameloop="demand": request a frame so the new lighting is drawn.
    invalidate();
    return () => {
      scene.environment = null;
      renderTarget.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  return null;
}

// Scene contents live in their own component so they can call useThree() hooks
// (only valid inside the Canvas). Keeps the door design identical.
function Scene() {
  const { doorConfig } = useConfigurator();
  const doorMaterial = useDoorMaterial();

  const materials = React.useMemo(
    () => ({
      doorMaterial,
      frontMaterial:
        "https://imagedelivery.net/aYYmWUcv7lRhpLdU4ojPsA/copy_2%2FUN_0H266_V1A.jpg/public",
      backMaterial:
        "https://imagedelivery.net/aYYmWUcv7lRhpLdU4ojPsA/copy_2%2FUN_0H266_V1A.jpg/public",
      // Driven by the Inner Panel section of the Interface. Undefined until
      // one is chosen there, which is what keeps the panel absent by default.
      innerPanelMaterial: doorConfig.innerPanelMaterial,
    }),
    [doorMaterial, doorConfig.innerPanelMaterial],
  );

  const handler = React.useMemo(
    () => ({
      handlerMaterial: "#cccccc",
      secondCutHeight: 0,
    }),
    [],
  );

  const edgeLine = React.useMemo(
    () => ({
      color: doorConfig.edgeColor,
      opacity: doorConfig.edgeOpacity,
      lineWidth: doorConfig.edgeLineWidth,
      enabled: doorConfig.edgeLineEnabled,
    }),
    [
      doorConfig.edgeColor,
      doorConfig.edgeOpacity,
      doorConfig.edgeLineWidth,
      doorConfig.edgeLineEnabled,
    ],
  );

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight
        position={[0, 5, 5]}
        intensity={1.5}
        castShadow={doorConfig.shadow ?? true}
      />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} />

      <Suspense fallback={null}>
        <group scale={0.1}>
          <SpecialKms
            cpid={doorConfig.name}
            position={[0, 0, 0]}
            width={doorConfig.width}
            height={doorConfig.height}
            depth={doorConfig.depth}
            frontDepth={doorConfig.frontDepth}
            backDepth={doorConfig.backDepth}
            frontPanelWidth={doorConfig.frontPanelWidth}
            midRailPosition={doorConfig.midRailPosition}
            doorPivot={doorConfig.doorPivot}
            doorOpening={doorConfig.doorOpening}
            handleSide={doorConfig.handleSide}
            frameVariant={doorConfig.frameVariant}
            materials={materials}
            handler={handler}
            edgeLine={edgeLine}
            shadow={doorConfig.shadow}
            numberOfCuts={doorConfig.numberOfCuts}
          />
        </group>
      </Suspense>

      {/* OrbitControls calls invalidate() on change, so drag/zoom still renders
          under frameloop="demand". */}
      <OrbitControls target={[0, 0, 0]} />
    </>
  );
}

// Showcase header bar — slim full-width top bar (the family look: deep wood,
// amber accent; distinct from Zoning Studio's rail and Article Designer's
// floating card). Purely presentational.
function Header() {
  return (
    <header
      style={{
        height: 58,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 18px",
        background: "#211a14",
        borderBottom: "1px solid #3a2d20",
        color: "#f2e9dc",
        zIndex: 10,
      }}
    >
      {/* Brand mark: a door slab with a division line and knob dot */}
      <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true" style={{ flexShrink: 0 }}>
        <rect x="1.5" y="1.5" width="23" height="31" rx="2.5" fill="none" stroke="#e0a458" strokeWidth="2" />
        <line x1="13" y1="2" x2="13" y2="32" stroke="#e0a458" strokeWidth="1.4" opacity="0.65" />
        <circle cx="20.5" cy="17" r="2.1" fill="#e0a458" />
      </svg>
      <div style={{ minWidth: 0, lineHeight: 1.2 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
          Article Models
        </div>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "#e0a458",
            whiteSpace: "nowrap",
          }}
        >
          Parametric Door &amp; Panel Configurator
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#b8a88f", whiteSpace: "nowrap" }}>by Hussein Bouik</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "#241708",
            background: "#e0a458",
            borderRadius: 999,
            padding: "4px 10px",
            whiteSpace: "nowrap",
          }}
        >
          Showcase
        </span>
      </div>
    </header>
  );
}

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 300], fov: 50 }}
        shadows="percentage"
        // Only render when something actually changes (prop change, OrbitControls
        // drag) instead of 60fps forever on a static scene. OrbitControls calls
        // invalidate() on move, so interaction still renders. Huge win on weak GPUs.
        frameloop="demand"
        // Cap render resolution at 2x so HiDPI/4K displays don't pay 4–9x the
        // fragment cost. Visually identical, far cheaper to shade.
        dpr={[1, 2]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        {/* Deep-wood studio backdrop for the 3D stage */}
        <color attach="background" args={["#17120d"]} />
        <SceneEnvironment />
        <Scene />
      </Canvas>
      <Interface />
      </div>
    </div>
  );
}

export default App;
