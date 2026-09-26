import React, { useRef, useMemo, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { useExperience } from '../../context/ExperienceContext';
import { sampleBirdParticles, BirdSampledParticle } from './HeroBirdGeometry';
import { HERO_TIERS } from './heroConfig';

interface HeroParticleBirdProps {
  onReady?: () => void;
  scrollProgress?: number;
}

const velocityShader = `
  uniform float uTime;
  uniform float uDelta;
  uniform float uFormationTime;
  uniform float uLivingTime;
  uniform float uScrollProgress;
  uniform vec3 uPointer;
  uniform vec2 uPointerVel;
  uniform float uPointerSpeed;
  uniform float uPointerRadius;
  uniform float uReturnStrength;
  uniform float uDamping;
  uniform sampler2D uOriginTexture;
  uniform sampler2D uMetaTexture;

  // Trail history (wind wake memory)
  const int MAX_TRAIL = 8;
  uniform vec3 uTrailPos[MAX_TRAIL];
  uniform vec2 uTrailVel[MAX_TRAIL];
  uniform float uTrailAge[MAX_TRAIL];

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 posData = texture2D(texturePosition, uv);
    vec4 velData = texture2D(textureVelocity, uv);
    vec4 origData = texture2D(uOriginTexture, uv); // xyz: targetPos, w: flowOrder
    vec4 metaData = texture2D(uMetaTexture, uv);   // x: spanNorm, y: chordNorm, z: edgeType, w: zoneId

    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    vec3 targetPos = origData.xyz;
    float flowOrder = origData.w;

    float spanNorm = metaData.x;
    float chordNorm = metaData.y;
    float edgeType = metaData.z;
    float zoneId = metaData.w;

    // -------------------------------------------------------------
    // 1. PROGRESSIVE 8-STATE FORMATION (Strictly Monotonic, Never Resets)
    // Order: wing tips -> leading edges -> body/head -> tail -> wing interior
    // -------------------------------------------------------------
    float formProg = clamp((uFormationTime - 0.20 - flowOrder * 0.90) / 1.10, 0.0, 1.0);
    float smoothForm = smoothstep(0.0, 1.0, formProg);

    // Initial position in sparse vortex field
    float theta = uv.x * 6.28318;
    float rad = 1.8 + uv.y * 2.8;
    vec3 initialPos = vec3(
      targetPos.x + cos(theta) * rad,
      targetPos.y + (uv.y - 0.5) * 4.2,
      targetPos.z + sin(theta) * (rad * 0.7)
    );

    vec3 currentRestingPos = mix(initialPos, targetPos, smoothForm);

    // -------------------------------------------------------------
    // 2. PERMANENT MULTI-LAYERED LIVING MOTION (Active once formed)
    // -------------------------------------------------------------
    if (smoothForm > 0.82) {
      float t = uLivingTime;

      // A. Whole-Form Glide: Slow, irregular non-repeating trajectory
      float glideY = sin(t * 0.28) * 0.024 + sin(t * 0.17 + 1.2) * 0.018;
      float glideX = cos(t * 0.22) * 0.016 + sin(t * 0.14 + 0.8) * 0.012;
      float glideBank = sin(t * 0.25) * 0.014;

      currentRestingPos.y += glideY;
      currentRestingPos.x += glideX;
      // Banking rotation around spine
      currentRestingPos.z += (currentRestingPos.x - 0.85) * glideBank;

      // B. Wing Torsion & Independent Flex (Span-dependent)
      if (zoneId == 1.0) {
        // Upper Starboard Wing
        float torsion = sin(t * 0.85 + spanNorm * 1.5) * 0.052 * pow(spanNorm, 1.8);
        currentRestingPos.z += torsion;
        currentRestingPos.y += torsion * 0.4;
      } else if (zoneId == 2.0) {
        // Lower Port Wing (independent phase & amplitude)
        float torsion = sin(t * 0.72 + spanNorm * 1.5 + 1.4) * 0.038 * pow(spanNorm, 1.8);
        currentRestingPos.z += torsion;
        currentRestingPos.y += torsion * 0.35;
      }

      // C. Trailing-Edge Shimmer vs Leading-Edge Tension
      if (chordNorm > 0.75) {
        float shimmer = sin(t * 2.2 + pos.x * 2.8) * 0.024 * pow(chordNorm, 2.0);
        currentRestingPos.z += shimmer;
      }

      // D. Forked-Tail Steering
      if (zoneId == 3.0) {
        float tailFlex = sin(t * 0.65 + (pos.x > 0.85 ? 0.0 : 1.2)) * 0.032;
        currentRestingPos.x += tailFlex;
      }

      // E. Body / Thorax Aerodynamic Breathing
      if (zoneId == 0.0) {
        float pulse = sin(t * 1.1) * 0.008;
        currentRestingPos.x += (currentRestingPos.x - 0.85) * pulse * 2.0;
        currentRestingPos.z += pulse;
      }
    }

    // -------------------------------------------------------------
    // 3. SCROLL DISSOLVE & REVERSIBLE RECONSTRUCTION
    // -------------------------------------------------------------
    if (uScrollProgress > 0.30) {
      float dissolveThreshold = 0.30 + flowOrder * 0.50;
      if (uScrollProgress > dissolveThreshold) {
        float dissolveRatio = (uScrollProgress - dissolveThreshold) / 0.35;
        currentRestingPos.z -= dissolveRatio * 4.8;
        currentRestingPos.x += (fract(sin(uv.x * 43.12) * 123.4) - 0.5) * dissolveRatio * 3.2;
        currentRestingPos.y += sin(uTime * 2.2 + uv.y * 14.0) * dissolveRatio * 2.0;
      }
    }

    // -------------------------------------------------------------
    // 4. AERODYNAMIC SPRING RESTORING FORCE
    // -------------------------------------------------------------
    vec3 returnDir = currentRestingPos - pos;
    vec3 returnForce = returnDir * uReturnStrength;

    // -------------------------------------------------------------
    // 5. AIR / WIND CURSOR WAKE INTERACTION & TRAIL MEMORY
    // -------------------------------------------------------------
    vec3 windForce = vec3(0.0);

    // Active Pointer Wind Wake
    vec3 toPointer = pos - uPointer;
    float distSq = toPointer.x * toPointer.x + toPointer.y * toPointer.y + toPointer.z * toPointer.z * 1.8;
    float dist = sqrt(max(0.0001, distSq));

    if (dist < uPointerRadius) {
      float factor = 1.0 - smoothstep(0.0, uPointerRadius, dist);
      vec3 repelDir = normalize(toPointer);
      vec3 wakeDir = vec3(uPointerVel.x, uPointerVel.y, 0.0);
      float pushMagnitude = factor * (1.2 + uPointerSpeed * 1.2) * 6.2;
      windForce += (repelDir * 0.65 + wakeDir * 0.55) * pushMagnitude;
    }

    // Wind Wake Trail Memory (Propagating short-lived air wake)
    for (int i = 0; i < MAX_TRAIL; i++) {
      if (uTrailAge[i] > 0.0 && uTrailAge[i] < 0.65) {
        vec3 toTrail = pos - uTrailPos[i];
        float trailDist = length(toTrail);
        float trailRadius = uPointerRadius * 0.85;
        if (trailDist < trailRadius) {
          float decay = 1.0 - (uTrailAge[i] / 0.65);
          float trailFactor = (1.0 - smoothstep(0.0, trailRadius, trailDist)) * decay;
          vec3 trailWind = vec3(uTrailVel[i].x, uTrailVel[i].y, 0.0);
          windForce += trailWind * trailFactor * 3.5;
        }
      }
    }

    // -------------------------------------------------------------
    // 6. ACCUMULATE AND INTEGRATE (Viscous Damping for Graceful Return)
    // -------------------------------------------------------------
    vec3 accel = returnForce + windForce;
    vel = (vel + accel * uDelta) * uDamping;

    float phase = velData.w;
    gl_FragColor = vec4(vel, phase);
  }
`;

const positionShader = `
  uniform float uDelta;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 posData = texture2D(texturePosition, uv);
    vec4 velData = texture2D(textureVelocity, uv);

    vec3 pos = posData.xyz + velData.xyz * uDelta;
    gl_FragColor = vec4(pos, posData.w);
  }
`;

const renderVertexShader = `
  uniform sampler2D uPosTexture;
  uniform float uIsGpuActive;
  uniform float uTime;
  uniform float uLivingTime;
  uniform float uFormationTime;
  uniform vec3 uPointer;
  uniform float uPointerRadius;

  attribute vec2 aSimUv;
  attribute vec3 aTargetPos;
  attribute vec3 aInitialPos;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aFlowOrder;
  attribute float aSpineProg;
  attribute float aIsLime;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = aTargetPos;

    if (uIsGpuActive > 0.5) {
      vec4 simData = texture2D(uPosTexture, aSimUv);
      pos = simData.xyz;
    } else {
      // Fallback: smooth monotonic formation interpolation
      float formProg = clamp((uFormationTime - 0.20 - aFlowOrder * 0.90) / 1.10, 0.0, 1.0);
      pos = mix(aInitialPos, aTargetPos, smoothstep(0.0, 1.0, formProg));

      vec3 toPointer = pos - uPointer;
      float dist = length(toPointer);
      if (dist < uPointerRadius) {
        float factor = 1.0 - smoothstep(0.0, uPointerRadius, dist);
        pos += normalize(toPointer) * factor * 0.45;
      }
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Crisp perspective point size: strictly 1.0 to 2.5px maximum
    gl_PointSize = clamp(aSize * (24.0 / -mvPosition.z), 1.0, 2.6);

    // Rare Lime Signal Pulse: travels tail -> body -> wing -> tip every 5.2 seconds
    // Only affects rare lime particles (never recolors ordinary ivory particles)
    vec3 col = aColor;
    if (aIsLime > 0.5) {
      float cycleTime = mod(uLivingTime, 5.2);
      float pulseWindow = cycleTime / 3.0; // travels across 3.0s, rests for 2.2s
      float pulseDist = abs(aSpineProg - pulseWindow);
      float pulseGlow = smoothstep(0.14, 0.0, pulseDist);
      col = mix(col, vec3(0.81, 0.99, 0.09) * 1.25, pulseGlow * 0.85);
    }

    vColor = col;
    vAlpha = 0.88;
  }
`;

const renderFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Crisp circular point
    float alpha = smoothstep(0.5, 0.20, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const HeroParticleBird: React.FC<HeroParticleBirdProps> = ({
  onReady,
  scrollProgress = 0,
}) => {
  const { gl, camera } = useThree();
  const { inputsRef, qualityLevel, introPhase } = useExperience();

  const tierConfig = HERO_TIERS[qualityLevel] || HERO_TIERS.MEDIUM;
  const simSize = tierConfig.simSize;
  const totalCount = simSize * simSize;

  const pointsRef = useRef<THREE.Points>(null);
  const gpuComputeRef = useRef<GPUComputationRenderer | null>(null);
  const posVarRef = useRef<any>(null);
  const velVarRef = useRef<any>(null);
  const isGpuActiveRef = useRef<boolean>(false);

  // Store onReady in ref to decouple from GPU recreation
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Monotonic Formation & Living Timers (Strictly Persist Across Rerenders)
  const formationTimeRef = useRef(0);
  const formationCompletedRef = useRef(false);
  const livingTimeRef = useRef(0);

  // 1. Sample deterministic particles from the 3D swift
  const { particles } = useMemo(() => {
    const pts = sampleBirdParticles(totalCount);
    return { particles: pts };
  }, [totalCount]);

  // 2. Wind wake trail memory buffer (8 trail steps)
  const MAX_TRAIL = 8;
  const trailPositions = useMemo(() => Array.from({ length: MAX_TRAIL }, () => new THREE.Vector3(999, 999, 999)), []);
  const trailVelocities = useMemo(() => Array.from({ length: MAX_TRAIL }, () => new THREE.Vector2(0, 0)), []);
  const trailAges = useMemo(() => new Float32Array(MAX_TRAIL).fill(999), []);
  const lastPointer = useMemo(() => new THREE.Vector3(999, 999, 999), []);

  // 3. Initialize GPGPU Computation Renderer (Zero Callback Dependencies)
  useEffect(() => {
    try {
      const gpuCompute = new GPUComputationRenderer(simSize, simSize, gl);

      const dtPosition = gpuCompute.createTexture();
      const dtVelocity = gpuCompute.createTexture();
      const dtOrigin = gpuCompute.createTexture();
      const dtMeta = gpuCompute.createTexture();

      const posArray = dtPosition.image.data as Float32Array | null;
      const velArray = dtVelocity.image.data as Float32Array | null;
      const origArray = dtOrigin.image.data as Float32Array | null;
      const metaArray = dtMeta.image.data as Float32Array | null;

      if (!posArray || !velArray || !origArray || !metaArray) {
        return;
      }

      for (let i = 0; i < totalCount; i++) {
        const pt = particles[i];
        const idx = i * 4;

        // Position starts in sparse field for State 1
        posArray[idx + 0] = pt.initialPos.x;
        posArray[idx + 1] = pt.initialPos.y;
        posArray[idx + 2] = pt.initialPos.z;
        posArray[idx + 3] = pt.zoneId;

        velArray[idx + 0] = 0;
        velArray[idx + 1] = 0;
        velArray[idx + 2] = 0;
        velArray[idx + 3] = Math.random(); // Phase

        // Static Target & Order texture
        origArray[idx + 0] = pt.targetPos.x;
        origArray[idx + 1] = pt.targetPos.y;
        origArray[idx + 2] = pt.targetPos.z;
        origArray[idx + 3] = pt.flowOrder;

        // Static Metadata texture: x=spanNorm, y=chordNorm, z=edgeType, w=zoneId
        metaArray[idx + 0] = pt.spanNorm;
        metaArray[idx + 1] = pt.chordNorm;
        metaArray[idx + 2] = pt.edgeType;
        metaArray[idx + 3] = pt.zoneId;
      }

      const velVariable = gpuCompute.addVariable('textureVelocity', velocityShader, dtVelocity);
      const posVariable = gpuCompute.addVariable('texturePosition', positionShader, dtPosition);

      gpuCompute.setVariableDependencies(velVariable, [posVariable, velVariable]);
      gpuCompute.setVariableDependencies(posVariable, [posVariable, velVariable]);

      // Velocity uniforms
      velVariable.material.uniforms.uTime = { value: 0 };
      velVariable.material.uniforms.uDelta = { value: 0.016 };
      velVariable.material.uniforms.uFormationTime = { value: 0 };
      velVariable.material.uniforms.uLivingTime = { value: 0 };
      velVariable.material.uniforms.uScrollProgress = { value: 0 };
      velVariable.material.uniforms.uPointer = { value: new THREE.Vector3(999, 999, 999) };
      velVariable.material.uniforms.uPointerVel = { value: new THREE.Vector2(0, 0) };
      velVariable.material.uniforms.uPointerSpeed = { value: 0 };
      velVariable.material.uniforms.uPointerRadius = { value: 1.25 };
      velVariable.material.uniforms.uReturnStrength = { value: 4.8 };
      velVariable.material.uniforms.uDamping = { value: 0.88 };
      velVariable.material.uniforms.uOriginTexture = { value: dtOrigin };
      velVariable.material.uniforms.uMetaTexture = { value: dtMeta };

      velVariable.material.uniforms.uTrailPos = { value: trailPositions };
      velVariable.material.uniforms.uTrailVel = { value: trailVelocities };
      velVariable.material.uniforms.uTrailAge = { value: trailAges };

      posVariable.material.uniforms.uDelta = { value: 0.016 };

      const error = gpuCompute.init();
      if (error !== null) {
        console.warn('GPGPU initialization fallback:', error);
        isGpuActiveRef.current = false;
      } else {
        gpuComputeRef.current = gpuCompute;
        posVarRef.current = posVariable;
        velVarRef.current = velVariable;
        isGpuActiveRef.current = true;
      }
    } catch (err) {
      console.warn('GPGPU error:', err);
      isGpuActiveRef.current = false;
    }

    onReadyRef.current?.();

    return () => {
      gpuComputeRef.current = null;
      posVarRef.current = null;
      velVarRef.current = null;
    };
  }, [gl, simSize, totalCount, particles]);

  // 4. Render Geometry & Shader Buffers
  const { geometry, uniforms } = useMemo(() => {
    const geom = new THREE.BufferGeometry();

    const uvs = new Float32Array(totalCount * 2);
    const targetPositions = new Float32Array(totalCount * 3);
    const initialPositions = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);
    const flowOrders = new Float32Array(totalCount);
    const spineProgs = new Float32Array(totalCount);
    const isLimes = new Float32Array(totalCount);

    for (let i = 0; i < totalCount; i++) {
      const x = (i % simSize) / simSize;
      const y = Math.floor(i / simSize) / simSize;
      uvs[i * 2 + 0] = x;
      uvs[i * 2 + 1] = y;

      const pt = particles[i];
      targetPositions[i * 3 + 0] = pt.targetPos.x;
      targetPositions[i * 3 + 1] = pt.targetPos.y;
      targetPositions[i * 3 + 2] = pt.targetPos.z;

      initialPositions[i * 3 + 0] = pt.initialPos.x;
      initialPositions[i * 3 + 1] = pt.initialPos.y;
      initialPositions[i * 3 + 2] = pt.initialPos.z;

      colors[i * 3 + 0] = pt.color.r;
      colors[i * 3 + 1] = pt.color.g;
      colors[i * 3 + 2] = pt.color.b;

      sizes[i] = pt.size;
      flowOrders[i] = pt.flowOrder;
      spineProgs[i] = pt.spineProg;

      // Check if lime (r > 0.7, g > 0.9, b < 0.2)
      isLimes[i] = (pt.color.g > 0.9 && pt.color.b < 0.2) ? 1.0 : 0.0;
    }

    geom.setAttribute('aSimUv', new THREE.BufferAttribute(uvs, 2));
    geom.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
    geom.setAttribute('aInitialPos', new THREE.BufferAttribute(initialPositions, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aFlowOrder', new THREE.BufferAttribute(flowOrders, 1));
    geom.setAttribute('aSpineProg', new THREE.BufferAttribute(spineProgs, 1));
    geom.setAttribute('aIsLime', new THREE.BufferAttribute(isLimes, 1));

    // Dummy position attribute for Three.js bounding box
    geom.setAttribute('position', new THREE.BufferAttribute(targetPositions, 3));

    const unis = {
      uPosTexture: { value: null },
      uIsGpuActive: { value: 0 },
      uTime: { value: 0 },
      uFormationTime: { value: 0 },
      uLivingTime: { value: 0 },
      uPointer: { value: new THREE.Vector3(999, 999, 999) },
      uPointerRadius: { value: 1.25 },
    };

    return { geometry: geom, uniforms: unis };
  }, [totalCount, simSize, particles]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, [uniforms]);

  // Pointer unprojection
  const pointerWorldPos = useMemo(() => new THREE.Vector3(999, 999, 999), []);

  useFrame((state, delta) => {
    const inputs = inputsRef.current;
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.033);

    // 1. Advance Formation Monotonically (Never Resets)
    if (introPhase !== 'loading' && introPhase !== 'tension') {
      formationTimeRef.current += dt;
      if (formationTimeRef.current >= 2.5) {
        formationCompletedRef.current = true;
      }
    }

    // 2. Advance Permanent Living-Motion Clock continuously
    if (formationCompletedRef.current) {
      livingTimeRef.current += dt;
    }

    // 3. Unproject pointer into interaction plane at Z = 0
    const pX = inputs?.pointerX || 0;
    const pY = inputs?.pointerY || 0;

    const planeZ = 0.0;
    const dist = camera.position.z - planeZ;
    const vFOV = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const halfHeight = Math.tan(vFOV / 2) * dist;
    const halfWidth = halfHeight * (camera as THREE.PerspectiveCamera).aspect;

    pointerWorldPos.set(pX * halfWidth, pY * halfHeight, planeZ);

    // 4. Update cursor wind wake trail memory
    const pointerMoved = pointerWorldPos.distanceTo(lastPointer) > 0.02;
    if (pointerMoved) {
      for (let i = MAX_TRAIL - 1; i > 0; i--) {
        trailPositions[i].copy(trailPositions[i - 1]);
        trailVelocities[i].copy(trailVelocities[i - 1]);
        trailAges[i] = trailAges[i - 1];
      }
      trailPositions[0].copy(pointerWorldPos);
      trailVelocities[0].set(inputs?.pointerVelX || 0, inputs?.pointerVelY || 0);
      trailAges[0] = 0;
      lastPointer.copy(pointerWorldPos);
    }

    for (let i = 0; i < MAX_TRAIL; i++) {
      trailAges[i] += dt;
    }

    // 5. Execute GPGPU Simulation Frame
    if (isGpuActiveRef.current && gpuComputeRef.current && velVarRef.current && posVarRef.current) {
      const velUni = velVarRef.current.material.uniforms;
      const posUni = posVarRef.current.material.uniforms;

      velUni.uTime.value = t;
      velUni.uDelta.value = dt;
      velUni.uFormationTime.value = formationTimeRef.current;
      velUni.uLivingTime.value = livingTimeRef.current;
      velUni.uScrollProgress.value = scrollProgress;
      velUni.uPointer.value.copy(pointerWorldPos);
      velUni.uPointerVel.value.set(inputs?.pointerVelX || 0, inputs?.pointerVelY || 0);
      velUni.uPointerSpeed.value = inputs?.pointerVel || 0;

      posUni.uDelta.value = dt;

      gpuComputeRef.current.compute();

      const currentPosTexture = gpuComputeRef.current.getCurrentRenderTarget(posVarRef.current).texture;
      material.uniforms.uPosTexture.value = currentPosTexture;
      material.uniforms.uIsGpuActive.value = 1.0;
    } else {
      material.uniforms.uIsGpuActive.value = 0.0;
    }

    material.uniforms.uTime.value = t;
    material.uniforms.uFormationTime.value = formationTimeRef.current;
    material.uniforms.uLivingTime.value = livingTimeRef.current;
    material.uniforms.uPointer.value.copy(pointerWorldPos);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={2} />;
};
