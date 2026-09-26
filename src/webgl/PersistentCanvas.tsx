import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../context/ExperienceContext';
import { HeroPhysicalSystem } from './HeroPhysicalSystem';
import { PersistentHeroWindow } from '../experience/PersistentHeroWindow';
import { DeformablePlaneSystem } from './DeformablePlaneSystem';
import { TunnelWorldA } from './TunnelWorldA';
import { WorldB } from './WorldB';
import { FinalRealtimeObject } from './FinalRealtimeObject';

// Camera controller handling spline travel, FOV modulation, and scene transitions
const SceneCameraCoordinator: React.FC = () => {
  const { inputsRef, activeScene } = useExperience();
  const { camera } = useThree();

  const spline = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2, 1, -15),
      new THREE.Vector3(-3, -1, -35),
      new THREE.Vector3(3, 2, -60),
      new THREE.Vector3(0, 0, -85),
      new THREE.Vector3(-2, 1, -110),
      new THREE.Vector3(0, 0, -135),
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempLookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const inputs = inputsRef.current;
    if (!inputs) return;
    const perspCam = camera as THREE.PerspectiveCamera;

    const wAProgress = inputs.sceneProgress.worldA || 0;
    const wBProgress = inputs.sceneProgress.worldB || 0;
    const cardProgress = inputs.sceneProgress.cardFullscreen || 0;
    const isFinal = activeScene === 'scene-17-final';
    const isImmersive = activeScene === 'scene-12-world-a' || activeScene === 'scene-13-world-portal' || activeScene === 'scene-14-world-b';

    if (isImmersive) {
      if (wBProgress > 0.05) {
        // Camera travel in World B: moving through blue corridor
        const z = THREE.MathUtils.lerp(0, -150, wBProgress);
        perspCam.position.set(0, 0, z + 5);
        perspCam.lookAt(0, 0, z - 20);
        // Roll & perspective exaggeration
        perspCam.rotation.z = Math.sin(wBProgress * Math.PI * 2) * 0.15;
        perspCam.fov = 68;
      } else {
        // Camera travel in World A: follows spline deterministically
        const clampedA = Math.max(0, Math.min(0.999, wAProgress));
        const currentPoint = spline.getPointAt(clampedA);
        const lookAheadPoint = spline.getPointAt(Math.min(clampedA + 0.03, 1));

        perspCam.position.copy(currentPoint);
        perspCam.lookAt(lookAheadPoint);

        // Subtle camera roll derived from spline curvature
        const tangent = spline.getTangentAt(clampedA);
        perspCam.rotation.z = -tangent.x * 0.35;

        // FOV modulation with scroll velocity
        const velEffect = Math.min(Math.abs(inputs.scrollVelocity) * 0.05, 12);
        perspCam.fov = 60 + velEffect;
      }
      perspCam.updateProjectionMatrix();
    } else if (cardProgress > 0) {
      // Scene 11: Card-to-Fullscreen transition camera zoom toward entrance
      const z = THREE.MathUtils.lerp(5.0, 0.5, cardProgress);
      perspCam.position.set(0, 0, z);
      perspCam.lookAt(0, 0, 0);
      perspCam.rotation.z = 0;
      perspCam.fov = THREE.MathUtils.lerp(50, 60, cardProgress);
      perspCam.updateProjectionMatrix();
    } else if (isFinal) {
      // Final realtime scene
      perspCam.position.set(0, 0, 4.5);
      perspCam.lookAt(0, 0, 0);
      perspCam.rotation.z = 0;
      perspCam.fov = 50;
      perspCam.updateProjectionMatrix();
    } else {
      // Default editorial / hero camera
      perspCam.position.set(0, 0, 5.0);
      perspCam.lookAt(0, 0, 0);
      perspCam.rotation.z = 0;
      perspCam.fov = 50;
      perspCam.updateProjectionMatrix();
    }
  });

  return null;
};

export const PersistentCanvas: React.FC = () => {
  const { qualityLevel, inputsRef, activeScene } = useExperience();

  if (qualityLevel === 'STATIC') {
    return null;
  }

  const dpr = qualityLevel === 'HIGH' ? [1, 2] : [1, 1.25];

  // Determine visibility of different scene components
  const isHeroScene = activeScene === 'scene-01-loader' || activeScene === 'scene-02-hero' || activeScene === 'scene-03-transition';
  const isDeformableScene = activeScene === 'scene-06-manifesto' || activeScene === 'scene-07-deformable' || activeScene === 'scene-08-collage';
  const isWorldA = activeScene === 'scene-11-fullscreen-card' || activeScene === 'scene-12-world-a' || activeScene === 'scene-13-world-portal';
  const isWorldB = activeScene === 'scene-13-world-portal' || activeScene === 'scene-14-world-b' || activeScene === 'scene-15-campaign';
  const isFinalScene = activeScene === 'scene-17-final';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 250 }}
        dpr={dpr as any}
        gl={{
          antialias: qualityLevel !== 'LOW',
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <Suspense fallback={null}>
          <SceneCameraCoordinator />

          {/* Precision Studio Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 6]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-4, -2, 3]} color="#CFFE16" intensity={0.6} distance={15} />
          <pointLight position={[4, 2, -5]} color="#2140FF" intensity={0.8} distance={20} />

          {/* SCENE 02 & 03: Persistent Hero Physical Objects & Shared Element Window */}
          <PersistentHeroWindow progress={inputsRef.current?.sceneProgress.hero || 0} />

          {/* SCENE 07: Lusion-Style Deformable Media Plane */}
          <DeformablePlaneSystem />

          {/* SCENE 12 & 13: Immersive World A (Spline Tunnel & Portal) */}
          <TunnelWorldA
            progress={inputsRef.current?.sceneProgress.worldA || 0}
            visible={isWorldA}
          />

          {/* SCENE 14: Immersive World B (Signal Blue Corridor with Shared Object) */}
          <WorldB
            progress={inputsRef.current?.sceneProgress.worldB || 0}
            visible={isWorldB}
          />

          {/* SCENE 17: Final Realtime Scene */}
          <FinalRealtimeObject visible={isFinalScene} />
        </Suspense>
      </Canvas>
    </div>
  );
};
