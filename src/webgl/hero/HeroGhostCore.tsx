import React, { useMemo } from 'react';
import * as THREE from 'three';
import { generateBirdGeometries } from './HeroBirdGeometry';
import { HERO_COLORS } from './heroConfig';

interface HeroGhostCoreProps {
  opacity?: number;
}

export const HeroGhostCore: React.FC<HeroGhostCoreProps> = ({ opacity = 0.08 }) => {
  const { fuselage, upperWing, lowerWing, tail } = useMemo(() => generateBirdGeometries(), []);

  // Smoked dark glass / graphite material (Subtle 5–8% visual presence only)
  const matFuselage = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.GHOST_CORE_BODY,
        roughness: 0.22,
        metalness: 0.88,
        clearcoat: 0.6,
        clearcoatRoughness: 0.18,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
      }),
    [opacity]
  );

  const matWing = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.GHOST_CORE_WING,
        roughness: 0.32,
        metalness: 0.35,
        transparent: true,
        opacity: opacity * 0.75, // Even lighter on wings so particles dominate
        depthWrite: false,
      }),
    [opacity]
  );

  return (
    <group name="hero-swift-ghost-core" renderOrder={1}>
      <mesh geometry={fuselage} material={matFuselage} />
      <mesh geometry={upperWing} material={matWing} />
      <mesh geometry={lowerWing} material={matWing} />
      <mesh geometry={tail} material={matFuselage} />
    </group>
  );
};
