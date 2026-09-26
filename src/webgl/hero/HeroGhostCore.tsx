import React, { useMemo } from 'react';
import * as THREE from 'three';
import { generateSculptureGeometries } from './HeroRibbonGeometry';
import { HERO_COLORS } from './heroConfig';

interface HeroGhostCoreProps {
  scrollProgress?: number;
}

export const HeroGhostCore: React.FC<HeroGhostCoreProps> = () => {
  const { ribbonA, ribbonB, ribbonC } = useMemo(() => generateSculptureGeometries(), []);

  // Smoked dark glass / graphite material (Subtle 8–15% visual presence)
  const matA = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.GHOST_CORE_GRAPHITE,
        roughness: 0.28,
        metalness: 0.85,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    []
  );

  const matB = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.GHOST_CORE_PALE,
        roughness: 0.38,
        metalness: 0.25,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      }),
    []
  );

  const matC = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.SIGNAL_LIME,
        emissive: HERO_COLORS.LIME_GLOW,
        emissiveIntensity: 0.12,
        roughness: 0.25,
        metalness: 0.2,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      }),
    []
  );

  return (
    <group name="hero-ghost-core" renderOrder={1}>
      <mesh geometry={ribbonA} material={matA} />
      <mesh geometry={ribbonB} material={matB} />
      <mesh geometry={ribbonC} material={matC} />
    </group>
  );
};
