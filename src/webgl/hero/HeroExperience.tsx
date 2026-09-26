import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../../context/ExperienceContext';
import { HeroLighting } from './HeroLighting';
import { HeroGhostCore } from './HeroGhostCore';
import { HeroParticleBird } from './HeroParticleBird';
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
  const { qualityLevel, setQualityLevel, inputsRef, introPhase } = useExperience();
  const { gl, scene, camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const warmupFrameCount = useRef(0);
  const warmupTimes = useRef<number[]>([]);
  const warmupFinished = useRef(false);

  // Formation timer (starts when loader transition opens / introPhase reaches opening/expanding/settling/ready)
  const formationTimeRef = useRef(0);
  const [formationTime, setFormationTime] = useState(0);

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

  // 4. Update formation timer and scroll progression
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);

    // Increment formation timer once aperture begins opening
    if (introPhase !== 'loading' && introPhase !== 'tension') {
      formationTimeRef.current += dt;
      setFormationTime(formationTimeRef.current);
    }

    if (!groupRef.current) return;
    const heroScroll = inputsRef.current?.sceneProgress.hero || progress || 0;

    // Scroll migration: subtle depth drift and orientation shift
    const zOffset = -heroScroll * 2.2;
    const rotY = heroScroll * 0.22;
    const rotX = -heroScroll * 0.12;

    groupRef.current.position.z = zOffset;
    groupRef.current.rotation.y = rotY;
    groupRef.current.rotation.x = rotX;
  });

  const heroScroll = inputsRef.current?.sceneProgress.hero || progress || 0;

  // Ghost core opacity emerges during Act 3 & 4 (max 0.08)
  const ghostOpacity = Math.max(0, Math.min(0.08, (formationTime - 0.8) * 0.06));

  return (
    <group ref={groupRef} name="hero-murmuration-swift-experience">
      {/* Studio Lighting Environment against #080808 */}
      <HeroLighting />

      {/* Subtle Ghost-Core Mesh Underneath (~5–8% visual presence) */}
      <HeroGhostCore opacity={ghostOpacity} />

      {/* The Murmuration Swift: Large GPGPU Particle Bird */}
      <HeroParticleBird
        onReady={onSimulationReady}
        scrollProgress={heroScroll}
        formationTime={formationTime}
      />

      {/* Postprocessing: Contact N8AO, High-Threshold Bloom & ACES Filmic */}
      <HeroPostFX qualityLevel={qualityLevel} />
    </group>
  );
};
