import * as THREE from 'three';

export interface SeededNode {
  id: number;
  shapeType: 0 | 1 | 2; // 0 = Rounded Block (Graphite), 1 = Compressed Ellipsoid (Off-white), 2 = Aero Capsule (Lime)
  radius: number;
  width: number;
  height: number;
  depth: number;
  targetPos: THREE.Vector3;
  initialPos: THREE.Vector3;
  materialType: 'graphite' | 'offwhite' | 'lime';
  isPrimary: boolean;
  mass: number;
}

export interface ConnectorPair {
  nodeA: number; // -1 for central core
  nodeB: number;
  isLime: boolean;
  restLength: number;
}

function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSeededLayout(maxNodes: number = 20): {
  nodes: SeededNode[];
  connectors: ConnectorPair[];
} {
  const rand = createPRNG(987654321);

  // Asymmetric cluster centroid offset: placed right (+0.70) and above (+0.38)
  // Strictly protects lower-left typography safe zone (x < 0, y < 0)
  const centerOffset = new THREE.Vector3(0.70, 0.38, -0.15);

  const nodes: SeededNode[] = [];

  for (let i = 0; i < maxNodes; i++) {
    const isPrimary = i < 5;

    // Angle and radius distribution surrounding the core
    const theta = rand() * Math.PI * 2;
    // Bias angles away from lower-left (theta between 3.6 and 5.0 radians)
    let angle = theta;
    if (angle > 3.6 && angle < 5.0) {
      angle = (angle + 1.8) % (Math.PI * 2);
    }

    const phi = (rand() - 0.5) * Math.PI * 0.7;

    // Distance from core: primary nodes closer (1.1 - 1.6), secondary (1.6 - 2.4)
    const dist = isPrimary ? 1.05 + rand() * 0.55 : 1.65 + rand() * 0.75;

    // Ellipsoidal cluster bounds (compressed in Z to prevent camera clipping)
    const rx = dist * 1.25;
    const ry = dist * 0.95;
    const rz = dist * 0.42;

    const x = Math.cos(angle) * Math.cos(phi) * rx + centerOffset.x;
    const y = Math.sin(phi) * ry + centerOffset.y;
    // Strict Z containment: z between -1.25 and +0.50 (Never passes close to camera at z=5.2)
    const z = Math.min(0.50, Math.max(-1.25, Math.sin(angle) * Math.cos(phi) * rz + centerOffset.z));

    const targetPos = new THREE.Vector3(x, y, z);
    const initialPos = new THREE.Vector3(
      x + (rand() - 0.5) * 0.25,
      y + (rand() - 0.5) * 0.25,
      z + (rand() - 0.5) * 0.15
    );

    // Shape family selection (3 controlled families only)
    let shapeType: 0 | 1 | 2 = 0;
    let materialType: 'graphite' | 'offwhite' | 'lime' = 'graphite';

    const matRoll = rand();
    if (matRoll > 0.82) {
      // 2: Small lime aerodynamic capsule (~8-12%)
      shapeType = 2;
      materialType = 'lime';
    } else if (matRoll > 0.60) {
      // 1: Off-white compressed ellipsoid (~20%)
      shapeType = 1;
      materialType = 'offwhite';
    } else {
      // 0: Rounded graphite block (~70%)
      shapeType = 0;
      materialType = 'graphite';
    }

    // Scale hierarchy: Primary support: 0.30 - 0.38, Secondary: 0.14 - 0.22
    const baseScale = isPrimary ? 0.32 + rand() * 0.08 : 0.14 + rand() * 0.08;
    const radius = baseScale * 0.5;
    const width = baseScale * (0.8 + rand() * 0.4);
    const height = baseScale * (0.6 + rand() * 0.3);
    const depth = baseScale * (0.5 + rand() * 0.2);

    const mass = 0.8 + baseScale * 2.5;

    nodes.push({
      id: i,
      shapeType,
      radius,
      width,
      height,
      depth,
      targetPos,
      initialPos,
      materialType,
      isPrimary,
      mass,
    });
  }

  // Structural Connectors: 10–12 on HIGH, 7–9 on MEDIUM, 4–6 on LOW
  // Clean asymmetric structural network: Core ↔ 4–5 Primary, Primary ↔ Selected Secondary
  const connectors: ConnectorPair[] = [
    // Core (-1) to primary nodes
    { nodeA: -1, nodeB: 0, isLime: false, restLength: 1.35 },
    { nodeA: -1, nodeB: 1, isLime: true, restLength: 1.45 },
    { nodeA: -1, nodeB: 2, isLime: false, restLength: 1.30 },
    { nodeA: -1, nodeB: 3, isLime: false, restLength: 1.55 },
    { nodeA: -1, nodeB: 4, isLime: true, restLength: 1.40 },

    // Primary to secondary structural strands
    { nodeA: 0, nodeB: 5, isLime: false, restLength: 1.15 },
    { nodeA: 1, nodeB: 6, isLime: false, restLength: 1.25 },
    { nodeA: 2, nodeB: 7, isLime: true, restLength: 1.20 },
    { nodeA: 3, nodeB: 8, isLime: false, restLength: 1.30 },
    { nodeA: 4, nodeB: 9, isLime: false, restLength: 1.15 },
    { nodeA: 5, nodeB: 10, isLime: false, restLength: 1.10 },
    { nodeA: 6, nodeB: 11, isLime: true, restLength: 1.20 },
  ];

  return { nodes, connectors };
}
