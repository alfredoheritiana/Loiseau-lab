import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../context/ExperienceContext';

interface ParticlePhysics {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  scale: number;
}

export const HeroPhysicalSystem: React.FC<{ progress: number }> = ({ progress }) => {
  const { inputsRef, qualityLevel } = useExperience();

  const centralMeshRef = useRef<THREE.Group>(null);
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  const count = useMemo(() => {
    if (qualityLevel === 'STATIC') return 0;
    if (qualityLevel === 'LOW') return 30;
    if (qualityLevel === 'MEDIUM') return 60;
    return 100;
  }, [qualityLevel]);

  // Pre-allocated physics arrays to prevent allocation in useFrame
  const particles = useMemo<ParticlePhysics[]>(() => {
    const list: ParticlePhysics[] = [];
    for (let i = 0; i < 100; i++) {
      const radius = 2.0 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;
      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(phi);
      const z = radius * Math.sin(theta) * Math.cos(phi);

      list.push({
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        vRotX: (Math.random() - 0.5) * 0.02,
        vRotY: (Math.random() - 0.5) * 0.02,
        vRotZ: (Math.random() - 0.5) * 0.02,
        baseX: x,
        baseY: y,
        baseZ: z,
        scale: 0.12 + Math.random() * 0.18,
      });
    }
    return list;
  }, []);

  // Pre-allocated matrix and vectors to avoid garbage collection
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const dummyRot = useMemo(() => new THREE.Euler(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);

  // Set initial colors on the InstancedMesh
  useEffect(() => {
    if (!instancedRef.current) return;
    const mesh = instancedRef.current;
    const green = new THREE.Color('#CFFE16');
    const darkGlossy = new THREE.Color('#121411');
    const offWhite = new THREE.Color('#ECEEE5');

    for (let i = 0; i < count; i++) {
      if (i % 5 === 0) {
        dummyColor.copy(green);
      } else if (i % 3 === 0) {
        dummyColor.copy(offWhite);
      } else {
        dummyColor.copy(darkGlossy);
      }
      mesh.setColorAt(i, dummyColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, dummyColor]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const inputs = inputsRef.current;
    if (!inputs) return;

    const pX = inputs.pointerX;
    const pY = inputs.pointerY;
    const pVel = Math.min(inputs.pointerVel, 5);

    // Transition progress modulation (Scene 02 -> Scene 03)
    // Central object smoothly scales and frames into contained rectangular media
    const tProgress = inputs.sceneProgress.transition || 0;
    const exitProgress = Math.min(Math.max((progress - 0.7) / 0.3, 0), 1);

    if (centralMeshRef.current) {
      // Rotation with gentle inertia + pointer tilt
      centralMeshRef.current.rotation.y += dt * 0.4 + pX * 0.005;
      centralMeshRef.current.rotation.x = THREE.MathUtils.lerp(
        centralMeshRef.current.rotation.x,
        pY * 0.3,
        dt * 2.0
      );

      // Shared element transition interpolation (scales, flattens and moves to media container)
      const scale = THREE.MathUtils.lerp(1.2, 0.55, tProgress);
      const posY = THREE.MathUtils.lerp(0, -1.8, tProgress);
      const posZ = THREE.MathUtils.lerp(0, -1.2, tProgress);

      centralMeshRef.current.scale.set(scale, scale, scale);
      centralMeshRef.current.position.set(0, posY, posZ);
      centralMeshRef.current.visible = exitProgress < 0.99;
    }

    if (instancedRef.current && count > 0) {
      const mesh = instancedRef.current;

      // Pointer 3D repulsion vector
      const pointerRepulseX = pX * 3.5;
      const pointerRepulseY = pY * 2.5;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        // 1. Center attraction force towards home position
        const dx = p.baseX - p.x;
        const dy = p.baseY - p.y;
        const dz = p.baseZ - p.z;
        const springK = 1.8;
        p.vx += dx * springK * dt;
        p.vy += dy * springK * dt;
        p.vz += dz * springK * dt;

        // 2. Pointer repulsion force
        const toPointerX = p.x - pointerRepulseX;
        const toPointerY = p.y - pointerRepulseY;
        const distSq = toPointerX * toPointerX + toPointerY * toPointerY + 0.1;

        if (distSq < 9.0) {
          const force = (1.0 / distSq) * (0.8 + pVel * 0.2);
          p.vx += toPointerX * force * dt;
          p.vy += toPointerY * force * dt;
        }

        // 3. Damping (heavy, controlled, slow physical feel)
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.vz *= 0.92;

        // 4. Update position
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        // 5. Angular rotation
        p.rotX += p.vRotX;
        p.rotY += p.vRotY;
        p.rotZ += p.vRotZ;

        // Scatter outwards as transition scrubs
        const scatterScale = THREE.MathUtils.lerp(1.0, 0.05, tProgress);

        dummyPos.set(
          p.x + (tProgress > 0 ? (p.x > 0 ? 3 : -3) * tProgress : 0),
          p.y + (tProgress > 0 ? -2 * tProgress : 0),
          p.z
        );
        dummyRot.set(p.rotX, p.rotY, p.rotZ);
        const s = p.scale * scatterScale;
        dummyScale.set(s, s, s);

        dummyMatrix.compose(dummyPos, new THREE.Quaternion().setFromEuler(dummyRot), dummyScale);
        mesh.setMatrixAt(i, dummyMatrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = exitProgress < 0.95;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Architectural Sculptural Object (Lando media dominance + Lusion material) */}
      <group ref={centralMeshRef}>
        {/* Core Torus Knot / Monocoque shell */}
        <mesh castShadow receiveShadow>
          <torusKnotGeometry args={[1.2, 0.38, 128, 32, 2, 3]} />
          <meshPhysicalMaterial
            color="#141713"
            roughness={0.12}
            metalness={0.88}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
            reflectivity={0.9}
          />
        </mesh>

        {/* Inner Signal Green Ring Element */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.6, 0.04, 24, 64]} />
          <meshStandardMaterial
            color="#CFFE16"
            emissive="#CFFE16"
            emissiveIntensity={0.25}
            roughness={0.2}
          />
        </mesh>

        {/* Outer Minimal Technical Orbit Ring */}
        <mesh rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
          <ringGeometry args={[2.0, 2.02, 64]} />
          <meshBasicMaterial color="#ECEEE5" side={THREE.DoubleSide} transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Repeated physical debris elements with InstancedMesh */}
      {count > 0 && (
        <instancedMesh
          ref={instancedRef}
          args={[undefined, undefined, count]}
          castShadow
          receiveShadow
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            roughness={0.25}
            metalness={0.7}
            envMapIntensity={1.2}
          />
        </instancedMesh>
      )}
    </group>
  );
};
