import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../../context/ExperienceContext';
import { HERO_TIERS } from './heroConfig';
import { HeroLighting } from './HeroLighting';
import { HeroCore } from './HeroCore';
import { HeroPhysicsField } from './HeroPhysicsField';
import { HeroConnectors } from './HeroConnectors';
import { HeroFluidSystem } from './HeroFluidSystem';
import { HeroFlowParticles } from './HeroFlowParticles';
import { HeroPostFX } from './HeroPostFX';

interface HeroExperienceProps {
  progress?: number;
  onShadersReady?: () => void;
  onWarmupReady?: () => void;
  onPhysicsReady?: () => void;
  onFluidReady?: () => void;
}

export const HeroExperience: React.FC<HeroExperienceProps> = ({
  progress = 0,
  onShadersReady,
  onWarmupReady,
  onPhysicsReady,
  onFluidReady,
}) => {
  const { qualityLevel, setQualityLevel, inputsRef } = useExperience();
  const { gl, scene, camera } = useThree();

  const tierConfig = HERO_TIERS[qualityLevel] || HERO_TIERS.MEDIUM;

  const corePosRef = useRef(new THREE.Vector3(0.55, 0.35, 0));
  const nodePositionsRef = useRef<Map<number, THREE.Vector3>>(new Map());
  const [velocityTexture, setVelocityTexture] = useState<any>(null);

  // Warmup tracking
  const warmupFrameCount = useRef(0);
  const warmupTimes = useRef<number[]>([]);
  const warmupFinished = useRef(false);

  // 1. Asynchronous Shader Precompilation
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

    // Delay slightly to ensure children nodes are mounted
    const timer = setTimeout(compileHeroShaders, 80);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [gl, scene, camera, onShadersReady]);

  // 2. First-frame Warmup Profiling (8-12 actual frames)
  useFrame((state, delta) => {
    if (warmupFinished.current) return;

    warmupFrameCount.current += 1;
    const frameMs = delta * 1000;
    warmupTimes.current.push(frameMs);

    if (warmupFrameCount.current >= 10) {
      warmupFinished.current = true;
      const sum = warmupTimes.current.reduce((a, b) => a + b, 0);
      const avgMs = sum / warmupTimes.current.length;

      // Auto-downgrade if first frames are too heavy
      if (avgMs > 28 && qualityLevel === 'HIGH') {
        setQualityLevel('MEDIUM', false);
      } else if (avgMs > 34 && qualityLevel === 'MEDIUM') {
        setQualityLevel('LOW', false);
      }

      onWarmupReady?.();
    }
  });

  const handleCorePosition = (pos: THREE.Vector3) => {
    corePosRef.current.copy(pos);
  };

  const handleNodePositions = (map: Map<number, THREE.Vector3>) => {
    nodePositionsRef.current = map;
  };

  return (
    <group name="hero-kinetic-constellation">
      {/* Studio Lighting Environment */}
      <HeroLighting />

      {/* Central Aerodynamic Core */}
      <HeroCore
        scrollProgress={progress}
        onPositionUpdate={handleCorePosition}
      />

      {/* Rapier Physics Node Field */}
      <HeroPhysicsField
        nodeCount={tierConfig.nodeCount}
        corePosition={corePosRef.current}
        onPositionsUpdate={handleNodePositions}
        onPhysicsReady={onPhysicsReady}
      />

      {/* Reusable Structural Connectors */}
      <HeroConnectors
        connectorCount={tierConfig.connectorCount}
        corePosition={corePosRef.current}
        nodePositionsRef={nodePositionsRef}
      />

      {/* Fluid Simulation System */}
      <HeroFluidSystem
        profile={tierConfig.fluidProfile}
        onFluidReady={onFluidReady}
        onFluidUpdate={setVelocityTexture}
      />

      {/* GPU Atmospheric Flow Particles */}
      <HeroFlowParticles
        count={tierConfig.particleCount}
        velocityTexture={velocityTexture}
      />

      {/* Contact AO, Selective Bloom & ACES Filmic Tone Mapping */}
      <HeroPostFX qualityLevel={qualityLevel} />
    </group>
  );
};
