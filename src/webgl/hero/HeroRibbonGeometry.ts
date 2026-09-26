import * as THREE from 'three';
import { HERO_COLORS } from './heroConfig';

export interface SampledPoint {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  color: THREE.Color;
  size: number;
  ribbonId: number; // 0 = Ribbon A, 1 = Ribbon B, 2 = Ribbon C
}

/**
 * Sweeps an aerodynamic, twisted ribbon along a Catmull-Rom 3D spline curve.
 * Generates a smooth, beveled 3D ribbon geometry with tapered ends.
 */
function createSweptRibbonGeometry(
  points: THREE.Vector3[],
  baseWidth: number,
  baseThickness: number,
  twistTurns: number,
  steps: number = 80,
  crossSegments: number = 8
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const frames = curve.computeFrenetFrames(steps, false);

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = curve.getPointAt(t);
    const tangent = frames.tangents[i];
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    // Aerodynamic width taper: smooth sin curve with wider middle crest
    const widthTaper = Math.sin(t * Math.PI) * 0.85 + 0.15;
    const width = baseWidth * widthTaper;
    const thickness = baseThickness * widthTaper;

    // Twist rotation angle along spline
    const twistAngle = t * Math.PI * 2 * twistTurns;
    const cosT = Math.cos(twistAngle);
    const sinT = Math.sin(twistAngle);

    // Twisted local frame
    const ribbonNormal = new THREE.Vector3()
      .copy(normal)
      .multiplyScalar(cosT)
      .addScaledVector(binormal, sinT)
      .normalize();

    const ribbonBinormal = new THREE.Vector3().crossVectors(tangent, ribbonNormal).normalize();

    // Cross-section: closed ellipse / rounded aerofoil strip
    for (let j = 0; j <= crossSegments; j++) {
      const u = (j / crossSegments) * Math.PI * 2;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      const offsetX = ribbonBinormal.clone().multiplyScalar(cosU * (width * 0.5));
      const offsetY = ribbonNormal.clone().multiplyScalar(sinU * (thickness * 0.5));

      const vert = pt.clone().add(offsetX).add(offsetY);
      vertices.push(vert.x, vert.y, vert.z);

      const norm = ribbonBinormal.clone().multiplyScalar(cosU).addScaledVector(ribbonNormal, sinU).normalize();
      normals.push(norm.x, norm.y, norm.z);

      uvs.push(t, j / crossSegments);
    }
  }

  // Construct triangle indices
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

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Builds the 3 procedural ribbon geometries that form the unified sculpture.
 * Positioned on the right side (centroid around X: +0.85, Y: +0.35, Z: -0.10).
 */
export function generateSculptureGeometries(): {
  ribbonA: THREE.BufferGeometry;
  ribbonB: THREE.BufferGeometry;
  ribbonC: THREE.BufferGeometry;
} {
  // Asymmetric cluster offset: strictly right of centre, above vertical centre
  const offset = new THREE.Vector3(0.85, 0.35, -0.05);

  // 1. RIBBON A: Longest dark graphite aerofoil ribbon (Diagonal lower-left -> upper-right)
  const pointsA = [
    new THREE.Vector3(-0.85, -1.25, -0.15).add(offset),
    new THREE.Vector3(-0.35, -0.65, 0.15).add(offset),
    new THREE.Vector3(0.15, 0.05, 0.28).add(offset),
    new THREE.Vector3(0.65, 0.75, 0.12).add(offset),
    new THREE.Vector3(1.15, 1.35, -0.25).add(offset),
  ];
  const ribbonA = createSweptRibbonGeometry(pointsA, 0.78, 0.16, 0.85, 90, 8);

  // 2. RIBBON B: Secondary off-white ribbon weaving behind and framing the negative void
  const pointsB = [
    new THREE.Vector3(-0.45, 1.05, -0.32).add(offset),
    new THREE.Vector3(0.05, 0.55, -0.12).add(offset),
    new THREE.Vector3(0.48, -0.05, 0.18).add(offset),
    new THREE.Vector3(0.22, -0.68, 0.05).add(offset),
    new THREE.Vector3(-0.25, -1.05, -0.22).add(offset),
  ];
  const ribbonB = createSweptRibbonGeometry(pointsB, 0.54, 0.12, -0.65, 75, 8);

  // 3. RIBBON C: Accent acid lime ribbon weaving through the core vortex (~5% presence)
  const pointsC = [
    new THREE.Vector3(-0.15, -0.22, 0.22).add(offset),
    new THREE.Vector3(0.18, 0.12, 0.32).add(offset),
    new THREE.Vector3(0.42, 0.02, 0.08).add(offset),
    new THREE.Vector3(0.16, -0.28, -0.14).add(offset),
    new THREE.Vector3(-0.12, -0.18, 0.12).add(offset),
  ];
  const ribbonC = createSweptRibbonGeometry(pointsC, 0.22, 0.07, 1.1, 55, 6);

  return { ribbonA, ribbonB, ribbonC };
}

