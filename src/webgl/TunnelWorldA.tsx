import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../context/ExperienceContext';

interface TunnelWorldProps {
  progress: number; // 0 to 1 deterministic scroll progress
  visible: boolean;
}

export const TunnelWorldA: React.FC<TunnelWorldProps> = ({ progress, visible }) => {
  const { qualityLevel } = useExperience();

  const groupRef = useRef<THREE.Group>(null);
  const beamsRef = useRef<THREE.InstancedMesh>(null);
  const ringsRef = useRef<THREE.InstancedMesh>(null);
  const persistentObjectRef = useRef<THREE.Group>(null);

  // Spline path for the camera and tunnel spine
  const spline = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2, 1, -15),
      new THREE.Vector3(-3, -1, -35),
      new THREE.Vector3(3, 2, -60),
      new THREE.Vector3(0, 0, -85),
      new THREE.Vector3(-2, 1, -110),
      new THREE.Vector3(0, 0, -135),
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  const beamCount = qualityLevel === 'LOW' ? 60 : qualityLevel === 'MEDIUM' ? 120 : 180;
  const ringCount = qualityLevel === 'LOW' ? 20 : qualityLevel === 'MEDIUM' ? 35 : 50;

  // Colors progression: 0.00 neutral, 0.20 red, 0.40 cyan, 0.60 green, 0.80 magenta, 1.00 white
  const colorKeyframes = useMemo(
    () => [
      { t: 0.0, c: new THREE.Color('#4A4E46') },
      { t: 0.2, c: new THREE.Color('#FF2233') },
      { t: 0.4, c: new THREE.Color('#00E5FF') },
      { t: 0.6, c: new THREE.Color('#CFFE16') },
      { t: 0.8, c: new THREE.Color('#FF0099') },
      { t: 1.0, c: new THREE.Color('#FFFFFF') },
    ],
    []
  );

  const getInterpolatedColor = (p: number, target: THREE.Color) => {
    const clamped = Math.max(0, Math.min(1, p));
    for (let i = 0; i < colorKeyframes.length - 1; i++) {
      const k1 = colorKeyframes[i];
      const k2 = colorKeyframes[i + 1];
      if (clamped >= k1.t && clamped <= k2.t) {
        const factor = (clamped - k1.t) / (k2.t - k1.t);
        target.copy(k1.c).lerp(k2.c, factor);
        return target;
      }
    }
    target.copy(colorKeyframes[colorKeyframes.length - 1].c);
    return target;
  };

  // Reusable matrix and vectors
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const dummyRot = useMemo(() => new THREE.Euler(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Initialize ring and beam instances along spline
  useEffect(() => {
    if (!beamsRef.current || !ringsRef.current) return;

    // Rings along spline
    for (let i = 0; i < ringCount; i++) {
      const t = i / ringCount;
      const point = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t);

      dummyPos.copy(point);
      dummyRot.setFromVector3(tangent.clone().multiplyScalar(Math.PI));
      dummyScale.set(3.5, 3.5, 0.4);
      dummyMatrix.compose(dummyPos, new THREE.Quaternion().setFromEuler(dummyRot), dummyScale);
      ringsRef.current.setMatrixAt(i, dummyMatrix);
      ringsRef.current.setColorAt(i, new THREE.Color('#1F241D'));
    }
    ringsRef.current.instanceMatrix.needsUpdate = true;
    if (ringsRef.current.instanceColor) ringsRef.current.instanceColor.needsUpdate = true;

    // Structural beams forming tunnel cage
    for (let i = 0; i < beamCount; i++) {
      const t = (i % 30) / 30;
      const angle = Math.floor(i / 30) * ((Math.PI * 2) / (beamCount / 30));
      const point = spline.getPointAt(t);

      const rad = 3.2;
      const bx = point.x + Math.cos(angle) * rad;
      const by = point.y + Math.sin(angle) * rad;
      const bz = point.z;

      dummyPos.set(bx, by, bz);
      dummyRot.set(0, 0, angle);
      dummyScale.set(0.15, 0.15, 4.0);
      dummyMatrix.compose(dummyPos, new THREE.Quaternion().setFromEuler(dummyRot), dummyScale);
      beamsRef.current.setMatrixAt(i, dummyMatrix);
      beamsRef.current.setColorAt(i, new THREE.Color('#181A17'));
    }
    beamsRef.current.instanceMatrix.needsUpdate = true;
    if (beamsRef.current.instanceColor) beamsRef.current.instanceColor.needsUpdate = true;
  }, [beamCount, ringCount, spline, dummyMatrix, dummyPos, dummyRot, dummyScale]);

  useFrame((state, delta) => {
    if (!visible) return;
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Update dynamic emissive colors according to scroll position
    getInterpolatedColor(clampedProgress, tempColor);

    if (ringsRef.current && ringsRef.current.instanceColor) {
      // Dynamic convergence when approaching portal (0.85 -> 1.0)
      const convergence = Math.max(0, (clampedProgress - 0.75) / 0.25);

      for (let i = 0; i < ringCount; i++) {
        const ringT = i / ringCount;
        const distFromCamera = Math.abs(ringT - clampedProgress);

        if (distFromCamera < 0.15) {
          ringsRef.current.setColorAt(i, tempColor);
        } else {
          ringsRef.current.setColorAt(i, new THREE.Color('#151814'));
        }
      }
      ringsRef.current.instanceColor.needsUpdate = true;
    }

    // Update position of the persistent object (accompanies the camera along the travel)
    if (persistentObjectRef.current) {
      const objProgress = Math.min(clampedProgress + 0.05, 0.98);
      const objPos = spline.getPointAt(objProgress);
      persistentObjectRef.current.position.set(objPos.x + 0.8, objPos.y - 0.4, objPos.z - 2.0);
      persistentObjectRef.current.rotation.x += delta * 1.5;
      persistentObjectRef.current.rotation.y += delta * 2.0;

      // Colorize persistent object with signal green
      const scale = THREE.MathUtils.lerp(0.4, 0.6, Math.sin(clampedProgress * Math.PI));
      persistentObjectRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      {/* Structural tunnel beams */}
      <instancedMesh ref={beamsRef} args={[undefined, undefined, beamCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.4} metalness={0.8} />
      </instancedMesh>

      {/* Structural rings */}
      <instancedMesh ref={ringsRef} args={[undefined, undefined, ringCount]}>
        <torusGeometry args={[1, 0.08, 16, 48]} />
        <meshStandardMaterial roughness={0.2} metalness={0.7} />
      </instancedMesh>

      {/* THE PERSISTENT SHARED OBJECT (survives into World B and then Editorial Campaign!) */}
      <group ref={persistentObjectRef}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.8, 1]} />
          <meshPhysicalMaterial
            color="#CFFE16"
            emissive="#CFFE16"
            emissiveIntensity={0.6}
            roughness={0.15}
            metalness={0.85}
            clearcoat={1.0}
            wireframe={false}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshBasicMaterial color="#FFFFFF" wireframe transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Portal convergence light flash at the end (Scene 13) */}
      {progress > 0.82 && (
        <mesh position={[0, 0, -135]}>
          <planeGeometry args={[40, 40]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={Math.min((progress - 0.82) / 0.16, 1)}
          />
        </mesh>
      )}
    </group>
  );
};
