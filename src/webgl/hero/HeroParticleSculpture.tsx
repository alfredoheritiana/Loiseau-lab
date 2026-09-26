import React, { useRef, useMemo, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { useExperience } from '../../context/ExperienceContext';
import { sampleSculptureParticles, SampledPoint } from './HeroRibbonGeometry';
import { HERO_TIERS } from './heroConfig';

interface HeroParticleSculptureProps {
  onReady?: () => void;
  scrollProgress?: number;
}

const velocityShader = `
  uniform float uTime;
  uniform float uDelta;
  uniform vec3 uPointer;
  uniform vec2 uPointerVel;
  uniform float uPointerSpeed;
  uniform float uPointerRadius;
  uniform float uReturnStrength;
  uniform float uDamping;
  uniform sampler2D uOriginTexture;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 posData = texture2D(texturePosition, uv);
    vec4 velData = texture2D(textureVelocity, uv);
    vec4 origData = texture2D(uOriginTexture, uv);

    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    vec3 orig = origData.xyz;
    float phase = velData.w;

    // 1. Spring force restoring particle to resting sculptured origin
    vec3 returnDir = orig - pos;
    vec3 returnForce = returnDir * uReturnStrength;

    // 2. Subtle organic breathing drift (Very gentle, no chaotic drift)
    vec3 idleDrift = vec3(
      sin(uTime * 0.45 + phase * 6.28) * 0.02,
      cos(uTime * 0.38 + phase * 6.28) * 0.018,
      sin(uTime * 0.52 + phase * 6.28) * 0.015
    );

    // 3. Pointer deformation pocket & repulsion
    vec3 toPointer = pos - uPointer;
    // Anisotropic distance calculation (Z flattened to create crisp interaction pocket)
    float d2 = toPointer.x * toPointer.x + toPointer.y * toPointer.y + toPointer.z * toPointer.z * 1.6;
    float dist = sqrt(max(0.0001, d2));

    vec3 pointerForce = vec3(0.0);
    if (dist < uPointerRadius) {
      float factor = 1.0 - smoothstep(0.0, uPointerRadius, dist);
      vec3 repelDir = normalize(toPointer);
      float pushMagnitude = factor * (1.1 + uPointerSpeed * 0.9) * 5.2;
      pointerForce += repelDir * pushMagnitude;

      // Swirl / vortex component from pointer velocity direction
      vec3 swirlDir = vec3(-uPointerVel.y, uPointerVel.x, 0.0) * 0.45;
      pointerForce += swirlDir * factor * 2.8;
    }

    // Accumulate forces
    vec3 accel = returnForce + idleDrift + pointerForce;

    // Viscous, heavily damped integration (Smooth, graceful return without elastic rubber bouncing)
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
    gl_FragColor = vec4(pos, posData.w); // w stores ribbonId
  }
`;

const renderVertexShader = `
  uniform sampler2D uPosTexture;
  uniform float uIsGpuActive;
  uniform float uTime;
  uniform vec3 uPointer;
  uniform float uPointerRadius;

  attribute vec2 aSimUv;
  attribute vec3 aOrigin;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = aOrigin;

    if (uIsGpuActive > 0.5) {
      vec4 simData = texture2D(uPosTexture, aSimUv);
      pos = simData.xyz;
    } else {
      // Direct CPU/vertex fallback: smooth procedural return & deformation
      vec3 toPointer = pos - uPointer;
      float dist = length(toPointer);
      if (dist < uPointerRadius) {
        float factor = 1.0 - smoothstep(0.0, uPointerRadius, dist);
        pos += normalize(toPointer) * factor * 0.4;
      }
      pos.x += sin(uTime * 0.45 + aPhase * 6.28) * 0.015;
      pos.y += cos(uTime * 0.38 + aPhase * 6.28) * 0.012;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Strict point size clamping: 1.0 to 2.4px maximum (NO gigantic blurry bokeh discs)
    gl_PointSize = clamp(aSize * (22.0 / -mvPosition.z), 1.0, 2.5);

    vColor = aColor;
    vAlpha = 0.85;
  }
`;

const renderFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Crisp, rounded point particle
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const HeroParticleSculpture: React.FC<HeroParticleSculptureProps> = ({
  onReady,
  scrollProgress = 0,
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

  // 1. Sample deterministic particle points from the 3 procedural ribbons
  const { points, sampledData } = useMemo(() => {
    const pts = sampleSculptureParticles(totalCount);
    return {
      points: pts,
      sampledData: pts,
    };
  }, [totalCount]);

  // 2. Initialize GPGPU Computation Renderer
  useEffect(() => {
    try {
      const gpuCompute = new GPUComputationRenderer(simSize, simSize, gl);

      const dtPosition = gpuCompute.createTexture();
      const dtVelocity = gpuCompute.createTexture();
      const dtOrigin = gpuCompute.createTexture();

      const posArray = dtPosition.image.data as Float32Array | null;
      const velArray = dtVelocity.image.data as Float32Array | null;
      const origArray = dtOrigin.image.data as Float32Array | null;

      if (!posArray || !velArray || !origArray) {
        return;
      }

      for (let i = 0; i < totalCount; i++) {
        const pt = sampledData[i];
        const idx = i * 4;

        posArray[idx + 0] = pt.position.x;
        posArray[idx + 1] = pt.position.y;
        posArray[idx + 2] = pt.position.z;
        posArray[idx + 3] = pt.ribbonId;

        velArray[idx + 0] = 0;
        velArray[idx + 1] = 0;
        velArray[idx + 2] = 0;
        velArray[idx + 3] = Math.random(); // phase for organic breathing

        origArray[idx + 0] = pt.position.x;
        origArray[idx + 1] = pt.position.y;
        origArray[idx + 2] = pt.position.z;
        origArray[idx + 3] = pt.size;
      }

      const velVariable = gpuCompute.addVariable('textureVelocity', velocityShader, dtVelocity);
      const posVariable = gpuCompute.addVariable('texturePosition', positionShader, dtPosition);

      gpuCompute.setVariableDependencies(velVariable, [posVariable, velVariable]);
      gpuCompute.setVariableDependencies(posVariable, [posVariable, velVariable]);

      // Velocity uniforms
      velVariable.material.uniforms.uTime = { value: 0 };
      velVariable.material.uniforms.uDelta = { value: 0.016 };
      velVariable.material.uniforms.uPointer = { value: new THREE.Vector3(999, 999, 999) };
      velVariable.material.uniforms.uPointerVel = { value: new THREE.Vector2(0, 0) };
      velVariable.material.uniforms.uPointerSpeed = { value: 0 };
      velVariable.material.uniforms.uPointerRadius = { value: 1.15 };
      velVariable.material.uniforms.uReturnStrength = { value: 4.2 };
      velVariable.material.uniforms.uDamping = { value: 0.88 };
      velVariable.material.uniforms.uOriginTexture = { value: dtOrigin };

      // Position uniforms
      posVariable.material.uniforms.uDelta = { value: 0.016 };

      const error = gpuCompute.init();
      if (error !== null) {
        console.warn('GPGPU initialization fallback to vertex simulation:', error);
        isGpuActiveRef.current = false;
      } else {
        gpuComputeRef.current = gpuCompute;
        posVarRef.current = posVariable;
        velVarRef.current = velVariable;
        isGpuActiveRef.current = true;
      }
    } catch (err) {
      console.warn('GPGPU error, falling back cleanly:', err);
      isGpuActiveRef.current = false;
    }

    onReady?.();

    return () => {
      gpuComputeRef.current = null;
      posVarRef.current = null;
      velVarRef.current = null;
    };
  }, [gl, simSize, totalCount, sampledData, onReady]);

  // 3. Render Geometry & Buffers
  const { geometry, uniforms } = useMemo(() => {
    const geom = new THREE.BufferGeometry();

    const uvs = new Float32Array(totalCount * 2);
    const origins = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);
    const phases = new Float32Array(totalCount);

    for (let i = 0; i < totalCount; i++) {
      const x = (i % simSize) / simSize;
      const y = Math.floor(i / simSize) / simSize;
      uvs[i * 2 + 0] = x;
      uvs[i * 2 + 1] = y;

      const pt = points[i];
      origins[i * 3 + 0] = pt.position.x;
      origins[i * 3 + 1] = pt.position.y;
      origins[i * 3 + 2] = pt.position.z;

      colors[i * 3 + 0] = pt.color.r;
      colors[i * 3 + 1] = pt.color.g;
      colors[i * 3 + 2] = pt.color.b;

      sizes[i] = pt.size;
      phases[i] = Math.random();
    }

    geom.setAttribute('aSimUv', new THREE.BufferAttribute(uvs, 2));
    geom.setAttribute('aOrigin', new THREE.BufferAttribute(origins, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    // Dummy position attribute for Three.js bounding box
    geom.setAttribute('position', new THREE.BufferAttribute(origins, 3));

    const unis = {
      uPosTexture: { value: null },
      uIsGpuActive: { value: 0 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3(999, 999, 999) },
      uPointerRadius: { value: 1.15 },
    };

    return { geometry: geom, uniforms: unis };
  }, [totalCount, simSize, points]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending, // NormalBlending prevents milky white wash
    });
  }, [uniforms]);

  // Pointer unprojection ref
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

    if (isGpuActiveRef.current && gpuComputeRef.current && velVarRef.current && posVarRef.current) {
      const velUni = velVarRef.current.material.uniforms;
      const posUni = posVarRef.current.material.uniforms;

      velUni.uTime.value = t;
      velUni.uDelta.value = dt;
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
    material.uniforms.uPointer.value.copy(pointerWorldPos);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={2} />;
};
