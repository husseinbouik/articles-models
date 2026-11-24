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

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
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
        <SceneEnvironment />
        <Scene />
      </Canvas>
      <Interface />
    </div>
  );
}

export default App;
