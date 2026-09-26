import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConnectorPair, generateSeededLayout } from './seededLayout';
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
    const layout = generateSeededLayout(24);
    return {
      connectors: layout.connectors.slice(0, connectorCount),
    };
  }, [connectorCount]);

  // Pre-allocated buffers: 2 vertices per line segment * 3 components (x, y, z)
  const maxLines = connectors.length;
  const positions = useMemo(() => new Float32Array(maxLines * 2 * 3), [maxLines]);
  const colors = useMemo(() => {
    const colArray = new Float32Array(maxLines * 2 * 3);
    const colOffwhite = new THREE.Color(HERO_COLORS.OFFWHITE_SATIN);
    const colLime = new THREE.Color(HERO_COLORS.SIGNAL_LIME);
    const colGraphite = new THREE.Color(HERO_COLORS.GRAPHITE_SURFACE);

    for (let i = 0; i < maxLines; i++) {
      const conn = connectors[i];
      const c = conn.isLime ? colLime : i % 2 === 0 ? colOffwhite : colGraphite;

      // Vertex 1
      colArray[i * 6 + 0] = c.r;
      colArray[i * 6 + 1] = c.g;
      colArray[i * 6 + 2] = c.b;

      // Vertex 2
      colArray[i * 6 + 3] = c.r;
      colArray[i * 6 + 4] = c.g;
      colArray[i * 6 + 5] = c.b;
    }
    return colArray;
  }, [connectors, maxLines]);

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
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame(() => {
    if (!lineRef.current) return;
    const positionsAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = positionsAttr.array as Float32Array;

    const map = nodePositionsRef.current;

    for (let i = 0; i < maxLines; i++) {
      const conn = connectors[i];

      // Origin vertex (core if -1, else nodeA position)
      let posA = corePosition;
      if (conn.nodeA !== -1) {
        const storedA = map.get(conn.nodeA);
        if (storedA) posA = storedA;
      }

      // Destination vertex (nodeB position)
      let posB = corePosition;
      const storedB = map.get(conn.nodeB);
      if (storedB) posB = storedB;

      const idx = i * 6;
      array[idx + 0] = posA.x;
      array[idx + 1] = posA.y;
      array[idx + 2] = posA.z;

      array[idx + 3] = posB.x;
      array[idx + 4] = posB.y;
      array[idx + 5] = posB.z;
    }

    positionsAttr.needsUpdate = true;
  });

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
};
