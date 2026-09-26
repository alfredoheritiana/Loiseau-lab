import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../context/ExperienceContext';

export const FinalRealtimeObject: React.FC<{ visible: boolean }> = ({ visible }) => {
  const { inputsRef } = useExperience();
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!visible || !groupRef.current) return;
    const inputs = inputsRef.current;
    const pX = inputs?.pointerX || 0;
    const pY = inputs?.pointerY || 0;

    groupRef.current.rotation.y += delta * 0.5 + pX * 0.01;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pY * 0.4, delta * 2.0);

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group ref={groupRef} visible={visible} position={[0, 0, 0]}>
      {/* Return of the Monocoque Torus Knot from Scene 02 / Hero */}
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[1.1, 0.32, 100, 24, 2, 3]} />
        <meshPhysicalMaterial
          color="#0E100D"
          roughness={0.1}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={0.95}
        />
      </mesh>

      {/* Persistent Icosahedron from World A/B nestled within the knot */}
      <mesh>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color="#CFFE16"
          emissive="#CFFE16"
          emissiveIntensity={0.5}
          roughness={0.2}
          wireframe={false}
        />
      </mesh>

      {/* Orbiting graphic indicator ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[1.8, 1.82, 64]} />
        <meshBasicMaterial color="#ECEEE5" side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>
    </group>
  );
};
