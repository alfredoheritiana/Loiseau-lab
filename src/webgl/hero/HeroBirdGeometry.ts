import * as THREE from 'three';
import { HERO_COLORS } from './heroConfig';

export interface BirdSampledParticle {
  targetPos: THREE.Vector3;  // Target coordinate in stabilized bird shape
  initialPos: THREE.Vector3; // Sparse field position for Act 1
  normal: THREE.Vector3;
  color: THREE.Color;
  size: number;
  flowOrder: number;         // 0.0 -> 1.0: order of formation (tips -> leading edge -> body -> tail -> interior)
  spineProg: number;         // 0.0 -> 1.0: distance along tail -> body -> wing -> tip for lime pulse
  zoneId: number;            // 0: body/head, 1: upper wing, 2: lower wing, 3: tail
}

/**
 * Creates a sickle-shaped aerodynamic swift wing geometry.
 */
function createSickleWingGeometry(
  rootPos: THREE.Vector3,
  midPos: THREE.Vector3,
  tipPos: THREE.Vector3,
  rootChord: number,
  midChord: number,
  tipChord: number,
  curvatureZ: number,
  steps: number = 40,
  crossSegments: number = 8
): THREE.BufferGeometry {
  const curve = new THREE.QuadraticBezierCurve3(rootPos, midPos, tipPos);
  const frames = curve.computeFrenetFrames(steps, false);

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = curve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    // Chord tapers smoothly from root to needle tip
    let chord = rootChord * (1 - t) + tipChord * t;
    if (t > 0.5) {
      const subT = (t - 0.5) / 0.5;
      chord = midChord * (1 - subT) + tipChord * subT;
    } else {
      const subT = t / 0.5;
      chord = rootChord * (1 - subT) + midChord * subT;
    }

    const thickness = chord * 0.14;

    for (let j = 0; j <= crossSegments; j++) {
      const u = (j / crossSegments) * Math.PI * 2;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      // Aerodynamic camber: leading edge thicker, trailing edge thin
      const camber = Math.sin(u * 0.5) * (chord * 0.08);

      const offsetX = binormal.clone().multiplyScalar(cosU * (chord * 0.5));
      const offsetY = normal.clone().multiplyScalar(sinU * (thickness * 0.5) + camber);
      offsetY.z += Math.sin(t * Math.PI) * curvatureZ;

      const vert = pt.clone().add(offsetX).add(offsetY);
      vertices.push(vert.x, vert.y, vert.z);

      const norm = binormal.clone().multiplyScalar(cosU).addScaledVector(normal, sinU).normalize();
      normals.push(norm.x, norm.y, norm.z);

      uvs.push(t, j / crossSegments);
    }
  }

  const rowSize = crossSegments + 1;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < crossSegments; j++) {
      const a = i * rowSize + j;
      const b = (i + 1) * rowSize + j;
      const c = (i + 1) * rowSize + (j + 1);
      const d = i * rowSize + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the streamlined aerodynamic fuselage and head of the swift.
 */
function createSwiftBodyGeometry(): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const segments = 24;

  // Head at t=1, tail root at t=0
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Curved spine: slight arc
    const x = Math.sin(t * Math.PI) * 0.08;
    const y = (t - 0.45) * 1.55;
    const z = Math.cos(t * Math.PI) * 0.12;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const geom = new THREE.TubeGeometry(curve, 32, 0.18, 12, false);

  // Deform tube to aerodynamic oval section
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // Taper head and tail
    const normY = (y + 0.8) / 1.6;
    const scale = Math.sin(Math.max(0, Math.min(1, normY)) * Math.PI) * 0.85 + 0.15;
    pos.setX(i, pos.getX(i) * scale * 1.25);
    pos.setZ(i, pos.getZ(i) * scale * 0.8);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates the split/forked tail of the swift.
 */
function createForkedTailGeometry(): THREE.BufferGeometry {
  // Left fork
  const leftPoints = [
    new THREE.Vector3(-0.06, -0.65, 0.0),
    new THREE.Vector3(-0.16, -1.05, -0.08),
    new THREE.Vector3(-0.28, -1.45, -0.15),
  ];
  const rightPoints = [
    new THREE.Vector3(0.06, -0.65, 0.0),
    new THREE.Vector3(0.18, -1.10, -0.10),
    new THREE.Vector3(0.32, -1.50, -0.18),
  ];

  const leftGeom = createSickleWingGeometry(leftPoints[0], leftPoints[1], leftPoints[2], 0.22, 0.12, 0.03, 0.05, 20, 6);
  const rightGeom = createSickleWingGeometry(rightPoints[0], rightPoints[1], rightPoints[2], 0.22, 0.12, 0.03, 0.05, 20, 6);

  // Merge geometries
  const leftPos = leftGeom.attributes.position.array;
  const rightPos = rightGeom.attributes.position.array;
  const mergedPos = new Float32Array(leftPos.length + rightPos.length);
  mergedPos.set(leftPos, 0);
  mergedPos.set(rightPos, leftPos.length);

  const leftNorm = leftGeom.attributes.normal.array;
  const rightNorm = rightGeom.attributes.normal.array;
  const mergedNorm = new Float32Array(leftNorm.length + rightNorm.length);
  mergedNorm.set(leftNorm, 0);
  mergedNorm.set(rightNorm, leftNorm.length);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  geom.computeVertexNormals();

  return geom;
}

/**
 * Builds the full procedural 3D swift mesh components.
 * Large scale placed on right side of viewport ($X \approx +0.85, Y \approx +0.32$).
 */
export function generateBirdGeometries(): {
  body: THREE.BufferGeometry;
  upperWing: THREE.BufferGeometry;
  lowerWing: THREE.BufferGeometry;
  tail: THREE.BufferGeometry;
} {
  const center = new THREE.Vector3(0.85, 0.32, -0.10);

  // 1. Body & Head
  const body = createSwiftBodyGeometry();
  body.translate(center.x, center.y, center.z);

  // 2. Upper Wing (Sweeping upward, outward, and back)
  const upperRoot = new THREE.Vector3(0.12, 0.22, 0.05).add(center);
  const upperMid = new THREE.Vector3(1.15, 1.05, -0.15).add(center);
  const upperTip = new THREE.Vector3(2.15, 1.75, -0.38).add(center);
  const upperWing = createSickleWingGeometry(upperRoot, upperMid, upperTip, 0.72, 0.42, 0.05, 0.35, 45, 8);

  // 3. Lower Wing (Dynamic 3/4 turn: downward, outward, slightly forward)
  const lowerRoot = new THREE.Vector3(-0.12, 0.10, 0.02).add(center);
  const lowerMid = new THREE.Vector3(-0.65, -0.45, 0.18).add(center);
  const lowerTip = new THREE.Vector3(-1.25, -0.92, 0.32).add(center);
  const lowerWing = createSickleWingGeometry(lowerRoot, lowerMid, lowerTip, 0.65, 0.36, 0.04, -0.28, 45, 8);

  // 4. Forked Tail
  const tail = createForkedTailGeometry();
  tail.translate(center.x, center.y, center.z);

  return { body, upperWing, lowerWing, tail };
}

function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Samples deterministic particles across the swift with variable density:
 * - Leading edges: dense
 * - Body: dense
 * - Head: moderately dense
 * - Wing interior: medium density
 * - Trailing edges: lighter, fragmented
 * - Tail: precise split tips
 */
export function sampleBirdParticles(totalCount: number): BirdSampledParticle[] {
  const { body, upperWing, lowerWing, tail } = generateBirdGeometries();
  const rand = createPRNG(78912345);

  const particles: BirdSampledParticle[] = [];

  // Distribution weights:
  // Upper wing: 42% of particles
  // Lower wing: 34% of particles
  // Body & Head: 16% of particles
  // Forked Tail: 8% of particles
  const countUpper = Math.floor(totalCount * 0.42);
  const countLower = Math.floor(totalCount * 0.34);
  const countBody = Math.floor(totalCount * 0.16);
  const countTail = totalCount - countUpper - countLower - countBody;

  const colIvory = new THREE.Color(HERO_COLORS.IVORY_SILVER);
  const colGraphite = new THREE.Color(HERO_COLORS.GRAPHITE_DARK);
  const colLime = new THREE.Color(HERO_COLORS.SIGNAL_LIME);

  function sampleComponent(
    geom: THREE.BufferGeometry,
    count: number,
    zoneId: number
  ) {
    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const index = geom.index;

    const numTriangles = index ? index.count / 3 : posAttr.count / 3;

    for (let i = 0; i < count; i++) {
      let v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
      let n0 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3();

      if (index) {
        const tri = Math.floor(rand() * numTriangles);
        const i0 = index.getX(tri * 3 + 0);
        const i1 = index.getX(tri * 3 + 1);
        const i2 = index.getX(tri * 3 + 2);

        v0.fromBufferAttribute(posAttr, i0);
        v1.fromBufferAttribute(posAttr, i1);
        v2.fromBufferAttribute(posAttr, i2);

        n0.fromBufferAttribute(normAttr, i0);
        n1.fromBufferAttribute(normAttr, i1);
        n2.fromBufferAttribute(normAttr, i2);
      } else {
        const idx = Math.floor(rand() * (posAttr.count - 2));
        v0.fromBufferAttribute(posAttr, idx);
        v1.fromBufferAttribute(posAttr, idx + 1);
        v2.fromBufferAttribute(posAttr, idx + 2);

        n0.fromBufferAttribute(normAttr, idx);
        n1.fromBufferAttribute(normAttr, idx + 1);
        n2.fromBufferAttribute(normAttr, idx + 2);
      }

      // Barycentric coordinates
      let r1 = rand();
      let r2 = rand();
      if (r1 + r2 > 1) {
        r1 = 1 - r1;
        r2 = 1 - r2;
      }
      const r0 = 1 - r1 - r2;

      const targetPos = new THREE.Vector3()
        .addScaledVector(v0, r0)
        .addScaledVector(v1, r1)
        .addScaledVector(v2, r2);

      const normal = new THREE.Vector3()
        .addScaledVector(n0, r0)
        .addScaledVector(n1, r1)
        .addScaledVector(n2, r2)
        .normalize();

      // Sparse field starting point for Act 1 (dispersed in aerodynamic swirl)
      const sparseTheta = rand() * Math.PI * 2;
      const sparseRad = 1.4 + rand() * 2.8;
      const sparseHeight = (rand() - 0.5) * 4.0;
      const initialPos = new THREE.Vector3(
        targetPos.x + Math.cos(sparseTheta) * sparseRad,
        targetPos.y + sparseHeight,
        targetPos.z + Math.sin(sparseTheta) * (sparseRad * 0.6)
      );

      // Act 2 & 3 flow formation order:
      // Wing tips & leading edges form first (0.0 -> 0.3)
      // Head & body form next (0.3 -> 0.6)
      // Tail forms next (0.6 -> 0.8)
      // Wing interior fills in last (0.8 -> 1.0)
      let flowOrder = 0.5;
      if (zoneId === 1 || zoneId === 2) {
        // Wings: tips and leading edge first
        const distFromCenter = targetPos.distanceTo(new THREE.Vector3(0.85, 0.32, -0.10));
        flowOrder = Math.max(0, Math.min(1, 1.0 - (distFromCenter / 2.6) * 0.75 + (rand() - 0.5) * 0.2));
      } else if (zoneId === 0) {
        // Body
        flowOrder = 0.35 + rand() * 0.25;
      } else {
        // Tail
        flowOrder = 0.65 + rand() * 0.25;
      }

      // Normalized spine progress for lime signal pulse (0 = tail, 0.4 = body, 1.0 = wingtips)
      let spineProg = 0.5;
      if (zoneId === 3) {
        spineProg = 0.0 + (targetPos.y + 1.5) * 0.3;
      } else if (zoneId === 0) {
        spineProg = 0.3 + ((targetPos.y - 0.32) + 0.8) * 0.25;
      } else {
        const wingDist = targetPos.distanceTo(new THREE.Vector3(0.85, 0.32, -0.10));
        spineProg = 0.5 + Math.min(0.5, (wingDist / 2.6) * 0.5);
      }
      spineProg = Math.max(0, Math.min(1, spineProg));

      // Color assignment:
      // ~81% pale ivory/cool silver
      // ~14% dark graphite ghost particles
      // ~5% acid lime particles
      const roll = rand();
      let color: THREE.Color;
      if (roll < 0.05) {
        color = colLime.clone();
      } else if (roll < 0.19) {
        color = colGraphite.clone();
        color.offsetHSL(0, 0, (rand() - 0.5) * 0.04);
      } else {
        color = colIvory.clone();
        color.offsetHSL(0, 0, (rand() - 0.5) * 0.05);
      }

      // Small refined footprint (1px to 2px, highlights 2.5px)
      const size = roll < 0.05 ? 2.2 : 1.1 + rand() * 0.9;

      particles.push({
        targetPos,
        initialPos,
        normal,
        color,
        size,
        flowOrder,
        spineProg,
        zoneId,
      });
    }
  }

  sampleComponent(upperWing, countUpper, 1);
  sampleComponent(lowerWing, countLower, 2);
  sampleComponent(body, countBody, 0);
  sampleComponent(tail, countTail, 3);

  return particles;
}
