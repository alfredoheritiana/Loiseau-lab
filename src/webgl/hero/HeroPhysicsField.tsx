import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody, BallCollider, RapierRigidBody } from '@react-three/rapier';
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

const PhysicalNodeItem: React.FC<{
  node: SeededNode;
  onRegisterBody: (id: number, body: RapierRigidBody) => void;
  onUnregisterBody: (id: number) => void;
}> = ({ node, onRegisterBody, onUnregisterBody }) => {
  const bodyRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (bodyRef.current) {
      onRegisterBody(node.id, bodyRef.current);
    }
    return () => onUnregisterBody(node.id);
  }, [node.id, onRegisterBody, onUnregisterBody]);

  // 3 disciplined geometry families
  const geometry = useMemo(() => {
    switch (node.shapeType) {
      case 0: {
        // Family A: Rounded graphite block
        return new THREE.BoxGeometry(node.width, node.height, node.depth);
      }
      case 1: {
        // Family B: Off-white compressed ellipsoid
        const geom = new THREE.SphereGeometry(node.radius * 1.1, 16, 16);
        geom.scale(1.25, 0.75, 0.85);
        return geom;
      }
      case 2:
      default: {
        // Family C: Small aerodynamic lime capsule
        return new THREE.CapsuleGeometry(node.radius * 0.75, node.height * 0.85, 6, 12);
      }
    }
  }, [node.shapeType, node.width, node.height, node.depth, node.radius]);

  // Calibrated materials matching Section 40, 41, 42
  const material = useMemo(() => {
    if (node.materialType === 'lime') {
      return new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.SIGNAL_LIME,
        emissive: HERO_COLORS.LIME_EMISSIVE,
        emissiveIntensity: 0.22,
        metalness: 0.28,
        roughness: 0.22,
      });
    }
    if (node.materialType === 'offwhite') {
      return new THREE.MeshPhysicalMaterial({
        color: HERO_COLORS.OFFWHITE_SATIN,
        metalness: 0.18,
        roughness: 0.36,
        clearcoat: 0.25,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: HERO_COLORS.GRAPHITE_DARK,
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
    });
  }, [node.materialType]);

  return (
    <RigidBody
      ref={bodyRef}
      position={[node.initialPos.x, node.initialPos.y, node.initialPos.z]}
      colliders="ball"
      linearDamping={4.5}
      angularDamping={4.2}
      restitution={0.18}
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

  // Pre-allocated vectors for useFrame (Zero allocation in hot loops)
  const tempTarget = useMemo(() => new THREE.Vector3(), []);
  const tempCurrent = useMemo(() => new THREE.Vector3(), []);
  const tempForce = useMemo(() => new THREE.Vector3(), []);
  const pointerTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const inputs = inputsRef.current;
    const heroScroll = inputs?.sceneProgress.hero || 0;

    // 1. Update Kinematic Pointer Collider on Z = 0 plane
    if (pointerBodyRef.current) {
      const pX = inputs?.pointerX || 0;
      const pY = inputs?.pointerY || 0;

      const planeZ = 0.0;
      const dist = camera.position.z - planeZ;
      const vFOV = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const halfHeight = Math.tan(vFOV / 2) * dist;
      const halfWidth = halfHeight * (camera as THREE.PerspectiveCamera).aspect;

      pointerTarget.set(pX * halfWidth, pY * halfHeight, planeZ);

      const curPointer = pointerBodyRef.current.translation();
      const nextX = THREE.MathUtils.lerp(curPointer.x, pointerTarget.x, 0.22);
      const nextY = THREE.MathUtils.lerp(curPointer.y, pointerTarget.y, 0.22);
      const nextZ = THREE.MathUtils.lerp(curPointer.z, pointerTarget.z, 0.22);

      pointerBodyRef.current.setNextKinematicTranslation({
        x: nextX,
        y: nextY,
        z: nextZ,
      });
    }

    // 2. Viscous, heavily damped field attraction with strict depth containment
    const springK = 4.2;
    const scrollRetreatZ = -heroScroll * 1.8;

    for (const node of nodes) {
      const body = bodiesMap.current.get(node.id);
      if (!body) continue;

      const trans = body.translation();
      tempCurrent.set(trans.x, trans.y, trans.z);

      // Depth safety clamp: ensure node NEVER comes close to camera (z > 0.65)
      if (trans.z > 0.65) {
        body.setTranslation({ x: trans.x, y: trans.y, z: 0.65 }, true);
      }

      // Cache position for structural connectors
      let storedPos = positionsMap.current.get(node.id);
      if (!storedPos) {
        storedPos = new THREE.Vector3();
        positionsMap.current.set(node.id, storedPos);
      }
      storedPos.copy(tempCurrent);

      // Target with gentle scroll migration
      tempTarget.copy(node.targetPos);
      tempTarget.z += scrollRetreatZ;

      // Restoring Force = (Target - Current) * K
      tempForce.subVectors(tempTarget, tempCurrent).multiplyScalar(springK * delta);

      // Controlled pointer displacement with clamped impulse
      const distToPointer = tempCurrent.distanceTo(pointerTarget);
      if (distToPointer < 1.3) {
        const pushDir = tempCurrent.clone().sub(pointerTarget).normalize();
        const velocityMultiplier = Math.min(2.5, 1.0 + (inputs?.pointerVel || 0) * 0.35);
        const dragMultiplier = inputs?.pointerDown ? 1.4 : 1.0;
        const pushMagnitude = (1.3 - distToPointer) * 1.8 * velocityMultiplier * dragMultiplier;

        tempForce.add(pushDir.multiplyScalar(pushMagnitude * delta * 5.0));
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

    onPositionsUpdate?.(positionsMap.current);
  });

  return (
    <Physics gravity={[0, 0, 0]} colliders={false}>
      {/* Invisible Kinematic Pointer Collider */}
      <RigidBody ref={pointerBodyRef} type="kinematicPosition" colliders={false}>
        <BallCollider args={[0.48]} />
      </RigidBody>

      {/* Seeded Physical Node Bodies */}
      {nodes.map((node) => (
        <PhysicalNodeItem
          key={node.id}
          node={node}
          onRegisterBody={handleRegisterBody}
          onUnregisterBody={handleUnregisterBody}
        />
      ))}
    </Physics>
  );
};
