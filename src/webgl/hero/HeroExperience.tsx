import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../../context/ExperienceContext';
import { HERO_TIERS } from './heroConfig';
import { HeroLighting } from './HeroLighting';
import { HeroGhostCore } from './HeroGhostCore';
import { HeroParticleSculpture } from './HeroParticleSculpture';
import { HeroPostFX } from './HeroPostFX';

interface HeroExperienceProps {
  progress?: number;
  onShadersReady?: () => void;
  onWarmupReady?: () => void;
  onGeometryReady?: () => void;
  onSimulationReady?: () => void;
  onGhostCoreReady?: () => void;
}

export const HeroExperience: React.FC<HeroExperienceProps> = ({
  progress = 0,
  onShadersReady,
  onWarmupReady,
  onGeometryReady,
  onSimulationReady,
  onGhostCoreReady,
}) => {
  const { qualityLevel, setQualityLevel, inputsRef } = useExperience();
  const { gl, scene, camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const warmupFrameCount = useRef(0);
  const warmupTimes = useRef<number[]>([]);
  const warmupFinished = useRef(false);

  // 1. Mark geometry and ghost core ready upon mounting
  useEffect(() => {
    onGeometryReady?.();
    onGhostCoreReady?.();
  }, [onGeometryReady, onGhostCoreReady]);

  // 2. Asynchronous Shader Precompilation
  useEffect(() => {
    let active = true;

    const compileHeroShaders = async () => {
      try {
        const renderer = gl as unknown as THREE.WebGLRenderer;
        if ('compileAsync' in renderer && typeof (renderer as any).compileAsync === 'function') {
          await (renderer as any).compileAsync(scene, camera);
        } else if ('compile' in renderer && typeof renderer.compile === 'function') {
          renderer.compile(scene, camera);
        }
        if (active) {
          onShadersReady?.();
        }
      } catch (err) {
        console.warn('compileAsync fallback:', err);
        if (active) onShadersReady?.();
      }
    };

    const timer = setTimeout(compileHeroShaders, 60);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [gl, scene, camera, onShadersReady]);

  // 3. First-frame Warmup Profiling (10 actual frames)
  useFrame((state, delta) => {
    if (warmupFinished.current) return;

    warmupFrameCount.current += 1;
    const frameMs = delta * 1000;
    warmupTimes.current.push(frameMs);

    if (warmupFrameCount.current >= 10) {
      warmupFinished.current = true;
      const sum = warmupTimes.current.reduce((a, b) => a + b, 0);
      const avgMs = sum / warmupTimes.current.length;

      // Safe automatic tier adaptation if initial frame cost is too high
      if (avgMs > 28 && qualityLevel === 'HIGH') {
        setQualityLevel('MEDIUM', false);
      } else if (avgMs > 34 && qualityLevel === 'MEDIUM') {
        setQualityLevel('LOW', false);
      }

      onWarmupReady?.();
    }
  });

  // 4. Subtle camera / cluster evolution across the 220vh scroll range
  useFrame(() => {
    if (!groupRef.current) return;
    const heroScroll = inputsRef.current?.sceneProgress.hero || progress || 0;

    // First 35%: primary poster state
    // 35% - 65%: gentle depth migration and slight core reorientation
    // 65% - 100%: smooth exit
    const zOffset = -heroScroll * 1.6;
    const rotY = heroScroll * 0.25;

    groupRef.current.position.z = zOffset;
    groupRef.current.rotation.y = rotY;
  });

  return (
    <group ref={groupRef} name="hero-particle-sculpture-experience">
      {/* Studio Lighting Environment against #080808 */}
      <HeroLighting />

      {/* Subtle Ghost-Core Mesh Underneath (~8–15% visual presence) */}
      <HeroGhostCore scrollProgress={progress} />

      {/* Dense GPGPU Particle Sculpture */}
      <HeroParticleSculpture
        onReady={onSimulationReady}
        scrollProgress={progress}
      />

      {/* Postprocessing: Contact N8AO, High-Threshold Bloom & ACES Filmic */}
      <HeroPostFX qualityLevel={qualityLevel} />
    </group>
  );
};
