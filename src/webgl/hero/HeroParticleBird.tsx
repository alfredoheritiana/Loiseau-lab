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
  formationTime: number; // In seconds since hero mounted
}

const velocityShader = `
  uniform float uTime;
  uniform float uDelta;
  uniform float uFormationTime;
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
    vec4 metaData = texture2D(uMetaTexture, uv);   // xyz: initialPos, w: zoneId

    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    vec3 targetPos = origData.xyz;
    vec3 initialPos = metaData.xyz;
    float flowOrder = origData.w;
    float zoneId = metaData.w;

    // 1. Progressive 4-Act Formation Target Interpolation
    // Order: wing tips -> leading edges -> body -> tail -> wing interior
    float formProg = clamp((uFormationTime - 0.25 - flowOrder * 0.75) / 1.15, 0.0, 1.0);
    float smoothForm = smoothstep(0.0, 1.0, formProg);
    vec3 currentRestingPos = mix(initialPos, targetPos, smoothForm);

    // Act 4: Subtle living aerodynamic presence (tiny wingtip flex & breathing)
    if (smoothForm > 0.85) {
      float tipFlex = (zoneId == 1.0 ? 1.0 : (zoneId == 2.0 ? -0.7 : 0.0));
      float flexAmount = sin(uTime * 1.95 + pos.x * 0.8) * 0.04 * tipFlex;
      currentRestingPos.z += flexAmount;
      currentRestingPos.y += flexAmount * 0.35;
    }

    // Scroll Dissolve: particles peel and dissolve backward into flow matter
    if (uScrollProgress > 0.35) {
      float dissolveThreshold = 0.35 + flowOrder * 0.45;
      if (uScrollProgress > dissolveThreshold) {
        float dissolveRatio = (uScrollProgress - dissolveThreshold) / 0.35;
        currentRestingPos.z -= dissolveRatio * 4.5;
        currentRestingPos.x += (fract(sin(uv.x * 43.12) * 123.4) - 0.5) * dissolveRatio * 3.0;
        currentRestingPos.y += sin(uTime * 2.0 + uv.y * 12.0) * dissolveRatio * 1.8;
      }
    }

    // 2. Aerodynamic Restoring Spring Force
    vec3 returnDir = currentRestingPos - pos;
    vec3 returnForce = returnDir * uReturnStrength;

    // 3. Air / Wind Cursor Wake Interaction
    vec3 windForce = vec3(0.0);

    // Evaluate active pointer
    vec3 toPointer = pos - uPointer;
    float distSq = toPointer.x * toPointer.x + toPointer.y * toPointer.y + toPointer.z * toPointer.z * 1.8;
    float dist = sqrt(max(0.0001, distSq));

    if (dist < uPointerRadius) {
      float factor = 1.0 - smoothstep(0.0, uPointerRadius, dist);
      // Aerodynamic air displacement: push away and sweep along cursor wake
      vec3 repelDir = normalize(toPointer);
      vec3 wakeDir = vec3(uPointerVel.x, uPointerVel.y, 0.0);
      float pushMagnitude = factor * (1.2 + uPointerSpeed * 1.1) * 5.8;

      windForce += (repelDir * 0.65 + wakeDir * 0.5) * pushMagnitude;
    }

    // Evaluate short-lived cursor trail memory (wind wake propagation)
    for (int i = 0; i < MAX_TRAIL; i++) {
      if (uTrailAge[i] > 0.0 && uTrailAge[i] < 0.65) {
        vec3 toTrail = pos - uTrailPos[i];
        float trailDist = length(toTrail);
        float trailRadius = uPointerRadius * 0.85;
        if (trailDist < trailRadius) {
          float decay = 1.0 - (uTrailAge[i] / 0.65);
          float trailFactor = (1.0 - smoothstep(0.0, trailRadius, trailDist)) * decay;
          vec3 trailWind = vec3(uTrailVel[i].x, uTrailVel[i].y, 0.0);
          windForce += trailWind * trailFactor * 3.2;
        }
      }
    }

    // 4. Subtle Internal Circulation & Micro Motion
    float phase = velData.w;
    vec3 microCirculation = vec3(
      sin(uTime * 0.55 + phase * 6.28) * 0.02,
      cos(uTime * 0.45 + phase * 6.28) * 0.016,
      sin(uTime * 0.65 + phase * 6.28) * 0.014
    );

    // Accumulate and integrate
    vec3 accel = returnForce + windForce + microCirculation;
    vel = (vel + accel * uDelta) * uDamping;

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
  uniform float uFormationTime;
  uniform float uScrollProgress;
  uniform vec3 uPointer;
  uniform float uPointerRadius;

  attribute vec2 aSimUv;
  attribute vec3 aTargetPos;
  attribute vec3 aInitialPos;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aFlowOrder;
  attribute float aSpineProg;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = aTargetPos;

    if (uIsGpuActive > 0.5) {
      vec4 simData = texture2D(uPosTexture, aSimUv);
      pos = simData.xyz;
    } else {
      // Direct vertex fallback: progressive formation + wind displacement
      float formProg = clamp((uFormationTime - 0.25 - aFlowOrder * 0.75) / 1.15, 0.0, 1.0);
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

    // Strict point size clamping: 1.0 to 2.4px (clean, crisp, no huge bokeh circles)
    gl_PointSize = clamp(aSize * (24.0 / -mvPosition.z), 1.0, 2.6);

    // Acid Lime Signal Pulse: travels softly from tail -> body -> wing -> tip every 3.8 seconds
    float pulseTime = mod(uTime, 3.8);
    float pulsePos = pulseTime / 2.4; // Travels 0.0 -> 1.0 across 2.4s, rests for 1.4s
    float pulseDist = abs(aSpineProg - pulsePos);
    float pulseGlow = smoothstep(0.12, 0.0, pulseDist) * 0.75;

    // Apply color with signal pulse
    vec3 col = aColor;
    if (pulseGlow > 0.01) {
      col = mix(col, vec3(0.81, 0.99, 0.09), pulseGlow);
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

    // Soft, crisp circular point
    float alpha = smoothstep(0.5, 0.18, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const HeroParticleBird: React.FC<HeroParticleBirdProps> = ({
  onReady,
  scrollProgress = 0,
  formationTime = 0,
}) => {
  const { gl, camera } = useThree();
  const { inputsRef, qualityLevel } = useExperience();

  const tierConfig = HERO_TIERS[qualityLevel] || HERO_TIERS.MEDIUM;
  const simSize = tierConfig.simSize;
  const totalCount = simSize * simSize;

  const pointsRef = useRef<THREE.Points>(null);
  const gpuComputeRef = useRef<GPUComputationRenderer | null>(null);
  const posVarRef = useRef<any>(null);
  const velVarRef = useRef<any>(null);
  const isGpuActiveRef = useRef<boolean>(false);

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

  // 3. Initialize GPGPU Computation Renderer
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

        // Position starts in sparse field for Act 1
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

        // Static Initial & Zone texture
        metaArray[idx + 0] = pt.initialPos.x;
        metaArray[idx + 1] = pt.initialPos.y;
        metaArray[idx + 2] = pt.initialPos.z;
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
      velVariable.material.uniforms.uScrollProgress = { value: 0 };
      velVariable.material.uniforms.uPointer = { value: new THREE.Vector3(999, 999, 999) };
      velVariable.material.uniforms.uPointerVel = { value: new THREE.Vector2(0, 0) };
      velVariable.material.uniforms.uPointerSpeed = { value: 0 };
      velVariable.material.uniforms.uPointerRadius = { value: 1.25 };
      velVariable.material.uniforms.uReturnStrength = { value: 4.5 };
      velVariable.material.uniforms.uDamping = { value: 0.88 };
      velVariable.material.uniforms.uOriginTexture = { value: dtOrigin };
      velVariable.material.uniforms.uMetaTexture = { value: dtMeta };

      velVariable.material.uniforms.uTrailPos = { value: trailPositions };
      velVariable.material.uniforms.uTrailVel = { value: trailVelocities };
      velVariable.material.uniforms.uTrailAge = { value: trailAges };

      posVariable.material.uniforms.uDelta = { value: 0.016 };

      const error = gpuCompute.init();
      if (error !== null) {
        console.warn('GPGPU initialization fallback to direct vertex shader:', error);
        isGpuActiveRef.current = false;
      } else {
        gpuComputeRef.current = gpuCompute;
        posVarRef.current = posVariable;
        velVarRef.current = velVariable;
        isGpuActiveRef.current = true;
      }
    } catch (err) {
      console.warn('GPGPU error, fallback cleanly:', err);
      isGpuActiveRef.current = false;
    }

    onReady?.();

    return () => {
      gpuComputeRef.current = null;
      posVarRef.current = null;
      velVarRef.current = null;
    };
  }, [gl, simSize, totalCount, particles, onReady, trailPositions, trailVelocities, trailAges]);

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
    }

    geom.setAttribute('aSimUv', new THREE.BufferAttribute(uvs, 2));
    geom.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
    geom.setAttribute('aInitialPos', new THREE.BufferAttribute(initialPositions, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aFlowOrder', new THREE.BufferAttribute(flowOrders, 1));
    geom.setAttribute('aSpineProg', new THREE.BufferAttribute(spineProgs, 1));

    // Dummy position attribute for Three.js bounding box
    geom.setAttribute('position', new THREE.BufferAttribute(targetPositions, 3));

    const unis = {
      uPosTexture: { value: null },
      uIsGpuActive: { value: 0 },
      uTime: { value: 0 },
      uFormationTime: { value: 0 },
      uScrollProgress: { value: 0 },
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
      blending: THREE.NormalBlending, // NormalBlending guarantees no milky white wash
    });
  }, [uniforms]);

  // Pointer unprojection
  const pointerWorldPos = useMemo(() => new THREE.Vector3(999, 999, 999), []);

  useFrame((state, delta) => {
    const inputs = inputsRef.current;
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.033);

    // Unproject pointer into interaction plane at Z = 0
    const pX = inputs?.pointerX || 0;
    const pY = inputs?.pointerY || 0;

    const planeZ = 0.0;
    const dist = camera.position.z - planeZ;
    const vFOV = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const halfHeight = Math.tan(vFOV / 2) * dist;
    const halfWidth = halfHeight * (camera as THREE.PerspectiveCamera).aspect;

    pointerWorldPos.set(pX * halfWidth, pY * halfHeight, planeZ);

    // Update cursor wind wake trail memory
    const pointerMoved = pointerWorldPos.distanceTo(lastPointer) > 0.02;
    if (pointerMoved) {
      // Shift trail points
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

    // Age trail points
    for (let i = 0; i < MAX_TRAIL; i++) {
      trailAges[i] += dt;
    }

    if (isGpuActiveRef.current && gpuComputeRef.current && velVarRef.current && posVarRef.current) {
      const velUni = velVarRef.current.material.uniforms;
      const posUni = posVarRef.current.material.uniforms;

      velUni.uTime.value = t;
      velUni.uDelta.value = dt;
      velUni.uFormationTime.value = formationTime;
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
    material.uniforms.uFormationTime.value = formationTime;
    material.uniforms.uScrollProgress.value = scrollProgress;
    material.uniforms.uPointer.value.copy(pointerWorldPos);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={2} />;
};
