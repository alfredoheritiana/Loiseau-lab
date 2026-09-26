import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../../context/ExperienceContext';
import { HERO_COLORS } from './heroConfig';

interface HeroCoreProps {
  scrollProgress?: number;
  onPositionUpdate?: (pos: THREE.Vector3) => void;
}

/**
 * Creates a streamlined, tapered aerodynamic shell geometry.
 * Evokes high-performance aero blades / industrial precision sculpture.
 */
function createAerofoilGeometry(
  length: number,
  chord: number,
  thickness: number,
  curvature: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Aerodynamic cross-section: smooth rounded leading edge tapering to sharp trailing edge
  shape.moveTo(0, 0);
  shape.bezierCurveTo(chord * 0.18, thickness, chord * 0.52, thickness * 0.85, chord, 0);
  shape.bezierCurveTo(chord * 0.52, -thickness * 0.45, chord * 0.18, -thickness * 0.55, 0, 0);

  // Extrusion path with aerodynamic curvature
  const points: THREE.Vector3[] = [];
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = (t - 0.5) * length;
    const x = Math.sin(t * Math.PI) * curvature;
    const z = (t - 0.5) * (length * 0.15);
    points.push(new THREE.Vector3(x, y, z));
  }
  const path = new THREE.CatmullRomCurve3(points);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: segments,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: thickness * 0.12,
    bevelThickness: thickness * 0.12,
    extrudePath: path,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

export const HeroCore: React.FC<HeroCoreProps> = ({ scrollProgress = 0, onPositionUpdate }) => {
  const groupRef = useRef<THREE.Group>(null);
  const shellARef = useRef<THREE.Mesh>(null);
  const shellBRef = useRef<THREE.Mesh>(null);
  const shellCRef = useRef<THREE.Mesh>(null);
  const podRef = useRef<THREE.Mesh>(null);

  const { inputsRef, qualityLevel } = useExperience();

  // Asymmetric centroid: x ≈ +0.70, y ≈ +0.38 (Leaves lower-left 0-48% width completely clear)
  const basePosition = useMemo(() => new THREE.Vector3(0.70, 0.38, 0.0), []);
  const currentPos = useMemo(() => new THREE.Vector3(0.70, 0.38, 0.0), []);

  // 1. SHELL A: Dominant Anodized Graphite Aerofoil Shell (Diagonal lower-left -> upper-right)
  const geomShellA = useMemo(() => {
    const geom = createAerofoilGeometry(2.7, 0.58, 0.18, 0.35);
    geom.rotateZ(-Math.PI * 0.22);
    geom.rotateX(Math.PI * 0.08);
    return geom;
  }, []);

  // 2. SHELL B: Off-White Satin Crossing Shell (Intersects behind with intentional negative space)
  const geomShellB = useMemo(() => {
    const geom = createAerofoilGeometry(2.1, 0.44, 0.14, -0.28);
    geom.rotateZ(Math.PI * 0.32);
    geom.rotateY(Math.PI * 0.18);
    return geom;
  }, []);

  // 3. SHELL C: Signal Lime Aerodynamic Ribbon (Cuts through the central negative void)
  const geomShellC = useMemo(() => {
    const geom = createAerofoilGeometry(1.4, 0.24, 0.08, 0.42);
    geom.rotateZ(-Math.PI * 0.45);
    geom.rotateX(Math.PI * 0.25);
    return geom;
  }, []);

  // 4. Central Negative Space Core Pod (Compact refractive nucleus)
  const geomPod = useMemo(() => {
    const geom = new THREE.SphereGeometry(0.24, 24, 24);
    geom.scale(0.8, 1.4, 0.7);
    geom.rotateZ(Math.PI * 0.15);
    return geom;
  }, []);

  // Materials with precise reflectance and NO overexposed blowout
  const matGraphite = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.GRAPHITE_DARK,
        metalness: 0.78,
        roughness: 0.22,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        reflectivity: 0.88,
      }),
    []
  );

  const matOffwhite = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.OFFWHITE_SATIN,
        metalness: 0.18,
        roughness: 0.36,
        clearcoat: 0.25,
      }),
    []
  );

  const matLime = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.SIGNAL_LIME,
        emissive: HERO_COLORS.LIME_EMISSIVE,
        emissiveIntensity: 0.22, // Restrained, NOT a blinding green bulb
        metalness: 0.28,
        roughness: 0.22,
      }),
    []
  );

  const matPod = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.TRANSLUCENT_POD,
        transmission: qualityLevel === 'HIGH' ? 0.65 : 0.0,
        opacity: qualityLevel === 'HIGH' ? 0.85 : 0.95,
        transparent: true,
        roughness: 0.15,
        metalness: 0.1,
        ior: 1.48,
      }),
    [qualityLevel]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const inputs = inputsRef.current;
    const t = state.clock.getElapsedTime();

    // Responsive pointer displacement
    const targetX = basePosition.x + (inputs?.pointerX || 0) * 0.38;
    const targetY = basePosition.y + (inputs?.pointerY || 0) * 0.28;
    const targetZ = basePosition.z - scrollProgress * 1.5;

    // Heavy, viscous physical dampening (no rubber bouncing)
    currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetX, 0.06);
    currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, 0.06);
    currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetZ, 0.06);

    groupRef.current.position.copy(currentPos);
    onPositionUpdate?.(currentPos);

    // Subtle, heavy orientation drift (Nothing spins rapidly)
    const rotX = Math.sin(t * 0.35) * 0.05 + (inputs?.pointerY || 0) * 0.18;
    const rotY = Math.cos(t * 0.28) * 0.08 + (inputs?.pointerX || 0) * 0.22;
    const rotZ = Math.sin(t * 0.2) * 0.03;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotY, 0.05);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rotZ, 0.05);

    // Subtle aerodynamic breathing between individual shells
    if (shellARef.current) {
      shellARef.current.rotation.y = Math.sin(t * 0.22) * 0.035;
    }
    if (shellBRef.current) {
      shellBRef.current.rotation.x = Math.cos(t * 0.3) * 0.04;
    }
    if (shellCRef.current) {
      shellCRef.current.rotation.z = Math.sin(t * 0.45) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
      {/* 
        SHELL A: Dominant dark graphite aerofoil blade
      */}
      <mesh ref={shellARef} geometry={geomShellA} material={matGraphite} castShadow receiveShadow />

      {/* 
        SHELL B: Off-white satin crossing blade (positioned behind with negative clearance)
      */}
      <mesh
        ref={shellBRef}
        geometry={geomShellB}
        material={matOffwhite}
        position={[-0.15, -0.08, -0.25]}
        castShadow
        receiveShadow
      />

      {/* 
        SHELL C: Signal lime aerodynamic fin cutting through negative void
      */}
      <mesh
        ref={shellCRef}
        geometry={geomShellC}
        material={matLime}
        position={[0.2, 0.12, 0.15]}
      />

      {/* 
        CENTRAL POD: Refractive core nucleus suspended in negative space
      */}
      <mesh ref={podRef} geometry={geomPod} material={matPod} position={[0.05, 0.02, -0.05]} />
    </group>
  );
};
