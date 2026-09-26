import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody, BallCollider, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useExperience } from '../../context/ExperienceContext';
import { SeededNode, generateSeededLayout } from './seededLayout';
import { HERO_COLORS } from './heroConfig';

interface HeroPhysicsFieldProps {
  nodeCount: number;
  corePosition: THREE.Vector3;
  onPositionsUpdate?: (positions: Map<number, THREE.Vector3>) => void;
  onPhysicsReady?: () => void;
}

// Single node component within the Rapier Physics world
const PhysicalNodeItem: React.FC<{
  node: SeededNode;
  onRegisterBody: (id: number, body: RapierRigidBody) => void;
  onUnregisterBody: (id: number) => void;
  scrollProgress: number;
}> = ({ node, onRegisterBody, onUnregisterBody, scrollProgress }) => {
  const bodyRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (bodyRef.current) {
      onRegisterBody(node.id, bodyRef.current);
    }
    return () => onUnregisterBody(node.id);
  }, [node.id, onRegisterBody, onUnregisterBody]);

  // Geometries reused across node family
  const geometry = useMemo(() => {
    switch (node.shapeType) {
      case 0: // Rounded Capsule
        return new THREE.CapsuleGeometry(node.radius * 0.7, node.length * 0.8, 8, 16);
      case 1: // Soft Polyhedron (Dodecahedron)
        return new THREE.DodecahedronGeometry(node.radius * 1.15, 0);
      case 2: // Compressed Ellipsoid
      default: {
        const geom = new THREE.SphereGeometry(node.radius, 16, 16);
        geom.scale(1.2, 0.75, 1.0);
        return geom;
      }
    }
  }, [node.shapeType, node.radius, node.length]);

  // Material selection based on node materialType
  const material = useMemo(() => {
    if (node.materialType === 'lime') {
      return new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.SIGNAL_LIME,
        emissive: HERO_COLORS.LIME_EMISSIVE,
        emissiveIntensity: 0.35,
        metalness: 0.25,
        roughness: 0.28,
      });
    }
    if (node.materialType === 'offwhite') {
      return new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.OFFWHITE_SATIN,
        metalness: 0.15,
        roughness: 0.38,
        clearcoat: 0.2,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: HERO_COLORS.GRAPHITE_DARK,
      metalness: 0.85,
      roughness: 0.24,
      clearcoat: 0.4,
    });
  }, [node.materialType]);

  return (
    <RigidBody
      ref={bodyRef}
      position={[node.initialPos.x, node.initialPos.y, node.initialPos.z]}
      colliders={node.shapeType === 0 ? 'hull' : 'ball'}
      linearDamping={3.8}
      angularDamping={3.5}
      restitution={0.25}
      mass={node.mass}
    >
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </RigidBody>
  );
};

