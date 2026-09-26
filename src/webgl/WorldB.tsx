import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../context/ExperienceContext';

interface WorldBProps {
  progress: number; // 0 to 1 deterministic scroll progress
  visible: boolean;
}

export const WorldB: React.FC<WorldBProps> = ({ progress, visible }) => {
  const { qualityLevel } = useExperience();

  const groupRef = useRef<THREE.Group>(null);
  const corridorRef = useRef<THREE.InstancedMesh>(null);
  const persistentObjectRef = useRef<THREE.Group>(null);

  const blockCount = qualityLevel === 'LOW' ? 40 : qualityLevel === 'MEDIUM' ? 70 : 100;

  // Reusable matrix and vectors
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const dummyRot = useMemo(() => new THREE.Euler(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);

  // Initialize corridor wall panels with graphic offset pattern
  React.useEffect(() => {
    if (!corridorRef.current) return;
    const mesh = corridorRef.current;
    const signalBlue = new THREE.Color('#2140FF');
    const darkBlue = new THREE.Color('#0A1133');
    const accentGreen = new THREE.Color('#CFFE16');

    for (let i = 0; i < blockCount; i++) {
      const isLeft = i % 2 === 0;
      const zIndex = Math.floor(i / 2);
      const z = -zIndex * 4.0;
      const x = isLeft ? -4.5 : 4.5;
      const y = ((i % 5) - 2) * 1.5;

      dummyPos.set(x, y, z);
      dummyRot.set(0, isLeft ? Math.PI / 12 : -Math.PI / 12, 0);
      dummyScale.set(0.4, 2.8, 3.6);

      dummyMatrix.compose(dummyPos, new THREE.Quaternion().setFromEuler(dummyRot), dummyScale);
      mesh.setMatrixAt(i, dummyMatrix);

      if (i % 7 === 0) {
        mesh.setColorAt(i, accentGreen);
      } else if (i % 3 === 0) {
        mesh.setColorAt(i, signalBlue);
      } else {
        mesh.setColorAt(i, darkBlue);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [blockCount, dummyMatrix, dummyPos, dummyRot, dummyScale]);

  useFrame((state, delta) => {
    if (!visible) return;
    const p = Math.max(0, Math.min(1, progress));

    // The persistent shared object carried over from World A!
    if (persistentObjectRef.current) {
      // Moves along the central flight corridor
      const objZ = THREE.MathUtils.lerp(0, -160, p);
      const objX = Math.sin(p * Math.PI * 4) * 1.5;
      const objY = Math.cos(p * Math.PI * 2) * 0.8;

      persistentObjectRef.current.position.set(objX, objY, objZ);
      persistentObjectRef.current.rotation.x += delta * 1.8;
      persistentObjectRef.current.rotation.y += delta * 2.4;

      // Scale adapts as it prepares to transition back to the editorial campaign
      const scale = THREE.MathUtils.lerp(0.8, 0.45, p);
      persistentObjectRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      {/* Graphic wall structures of World B */}
      <instancedMesh ref={corridorRef} args={[undefined, undefined, blockCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.3} metalness={0.7} />
      </instancedMesh>

      {/* Ceiling and floor graphic grids */}
      <mesh position={[0, -4.5, -80]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 180]} />
        <meshBasicMaterial color="#0A0E24" />
      </mesh>
      <mesh position={[0, 4.5, -80]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 180]} />
        <meshBasicMaterial color="#0A0E24" />
      </mesh>

      {/* PERSISTENT OBJECT from World A (retained through World B) */}
      <group ref={persistentObjectRef}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshPhysicalMaterial
            color="#2140FF"
            emissive="#2140FF"
            emissiveIntensity={0.8}
            roughness={0.1}
            metalness={0.9}
            clearcoat={1.0}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.05, 0]} />
          <meshBasicMaterial color="#CFFE16" wireframe transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
};
