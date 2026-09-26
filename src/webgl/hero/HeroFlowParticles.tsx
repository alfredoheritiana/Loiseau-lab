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

    // Aerodynamic continuous flow loop
    float t = uTime * 0.25;
    pos.x += sin(t + aRandomOffset.x * 6.28) * 0.15;
    pos.y += cos(t * 0.8 + aRandomOffset.y * 6.28) * 0.12;
    pos.z += sin(t * 0.5 + aRandomOffset.z * 6.28) * 0.18;

    // Screen-space fluid velocity sampling
    vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
    vec4 clipPos = projectionMatrix * viewPos;
    vec2 screenUv = (clipPos.xy / clipPos.w) * 0.5 + 0.5;

    if (uHasFluid > 0.5 && screenUv.x >= 0.0 && screenUv.x <= 1.0 && screenUv.y >= 0.0 && screenUv.y <= 1.0) {
      vec2 vel = texture2D(uVelocityTexture, screenUv).xy;
      pos.x += vel.x * 0.85;
      pos.y += vel.y * 0.85;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective point size
    gl_PointSize = (aScale * 3.5) * (300.0 / -mvPosition.z);

    // Fade near edges
    vAlpha = smoothstep(5.0, 1.0, length(pos.xy));
    vColor = aRandomOffset.z > 0.75 ? vec3(0.81, 0.99, 0.09) : vec3(0.92, 0.93, 0.90);
  }
`;

const particleFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Soft circular point shape
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha * 0.65;
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
      pos[i * 3 + 0] = (Math.random() - 0.4) * 6.5;
      pos[i * 3 + 1] = (Math.random() - 0.45) * 5.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;

      sc[i] = 0.5 + Math.random() * 0.9;

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
      blending: THREE.AdditiveBlending,
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
