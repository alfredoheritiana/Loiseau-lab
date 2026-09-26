import * as THREE from 'three';
import { HERO_COLORS } from './heroConfig';

export interface BirdSampledParticle {
  targetPos: THREE.Vector3;  // Target coordinate in stabilized bird shape
  initialPos: THREE.Vector3; // Sparse field position for Act 1
  normal: THREE.Vector3;
  color: THREE.Color;
  size: number;
  flowOrder: number;         // 0.0 -> 1.0: order of formation
  zoneId: number;            // 0: body/head, 1: upper wing, 2: lower wing, 3: tail
  spanNorm: number;          // 0.0 (root) -> 1.0 (tip)
  chordNorm: number;         // 0.0 (leading edge) -> 1.0 (trailing edge)
  edgeType: number;          // 0: leading edge, 1: interior, 2: trailing edge, 3: needle tip
  spineProg: number;         // 0.0 (tail) -> 1.0 (wingtips) for lime signal pulse
}

/**
 * Builds a natural, curved sickle wing surface between two intentional 3D guide curves:
 * leadingEdgeCurve and trailingEdgeCurve.
 */
function createCurvedSickleWing(
  leadPoints: THREE.Vector3[],
  trailPoints: THREE.Vector3[],
  camberHeight: number,
  spanSteps: number = 48,
  chordSteps: number = 10
): THREE.BufferGeometry {
  const leadCurve = new THREE.CatmullRomCurve3(leadPoints, false, 'centripetal', 0.5);
  const trailCurve = new THREE.CatmullRomCurve3(trailPoints, false, 'centripetal', 0.5);

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= spanSteps; i++) {
    const u = i / spanSteps; // span: 0 (root) to 1 (tip)
    const pLead = leadCurve.getPointAt(u);
    const pTrail = trailCurve.getPointAt(u);

    // Tangent along leading edge for calculating camber normal
    const tangent = leadCurve.getTangentAt(u);
    const chordVec = new THREE.Vector3().subVectors(pTrail, pLead);
    const wingNormal = new THREE.Vector3().crossVectors(tangent, chordVec).normalize();

    // Camber profile: parabolic arch peak at 30% chord, fading to 0 at tip
    const spanCamber = Math.sin((1.0 - u * 0.85) * Math.PI * 0.5) * camberHeight;

    for (let j = 0; j <= chordSteps; j++) {
      const v = j / chordSteps; // chord: 0 (lead) to 1 (trail)

      // Base interpolation between lead and trail curves
      const pt = new THREE.Vector3().lerpVectors(pLead, pTrail, v);

      // Add aerodynamic camber arch
      const camberArch = Math.sin(v * Math.PI) * spanCamber;
      pt.addScaledVector(wingNormal, camberArch);

      vertices.push(pt.x, pt.y, pt.z);

      // Normal vector approximation
      const n = wingNormal.clone();
      if (v < 0.2) {
        n.addScaledVector(chordVec.clone().normalize(), -0.4).normalize();
      } else if (v > 0.8) {
        n.addScaledVector(chordVec.clone().normalize(), 0.3).normalize();
      }
      normals.push(n.x, n.y, n.z);

      uvs.push(u, v);
    }
  }

  const rowSize = chordSteps + 1;
  for (let i = 0; i < spanSteps; i++) {
    for (let j = 0; j < chordSteps; j++) {
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
 * Creates the organic, continuous aerodynamic fuselage:
 * Head -> Neck transition -> Thorax (with seamless wing root shoulders) -> Tapered body -> Tail root.
 */
function createOrganicSwiftFuselage(): THREE.BufferGeometry {
  const steps = 36;
  const radialSegments = 16;

  // S-curved aerodynamic central spine
  // t=0: tail root, t=0.5: thorax/wing root, t=0.82: neck, t=1.0: head
  const spinePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = (t - 0.42) * 1.65; // from y=-0.70 to y=+0.95
    const x = Math.sin(t * Math.PI) * 0.12 - (t - 0.5) * 0.08;
    const z = Math.cos(t * Math.PI * 0.9) * 0.14 - 0.04;
    spinePoints.push(new THREE.Vector3(x, y, z));
  }
  const spineCurve = new THREE.CatmullRomCurve3(spinePoints, false, 'centripetal', 0.5);
  const frames = spineCurve.computeFrenetFrames(steps, false);

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = spineCurve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    // Anatomical width & depth profile of a swift:
    // Tail root (t=0..0.25): thin oval
    // Thorax (t=0.35..0.65): wide shoulders where wings connect seamlessly
    // Neck (t=0.7..0.82): tapered transition
    // Head (t=0.85..1.0): rounded aerodynamic dome
    let rx = 0.08;
    let rz = 0.06;

    if (t < 0.3) {
      // Tail root
      const subT = t / 0.3;
      rx = 0.06 + subT * 0.12;
      rz = 0.04 + subT * 0.08;
    } else if (t <= 0.7) {
      // Thorax / Wing shoulders (widest point)
      const subT = (t - 0.3) / 0.4;
      const bulge = Math.sin(subT * Math.PI);
      rx = 0.18 + bulge * 0.10; // widest laterally for wing roots
      rz = 0.12 + bulge * 0.06;
    } else if (t <= 0.85) {
      // Neck
      const subT = (t - 0.7) / 0.15;
      rx = 0.20 - subT * 0.08;
      rz = 0.14 - subT * 0.05;
    } else {
      // Head
      const subT = (t - 0.85) / 0.15;
      const dome = Math.sin((1.0 - subT) * Math.PI * 0.5);
      rx = 0.12 * dome;
      rz = 0.09 * dome;
    }

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const offset = binormal.clone().multiplyScalar(cosT * rx).addScaledVector(normal, sinT * rz);
      const v = pt.clone().add(offset);
      vertices.push(v.x, v.y, v.z);

      const n = offset.clone().normalize();
      normals.push(n.x, n.y, n.z);

      uvs.push(t, j / radialSegments);
    }
  }

  const rowSize = radialSegments + 1;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < radialSegments; j++) {
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
 * Creates the narrow, tapering split/forked tail of the swift:
 * Continuous tail root dividing into two distinct prongs.
 */
function createOrganicForkedTail(): THREE.BufferGeometry {
  // Left Fork
  const leadLeft = [
    new THREE.Vector3(-0.06, -0.68, 0.02),
    new THREE.Vector3(-0.14, -0.98, -0.06),
    new THREE.Vector3(-0.25, -1.35, -0.14),
  ];
  const trailLeft = [
    new THREE.Vector3(-0.01, -0.68, 0.01),
    new THREE.Vector3(-0.04, -0.92, -0.04),
    new THREE.Vector3(-0.22, -1.32, -0.13),
  ];
  const leftFork = createCurvedSickleWing(leadLeft, trailLeft, 0.03, 16, 4);

  // Right Fork
  const leadRight = [
    new THREE.Vector3(0.06, -0.68, 0.02),
    new THREE.Vector3(0.16, -1.02, -0.08),
    new THREE.Vector3(0.28, -1.40, -0.16),
  ];
  const trailRight = [
    new THREE.Vector3(0.01, -0.68, 0.01),
    new THREE.Vector3(0.05, -0.95, -0.05),
    new THREE.Vector3(0.25, -1.37, -0.15),
  ];
  const rightFork = createCurvedSickleWing(leadRight, trailRight, 0.03, 16, 4);

  // Merge forks
  const lPos = leftFork.attributes.position.array;
  const rPos = rightFork.attributes.position.array;
  const mergedPos = new Float32Array(lPos.length + rPos.length);
  mergedPos.set(lPos, 0);
  mergedPos.set(rPos, lPos.length);

  const lNorm = leftFork.attributes.normal.array;
  const rNorm = rightFork.attributes.normal.array;
  const mergedNorm = new Float32Array(lNorm.length + rNorm.length);
  mergedNorm.set(lNorm, 0);
  mergedNorm.set(rNorm, lNorm.length);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  geom.computeVertexNormals();

  return geom;
}

/**
 * Builds the complete 3D swift anatomy positioned dynamically on the right:
 * Centroid around $X \approx +0.85, Y \approx +0.32$.
 */
export function generateBirdGeometries(): {
  fuselage: THREE.BufferGeometry;
  upperWing: THREE.BufferGeometry;
  lowerWing: THREE.BufferGeometry;
  tail: THREE.BufferGeometry;
} {
  const center = new THREE.Vector3(0.85, 0.32, -0.08);

  // 1. Organic Fuselage (Head, Neck, Thorax, Body)
  const fuselage = createOrganicSwiftFuselage();
  fuselage.translate(center.x, center.y, center.z);

  // 2. Upper / Right Wing: Large rising sickle curve
  // Connected seamlessly to thorax shoulder at (center + [0.18, 0.28, 0.04])
  const upperLead = [
    new THREE.Vector3(0.18, 0.28, 0.04).add(center),
    new THREE.Vector3(0.68, 0.72, -0.02).add(center),
    new THREE.Vector3(1.35, 1.28, -0.15).add(center),
    new THREE.Vector3(2.05, 1.72, -0.32).add(center),
    new THREE.Vector3(2.55, 1.98, -0.45).add(center), // needle tip
  ];
  const upperTrail = [
    new THREE.Vector3(0.12, 0.02, 0.02).add(center), // wing root trailing edge at thorax
    new THREE.Vector3(0.52, 0.45, -0.04).add(center),
    new THREE.Vector3(1.15, 0.95, -0.18).add(center),
    new THREE.Vector3(1.92, 1.55, -0.34).add(center),
    new THREE.Vector3(2.52, 1.95, -0.44).add(center), // joins needle tip
  ];
  const upperWing = createCurvedSickleWing(upperLead, upperTrail, 0.16, 52, 10);

  // 3. Lower / Left Wing: Foreshortened 3/4 turn sickle curve
  // Connected seamlessly to port shoulder at (center + [-0.18, 0.22, 0.02])
  const lowerLead = [
    new THREE.Vector3(-0.18, 0.22, 0.02).add(center),
    new THREE.Vector3(-0.52, -0.08, 0.12).add(center),
    new THREE.Vector3(-0.95, -0.45, 0.24).add(center),
    new THREE.Vector3(-1.42, -0.85, 0.35).add(center), // needle tip
  ];
  const lowerTrail = [
    new THREE.Vector3(-0.12, -0.04, 0.01).add(center), // port wing root trailing edge
    new THREE.Vector3(-0.40, -0.28, 0.10).add(center),
    new THREE.Vector3(-0.78, -0.62, 0.22).add(center),
    new THREE.Vector3(-1.38, -0.82, 0.34).add(center), // joins needle tip
  ];
  const lowerWing = createCurvedSickleWing(lowerLead, lowerTrail, -0.14, 44, 10);

  // 4. Forked Tail: Continuous with tail root
  const tail = createOrganicForkedTail();
  tail.translate(center.x, center.y, center.z);

  return { fuselage, upperWing, lowerWing, tail };
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
 * Samples deterministic particles across the swift with the required density hierarchy:
 * - Densest along head and body (3.0x)
 * - Dense along wing roots and leading edges (2.5x)
 * - Medium through wing interiors (1.0x)
 * - Lighter along trailing edges (0.6x)
 * - Precise accents at wing tips
 * - Cleanly separated tail forks
 */
export function sampleBirdParticles(totalCount: number): BirdSampledParticle[] {
  const { fuselage, upperWing, lowerWing, tail } = generateBirdGeometries();
  const rand = createPRNG(987654321);

  const particles: BirdSampledParticle[] = [];

  // Distribution counts:
  // Upper Wing: 45% of particles
  // Lower Wing: 30% of particles
  // Fuselage (Body + Head): 18% of particles
  // Forked Tail: 7% of particles
  const countUpper = Math.floor(totalCount * 0.45);
  const countLower = Math.floor(totalCount * 0.30);
  const countFuselage = Math.floor(totalCount * 0.18);
  const countTail = totalCount - countUpper - countLower - countFuselage;

  const colIvory = new THREE.Color(HERO_COLORS.IVORY_SILVER);
  const colGraphite = new THREE.Color(HERO_COLORS.GRAPHITE_DARK);
  const colLime = new THREE.Color(HERO_COLORS.SIGNAL_LIME);

  function sampleComponent(
    geom: THREE.BufferGeometry,
    count: number,
    zoneId: number
  ) {
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geom.getAttribute('normal') as THREE.BufferAttribute;
    const uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const index = geom.index;

    const numTriangles = index ? index.count / 3 : posAttr.count / 3;

    for (let i = 0; i < count; i++) {
      let v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
      let n0 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3();
      let uv0 = new THREE.Vector2(), uv1 = new THREE.Vector2(), uv2 = new THREE.Vector2();

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

        if (uvAttr) {
          uv0.fromBufferAttribute(uvAttr, i0);
          uv1.fromBufferAttribute(uvAttr, i1);
          uv2.fromBufferAttribute(uvAttr, i2);
        }
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

      // UV coordinates (span and chord)
      const uv = new THREE.Vector2()
        .addScaledVector(uv0, r0)
        .addScaledVector(uv1, r1)
        .addScaledVector(uv2, r2);

      const spanNorm = Math.max(0, Math.min(1, uv.x));
      const chordNorm = Math.max(0, Math.min(1, uv.y));

      // Edge type classification:
      // 0: leading edge (chord < 0.18)
      // 1: interior (0.18 <= chord <= 0.78)
      // 2: trailing edge (chord > 0.78)
      // 3: wing needle tip (span > 0.90)
      let edgeType = 1;
      if (zoneId === 1 || zoneId === 2) {
        if (spanNorm > 0.90) {
          edgeType = 3;
        } else if (chordNorm < 0.18) {
          edgeType = 0;
        } else if (chordNorm > 0.78) {
          edgeType = 2;
        }
      } else if (zoneId === 0) {
        // Fuselage
        edgeType = 0; // treated as primary anatomical anchor
      } else {
        // Tail
        edgeType = 2;
      }

      // Sparse field starting coordinate for Act 1:
      // Dispersed in an aerodynamic vortex around the scene
      const theta = rand() * Math.PI * 2;
      const rad = 1.6 + rand() * 2.8;
      const height = (rand() - 0.5) * 4.2;
      const initialPos = new THREE.Vector3(
        targetPos.x + Math.cos(theta) * rad,
        targetPos.y + height,
        targetPos.z + Math.sin(theta) * (rad * 0.7)
      );

      // Formation sequence ordering (0.0 to 1.0):
      // Wing tips & leading edges arrive first (0.0 -> 0.3)
      // Body and head resolve next (0.3 -> 0.6)
      // Forked tail resolves next (0.6 -> 0.8)
      // Wing interior fills in last (0.8 -> 1.0)
      let flowOrder = 0.5;
      if (edgeType === 3 || edgeType === 0) {
        // Tips and leading edge
        flowOrder = 0.05 + rand() * 0.25;
      } else if (zoneId === 0) {
        // Body / Head
        flowOrder = 0.32 + rand() * 0.28;
      } else if (zoneId === 3) {
        // Tail
        flowOrder = 0.62 + rand() * 0.20;
      } else {
        // Wing interior and trailing edge
        flowOrder = 0.78 + rand() * 0.22;
      }

      // Normalized spine progress for lime signal pulse (0 = tail, 0.4 = body, 1.0 = wingtips)
      let spineProg = 0.5;
      if (zoneId === 3) {
        spineProg = 0.0 + (targetPos.y + 1.5) * 0.3;
      } else if (zoneId === 0) {
        spineProg = 0.3 + ((targetPos.y - 0.32) + 0.8) * 0.25;
      } else {
        const wingDist = targetPos.distanceTo(new THREE.Vector3(0.85, 0.32, -0.08));
        spineProg = 0.5 + Math.min(0.5, (wingDist / 2.6) * 0.5);
      }
      spineProg = Math.max(0, Math.min(1, spineProg));

      // Color assignment:
      // ~81% pale ivory / cool silver
      // ~14% dark graphite ghost particles
      // ~5% acid lime signal particles
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

      // Particle scale: refined footprint (1.0px to 2.2px, highlights 2.5px)
      const size = roll < 0.05 ? 2.4 : 1.1 + rand() * 0.9;

      particles.push({
        targetPos,
        initialPos,
        normal,
        color,
        size,
        flowOrder,
        zoneId,
        spanNorm,
        chordNorm,
        edgeType,
        spineProg,
      });
    }
  }

  sampleComponent(upperWing, countUpper, 1);
  sampleComponent(lowerWing, countLower, 2);
  sampleComponent(fuselage, countFuselage, 0);
  sampleComponent(tail, countTail, 3);

  return particles;
}
