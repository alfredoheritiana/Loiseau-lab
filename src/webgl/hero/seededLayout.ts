import * as THREE from 'three';

export interface SeededNode {
  id: number;
  shapeType: 0 | 1 | 2; // 0 = Capsule, 1 = Soft Polyhedron, 2 = Compressed Ellipsoid
  radius: number;
  length: number;
  targetPos: THREE.Vector3;
  initialPos: THREE.Vector3;
  materialType: 'graphite' | 'offwhite' | 'lime';
  isPrimary: boolean;
  mass: number;
}

export interface ConnectorPair {
  nodeA: number; // -1 for core
  nodeB: number;
  isLime: boolean;
  restLength: number;
}

// Pseudo-random seeded generator for 100% deterministic layout
function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSeededLayout(maxNodes: number = 24): {
  nodes: SeededNode[];
  connectors: ConnectorPair[];
} {
  const rand = createPRNG(42069);

  // Cluster centroid offset: slightly right (+0.55) and slightly above (+0.35)
  // Designed per Lando asymmetric editorial balance leaving lower-left for typography
  const centerOffset = new THREE.Vector3(0.55, 0.35, 0.0);

  const nodes: SeededNode[] = [];

  for (let i = 0; i < maxNodes; i++) {
    const isPrimary = i < 6;

    // Angle and radius on ellipsoid shell
    const theta = rand() * Math.PI * 2;
    const phi = (rand() - 0.5) * Math.PI * 0.85;

    // Radius distribution: primary nodes closer to core, secondary further out
    const dist = isPrimary ? 1.0 + rand() * 0.9 : 1.7 + rand() * 1.5;

    // Asymmetric elongation: wider along X, compressed along Z
    const rx = dist * 1.25;
    const ry = dist * 0.95;
    const rz = dist * 0.65;

    const x = Math.cos(theta) * Math.cos(phi) * rx + centerOffset.x;
    const y = Math.sin(phi) * ry + centerOffset.y;
    const z = Math.sin(theta) * Math.cos(phi) * rz + centerOffset.z;

    const targetPos = new THREE.Vector3(x, y, z);
    // Initial position slightly offset for a gentle physical settle on load
    const initialPos = new THREE.Vector3(
      x + (rand() - 0.5) * 0.3,
      y + (rand() - 0.5) * 0.3,
      z + (rand() - 0.5) * 0.3
    );

    // Shape assignment: 0: Capsule, 1: Polyhedron, 2: Ellipsoid
    const shapeType = (Math.floor(rand() * 3) as 0 | 1 | 2);

    // Material distribution: ~70% graphite, ~20% offwhite, ~10% lime accent
    const matRoll = rand();
    let materialType: 'graphite' | 'offwhite' | 'lime' = 'graphite';
    if (matRoll > 0.88) {
      materialType = 'lime';
    } else if (matRoll > 0.68) {
      materialType = 'offwhite';
    }

    const radius = 0.18 + rand() * 0.16;
    const length = 0.35 + rand() * 0.3;
    const mass = 1.0 + radius * 3.0;

    nodes.push({
      id: i,
      shapeType,
      radius,
      length,
      targetPos,
      initialPos,
      materialType,
      isPrimary,
      mass,
    });
  }

  // Connectors: 8 to 14 meaningful structural relationships
  // Connect core (-1) to primary nodes, and primary nodes to select secondary nodes
  const connectors: ConnectorPair[] = [
    // Core to primary nodes
    { nodeA: -1, nodeB: 0, isLime: false, restLength: 1.4 },
    { nodeA: -1, nodeB: 1, isLime: true, restLength: 1.6 },
    { nodeA: -1, nodeB: 2, isLime: false, restLength: 1.5 },
    { nodeA: -1, nodeB: 3, isLime: false, restLength: 1.8 },
    { nodeA: -1, nodeB: 4, isLime: true, restLength: 1.7 },
    { nodeA: -1, nodeB: 5, isLime: false, restLength: 1.5 },

    // Primary to secondary
    { nodeA: 0, nodeB: 6, isLime: false, restLength: 1.3 },
    { nodeA: 1, nodeB: 7, isLime: false, restLength: 1.4 },
    { nodeA: 2, nodeB: 8, isLime: true, restLength: 1.5 },
    { nodeA: 3, nodeB: 9, isLime: false, restLength: 1.3 },
    { nodeA: 4, nodeB: 10, isLime: false, restLength: 1.6 },
    { nodeA: 5, nodeB: 11, isLime: false, restLength: 1.4 },
    { nodeA: 6, nodeB: 12, isLime: false, restLength: 1.5 },
    { nodeA: 7, nodeB: 13, isLime: true, restLength: 1.3 },
  ];

  return { nodes, connectors };
}