export const HeroPhysicsField: React.FC<HeroPhysicsFieldProps> = ({
  nodeCount,
  corePosition,
  onPositionsUpdate,
  onPhysicsReady,
}) => {
  const { inputsRef } = useExperience();
  const { camera } = useThree();

  const bodiesMap = useRef<Map<number, RapierRigidBody>>(new Map());
  const positionsMap = useRef<Map<number, THREE.Vector3>>(new Map());
  const pointerBodyRef = useRef<RapierRigidBody>(null);
  const isReadyReported = useRef(false);

  const { nodes } = useMemo(() => generateSeededLayout(nodeCount), [nodeCount]);

  const handleRegisterBody = (id: number, body: RapierRigidBody) => {
    bodiesMap.current.set(id, body);
    if (!isReadyReported.current && bodiesMap.current.size >= Math.min(nodeCount, 6)) {
      isReadyReported.current = true;
      onPhysicsReady?.();
    }
  };

  const handleUnregisterBody = (id: number) => {
    bodiesMap.current.delete(id);
    positionsMap.current.delete(id);
  };

  // Reusable vectors for zero allocation in useFrame
  const tempTarget = useMemo(() => new THREE.Vector3(), []);
  const tempCurrent = useMemo(() => new THREE.Vector3(), []);
  const tempForce = useMemo(() => new THREE.Vector3(), []);
  const pointerTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const inputs = inputsRef.current;
    const heroScroll = inputs?.sceneProgress.hero || 0;

    // 1. Update Kinematic Pointer Collider
    if (pointerBodyRef.current) {
      // Unproject pointer from NDC to Z=0 interaction plane
      const pX = inputs?.pointerX || 0;
      const pY = inputs?.pointerY || 0;
      const vel = inputs?.pointerVel || 0;

      // Interaction plane at Z=0.5
      const planeZ = 0.5;
      const dist = camera.position.z - planeZ;
      const vFOV = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const halfHeight = Math.tan(vFOV / 2) * dist;
      const halfWidth = halfHeight * (camera as THREE.PerspectiveCamera).aspect;

      pointerTarget.set(pX * halfWidth, pY * halfHeight, planeZ);

      // Smooth kinematic travel
      const curPointer = pointerBodyRef.current.translation();
      const nextX = THREE.MathUtils.lerp(curPointer.x, pointerTarget.x, 0.25);
      const nextY = THREE.MathUtils.lerp(curPointer.y, pointerTarget.y, 0.25);
      const nextZ = THREE.MathUtils.lerp(curPointer.z, pointerTarget.z, 0.25);

      pointerBodyRef.current.setNextKinematicTranslation({
        x: nextX,
        y: nextY,
        z: nextZ,
      });
    }

    // 2. Apply Damped Field Attraction toward Seeded Targets
    const springK = 3.6; // field attraction stiffness
    const scrollRetreatZ = -heroScroll * 2.2;

    for (const node of nodes) {
      const body = bodiesMap.current.get(node.id);
      if (!body) continue;

      const trans = body.translation();
      tempCurrent.set(trans.x, trans.y, trans.z);

      // Cache position for connectors
      let storedPos = positionsMap.current.get(node.id);
      if (!storedPos) {
        storedPos = new THREE.Vector3();
        positionsMap.current.set(node.id, storedPos);
      }
      storedPos.copy(tempCurrent);

      // Target with scroll retreat
      tempTarget.copy(node.targetPos);
      tempTarget.z += scrollRetreatZ;

      // Force = (Target - Current) * K
      tempForce.subVectors(tempTarget, tempCurrent).multiplyScalar(springK * delta);

      // Pointer impulse push when pointer is near
      const distToPointer = tempCurrent.distanceTo(pointerTarget);
      if (distToPointer < 1.4) {
        const pushDir = tempCurrent.clone().sub(pointerTarget).normalize();
        const pushStrength = (1.4 - distToPointer) * (1.2 + (inputs?.pointerVel || 0) * 0.4);
        tempForce.add(pushDir.multiplyScalar(pushStrength * delta * 8.0));
      }

      body.applyImpulse(
        {
          x: tempForce.x,
          y: tempForce.y,
          z: tempForce.z,
        },
        true
      );
    }

    // Expose positions to connectors
    onPositionsUpdate?.(positionsMap.current);
  });

  return (
    <Physics gravity={[0, 0, 0]} colliders={false}>
      {/* Invisible Kinematic Pointer Collider */}
      <RigidBody ref={pointerBodyRef} type="kinematicPosition" colliders={false}>
        <BallCollider args={[0.55]} />
      </RigidBody>

      {/* Seeded Physical Node Bodies */}
      {nodes.map((node) => (
        <PhysicalNodeItem
          key={node.id}
          node={node}
          onRegisterBody={handleRegisterBody}
          onUnregisterBody={handleUnregisterBody}
          scrollProgress={inputsRef.current?.sceneProgress.hero || 0}
        />
      ))}
    </Physics>
  );
};
