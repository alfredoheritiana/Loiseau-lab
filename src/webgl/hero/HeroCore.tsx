import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../../context/ExperienceContext';
import { HERO_COLORS } from './heroConfig';

interface HeroCoreProps {
  scrollProgress?: number;
  onPositionUpdate?: (pos: THREE.Vector3) => void;
}

export const HeroCore: React.FC<HeroCoreProps> = ({ scrollProgress = 0, onPositionUpdate }) => {
  const groupRef = useRef<THREE.Group>(null);
  const shellARef = useRef<THREE.Mesh>(null);
  const shellBRef = useRef<THREE.Mesh>(null);
  const shellCRef = useRef<THREE.Mesh>(null);
  const podRef = useRef<THREE.Mesh>(null);

  const { inputsRef, qualityLevel } = useExperience();

  // Asymmetric centroid placement: right of center (+0.55), above vertical center (+0.35)
  const basePosition = useMemo(() => new THREE.Vector3(0.55, 0.35, 0.0), []);
  const currentPos = useMemo(() => new THREE.Vector3(0.55, 0.35, 0.0), []);

  // Pre-allocated geometries for the 3 sculptural aerofoil shells
  // Shell A: Primary smoked graphite curved aerofoil
  const geomShellA = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.55, 0.28, 2.2, 32, 1, false);
    geom.scale(1.2, 1.0, 0.45);
    geom.rotateZ(Math.PI * 0.18);
    geom.rotateX(Math.PI * 0.08);
    return geom;
  }, []);

  // Shell B: Secondary off-white satin crossing aerofoil
  const geomShellB = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.42, 0.22, 1.9, 32, 1, false);
    geom.scale(0.9, 1.0, 0.4);
    geom.rotateZ(-Math.PI * 0.22);
    geom.rotateY(Math.PI * 0.15);
    return geom;
  }, []);

  // Shell C: Signal lime accent aerodynamic fin
  const geomShellC = useMemo(() => {
    const geom = new THREE.TorusGeometry(0.75, 0.06, 16, 64, Math.PI * 1.35);
    geom.rotateX(Math.PI * 0.35);
    geom.rotateY(-Math.PI * 0.15);
    return geom;
  }, []);

  // Central Core Pod (Translucent capsule at negative-space vortex)
  const geomPod = useMemo(() => {
    const geom = new THREE.SphereGeometry(0.32, 32, 32);
    geom.scale(0.85, 1.3, 0.85);
    return geom;
  }, []);

  // Materials
  const matGraphite = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.GRAPHITE_DARK,
        metalness: 0.88,
        roughness: 0.22,
        clearcoat: 0.45,
        clearcoatRoughness: 0.2,
        reflectivity: 0.9,
      }),
    []
  );

  const matOffwhite = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.OFFWHITE_SATIN,
        metalness: 0.15,
        roughness: 0.38,
        clearcoat: 0.2,
      }),
    []
  );

  const matLime = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.SIGNAL_LIME,
        emissive: HERO_COLORS.LIME_EMISSIVE,
        emissiveIntensity: 0.45,
        metalness: 0.3,
        roughness: 0.25,
      }),
    []
  );

  const matPod = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1a2215',
        transmission: qualityLevel === 'HIGH' ? 0.65 : 0.0,
        opacity: qualityLevel === 'HIGH' ? 0.85 : 0.95,
        transparent: true,
        roughness: 0.18,
        metalness: 0.1,
        ior: 1.45,
      }),
    [qualityLevel]
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const inputs = inputsRef.current;
    const t = state.clock.getElapsedTime();

    // Pointer influence & displacement
    const targetX = basePosition.x + inputs.pointerX * 0.45;
    const targetY = basePosition.y + inputs.pointerY * 0.35;
    const targetZ = basePosition.z - scrollProgress * 1.8;

    // Smooth physical inertia dampening
    currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetX, 0.08);
    currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, 0.08);
    currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetZ, 0.08);

    groupRef.current.position.copy(currentPos);
    onPositionUpdate?.(currentPos);

    // Idle organic precession
    const idleRotX = Math.sin(t * 0.5) * 0.08 + inputs.pointerY * 0.25;
    const idleRotY = Math.cos(t * 0.4) * 0.12 + inputs.pointerX * 0.35;
    const idleRotZ = Math.sin(t * 0.3) * 0.05;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, idleRotX, 0.06);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, idleRotY, 0.06);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, idleRotZ, 0.06);

    // Subtle counter-precession of individual shells for aerodynamic depth
    if (shellARef.current) {
      shellARef.current.rotation.y = Math.sin(t * 0.35) * 0.06;
    }
    if (shellBRef.current) {
      shellBRef.current.rotation.x = Math.cos(t * 0.45) * 0.08;
    }
    if (shellCRef.current) {
      shellCRef.current.rotation.z = Math.sin(t * 0.6) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
      {/* Shell A: Dark Graphite Sculptural Shell */}
      <mesh ref={shellARef} geometry={geomShellA} material={matGraphite} castShadow receiveShadow />

      {/* Shell B: Satin Off-white Crossing Shell */}
      <mesh ref={shellBRef} geometry={geomShellB} material={matOffwhite} castShadow receiveShadow />

      {/* Shell C: Signal Lime Accent Ribbon */}
      <mesh ref={shellCRef} geometry={geomShellC} material={matLime} />

      {/* Center Translucent Core Pod */}
      <mesh ref={podRef} geometry={geomPod} material={matPod} />
    </group>
  );
};
