import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateSeededLayout } from './seededLayout';
import { HERO_COLORS } from './heroConfig';

interface HeroConnectorsProps {
  connectorCount: number;
  corePosition: THREE.Vector3;
  nodePositionsRef: React.MutableRefObject<Map<number, THREE.Vector3>>;
}

export const HeroConnectors: React.FC<HeroConnectorsProps> = ({
  connectorCount,
  corePosition,
  nodePositionsRef,
}) => {
  const lineRef = useRef<THREE.LineSegments>(null);

  const { connectors } = useMemo(() => {
    const layout = generateSeededLayout(20);
    return {
      connectors: layout.connectors.slice(0, connectorCount),
    };
  }, [connectorCount]);

  const maxLines = connectors.length;
  const positions = useMemo(() => new Float32Array(maxLines * 2 * 3), [maxLines]);
  const colors = useMemo(() => new Float32Array(maxLines * 2 * 3), [maxLines]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [positions, colors]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.42, // Restrained, thin and structural
        blending: THREE.NormalBlending,
        depthWrite: false,
      }),
    []
  );

  // Pre-allocated colors to avoid GC
  const colNeutral = useMemo(() => new THREE.Color(HERO_COLORS.CONNECTOR_NEUTRAL), []);
  const colLime = useMemo(() => new THREE.Color(HERO_COLORS.CONNECTOR_LIME), []);
  const tempCol = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!lineRef.current) return;
    const positionsAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const colorsAttr = lineRef.current.geometry.attributes.color as THREE.BufferAttribute;

    const posArray = positionsAttr.array as Float32Array;
    const colArray = colorsAttr.array as Float32Array;
    const map = nodePositionsRef.current;

    for (let i = 0; i < maxLines; i++) {
      const conn = connectors[i];

      let posA = corePosition;
      if (conn.nodeA !== -1) {
        const storedA = map.get(conn.nodeA);
        if (storedA) posA = storedA;
      }

      let posB = corePosition;
      const storedB = map.get(conn.nodeB);
      if (storedB) posB = storedB;

      const idx = i * 6;
      posArray[idx + 0] = posA.x;
      posArray[idx + 1] = posA.y;
      posArray[idx + 2] = posA.z;

      posArray[idx + 3] = posB.x;
      posArray[idx + 4] = posB.y;
      posArray[idx + 5] = posB.z;

      // Dynamic physical tension response:
      // Extension increases brightness subtly to communicate structural strain
      const currentDist = posA.distanceTo(posB);
      const strain = Math.max(0, currentDist - conn.restLength);
      const tensionBoost = Math.min(0.4, strain * 0.8);

      const baseCol = conn.isLime ? colLime : colNeutral;
      tempCol.copy(baseCol);
      if (tensionBoost > 0) {
        tempCol.offsetHSL(0, 0, tensionBoost);
      }

      colArray[idx + 0] = tempCol.r;
      colArray[idx + 1] = tempCol.g;
      colArray[idx + 2] = tempCol.b;

      colArray[idx + 3] = tempCol.r;
      colArray[idx + 4] = tempCol.g;
      colArray[idx + 5] = tempCol.b;
    }

    positionsAttr.needsUpdate = true;
    colorsAttr.needsUpdate = true;
  });

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
};
