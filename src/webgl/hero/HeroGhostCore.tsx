import React, { useMemo } from 'react';
import * as THREE from 'three';
import { generateBirdGeometries } from './HeroBirdGeometry';
import { HERO_COLORS } from './heroConfig';

interface HeroGhostCoreProps {
  opacity?: number;
}

export const HeroGhostCore: React.FC<HeroGhostCoreProps> = ({ opacity = 0.08 }) => {
  const { body, upperWing, lowerWing, tail } = useMemo(() => generateBirdGeometries(), []);

  // Smoked dark glass / graphite material (Subtle 5–10% visual presence only)
  const matBody = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.GHOST_CORE_BODY,
        roughness: 0.25,
        metalness: 0.85,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
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
        roughness: 0.35,
        metalness: 0.3,
        transparent: true,
        opacity: opacity * 0.75, // Even lighter on wings to let particles lead
        depthWrite: false,
      }),
    [opacity]
  );

  return (
    <group name="hero-swift-ghost-core" renderOrder={1}>
      <mesh geometry={body} material={matBody} />
      <mesh geometry={upperWing} material={matWing} />
      <mesh geometry={lowerWing} material={matWing} />
      <mesh geometry={tail} material={matBody} />
    </group>
  );
};
