import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface HeroFlowParticlesProps {
  count: number;
  velocityTexture: any;
}

const particleVertexShader = `
  uniform float uTime;
  uniform sampler2D uVelocityTexture;
  uniform vec2 uResolution;
  uniform float uHasFluid;

  attribute float aScale;
  attribute vec3 aRandomOffset;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec3 pos = position;

    // Aerodynamic gentle continuous flow drift
    float t = uTime * 0.20;
    pos.x += sin(t + aRandomOffset.x * 6.28) * 0.12;
    pos.y += cos(t * 0.7 + aRandomOffset.y * 6.28) * 0.10;
    pos.z += sin(t * 0.4 + aRandomOffset.z * 6.28) * 0.12;

    // Sample fluid velocity vectors in screen NDC space
    vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
    vec4 clipPos = projectionMatrix * viewPos;
    vec2 screenUv = (clipPos.xy / clipPos.w) * 0.5 + 0.5;

    if (uHasFluid > 0.5 && screenUv.x >= 0.0 && screenUv.x <= 1.0 && screenUv.y >= 0.0 && screenUv.y <= 1.0) {
      vec2 vel = texture2D(uVelocityTexture, screenUv).xy;
      pos.x += vel.x * 0.65;
      pos.y += vel.y * 0.65;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Strict point size clamping: 1.0 to 2.5px maximum (NO gigantic blurry bokeh blobs)
    float baseSize = aScale * 1.8 * (18.0 / max(2.0, -mvPosition.z));
    gl_PointSize = clamp(baseSize, 1.0, 2.5);

    // Controlled alpha fading to prevent white haze accumulation
    vAlpha = smoothstep(4.5, 0.8, length(pos.xy)) * 0.35;
    vColor = aRandomOffset.z > 0.82 ? vec3(0.81, 0.99, 0.09) : vec3(0.86, 0.88, 0.84);
  }
`;

const particleFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Soft, crisp particulate edge
    float alpha = smoothstep(0.5, 0.15, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const HeroFlowParticles: React.FC<HeroFlowParticlesProps> = ({ count, velocityTexture }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { size } = useThree();

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    const rand = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Contained volume focused around the constellation:
      // X: +0.2 to +1.8, Y: -0.5 to +1.5, Z: -1.8 to +0.25 (Safely behind camera at z=5.2)
      pos[i * 3 + 0] = 0.2 + (Math.random() - 0.3) * 4.5;
      pos[i * 3 + 1] = (Math.random() - 0.4) * 4.0;
      pos[i * 3 + 2] = -1.8 + Math.random() * 2.0;

      sc[i] = 0.6 + Math.random() * 0.6;

      rand[i * 3 + 0] = Math.random();
      rand[i * 3 + 1] = Math.random();
      rand[i * 3 + 2] = Math.random();
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('aScale', new THREE.BufferAttribute(sc, 1));
    geom.setAttribute('aRandomOffset', new THREE.BufferAttribute(rand, 3));
    return geom;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVelocityTexture: { value: velocityTexture },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uHasFluid: { value: velocityTexture ? 1.0 : 0.0 },
    }),
    []
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending, // NormalBlending prevents background milky wash
    });
  }, [uniforms]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.getElapsedTime();
    mat.uniforms.uVelocityTexture.value = velocityTexture;
    mat.uniforms.uHasFluid.value = velocityTexture ? 1.0 : 0.0;
  });

  if (count <= 0) return null;

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};