/**
 * Deterministic PRNG
 */
function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Samples N deterministic particles across Ribbon A (72%), Ribbon B (23%), and Ribbon C (5%).
 */
export function sampleSculptureParticles(totalCount: number): SampledPoint[] {
  const { ribbonA, ribbonB, ribbonC } = generateSculptureGeometries();
  const rand = createPRNG(424242);

  const countA = Math.floor(totalCount * 0.72);
  const countB = Math.floor(totalCount * 0.23);
  const countC = totalCount - countA - countB; // Remaining ~5%

  const points: SampledPoint[] = [];

  const colGraphite = new THREE.Color(HERO_COLORS.GRAPHITE_DARK);
  const colOffwhite = new THREE.Color(HERO_COLORS.OFFWHITE_SATIN);
  const colLime = new THREE.Color(HERO_COLORS.SIGNAL_LIME);

  function sampleGeometry(
    geom: THREE.BufferGeometry,
    count: number,
    baseColor: THREE.Color,
    ribbonId: number
  ) {
    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const index = geom.index;

    if (!posAttr || !index) return;

    const numTriangles = index.count / 3;

    for (let i = 0; i < count; i++) {
      const triIdx = Math.floor(rand() * numTriangles);
      const i0 = index.getX(triIdx * 3 + 0);
      const i1 = index.getX(triIdx * 3 + 1);
      const i2 = index.getX(triIdx * 3 + 2);

      const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, i0);
      const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i1);
      const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i2);

      const n0 = new THREE.Vector3().fromBufferAttribute(normAttr, i0);
      const n1 = new THREE.Vector3().fromBufferAttribute(normAttr, i1);
      const n2 = new THREE.Vector3().fromBufferAttribute(normAttr, i2);

      // Uniform barycentric coordinates
      let r1 = rand();
      let r2 = rand();
      if (r1 + r2 > 1) {
        r1 = 1 - r1;
        r2 = 1 - r2;
      }
      const r0 = 1 - r1 - r2;

      const pos = new THREE.Vector3()
        .addScaledVector(v0, r0)
        .addScaledVector(v1, r1)
        .addScaledVector(v2, r2);

      const norm = new THREE.Vector3()
        .addScaledVector(n0, r0)
        .addScaledVector(n1, r1)
        .addScaledVector(n2, r2)
        .normalize();

      // Subtle surface skin offset along normal (keeps particles airy, not flat)
      const skinOffset = (rand() - 0.5) * 0.04;
      pos.addScaledVector(norm, skinOffset);

      // Color variation: subtle tonal nuances within the disciplined palette
      const c = baseColor.clone();
      if (ribbonId === 0) {
        // Graphite with subtle metallic highlight variations
        c.offsetHSL(0, 0, (rand() - 0.5) * 0.06);
      } else if (ribbonId === 1) {
        // Off-white with silver-grey shifts
        c.offsetHSL(0, 0, (rand() - 0.5) * 0.08);
      }

      // Small elegant scale: 1.0 to 2.2px footprint
      const size = 1.0 + rand() * 1.2;

      points.push({
        position: pos,
        normal: norm,
        color: c,
        size,
        ribbonId,
      });
    }
  }

  sampleGeometry(ribbonA, countA, colGraphite, 0);
  sampleGeometry(ribbonB, countB, colOffwhite, 1);
  sampleGeometry(ribbonC, countC, colLime, 2);

  return points;
}
