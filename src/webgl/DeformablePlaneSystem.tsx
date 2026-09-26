import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../context/ExperienceContext';

// Custom vertex and fragment shaders for interactive deformable media
const DeformableVertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerVelocity;
  uniform float uHover;
  uniform float uProgress;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vDisplacement;

  void main() {
    vUv = uv;
    vNormal = normal;

    vec3 pos = position;

    // Distance from normalized pointer [-1, 1] mapped to UV [0, 1]
    vec2 pointerUV = uPointer * 0.5 + 0.5;
    float dist = distance(uv, pointerUV);

    // Dynamic wave ripple & gaussian bulge on hover
    float influence = smoothstep(0.7, 0.0, dist) * uHover;
    float ripple = sin(dist * 18.0 - uTime * 4.0) * 0.06 * uPointerVelocity;
    float bulge = influence * 0.35 + ripple;

    // Corner curl based on localProgress
    float curl = sin(uv.x * 3.14159) * sin(uv.y * 3.14159) * (1.0 - uProgress) * 0.1;

    pos.z += (bulge + curl);
    vDisplacement = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const DeformableFragmentShader = `
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uPointer;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorAccent;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vDisplacement;

  void main() {
    // Elegant procedural grid pattern + chromatic iridescence
    vec2 grid = abs(fract(vUv * 16.0 - 0.5) - 0.5) / fwidth(vUv * 16.0);
    float line = min(grid.x, grid.y);
    float gridPattern = 1.0 - min(line, 1.0);

    // Color gradient between dark laboratory slate and deep signal tint
    vec3 baseColor = mix(uColorA, uColorB, vUv.y + vDisplacement * 0.8);
    
    // Iridescent shift influenced by displacement
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    vec3 highlight = mix(uColorAccent, vec3(1.0), fresnel * 0.6);

    vec3 finalColor = mix(baseColor, highlight, uHover * 0.4 + clamp(vDisplacement * 1.5, 0.0, 0.5));
    finalColor += gridPattern * 0.08 * (1.0 - uHover * 0.4);

    // Subtle technical corner marks
    float border = step(0.015, vUv.x) * step(0.015, vUv.y) * step(vUv.x, 0.985) * step(vUv.y, 0.985);
    finalColor = mix(uColorAccent * 0.8, finalColor, border);

    gl_FragColor = vec4(finalColor, 0.96);
  }
`;

export const DeformablePlaneSystem: React.FC = () => {
  const { getTrackedBounds, inputsRef, qualityLevel } = useExperience();
  const { camera, size } = useThree();

  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerVelocity: { value: 0 },
      uHover: { value: 0 },
      uProgress: { value: 0 },
      uColorA: { value: new THREE.Color('#141713') },
      uColorB: { value: new THREE.Color('#1C221A') },
      uColorAccent: { value: new THREE.Color('#CFFE16') },
    }),
    []
  );

  const subdivisions = qualityLevel === 'LOW' ? 16 : qualityLevel === 'MEDIUM' ? 32 : 48;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const bounds = getTrackedBounds('deformable-media-window');
    const inputs = inputsRef.current;
    if (!bounds || !meshRef.current || !inputs) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    // Only render when the container is in or near viewport
    if (bounds.y + bounds.height < -100 || bounds.y > window.innerHeight + 100) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    // Synchronize 3D position to match 2D DOM coordinates precisely
    const perspCamera = camera as THREE.PerspectiveCamera;
    const vFov = (perspCamera.fov * Math.PI) / 180;
    const cameraDist = perspCamera.position.z;
    const visibleHeight = 2 * Math.tan(vFov / 2) * cameraDist;
    const visibleWidth = visibleHeight * (size.width / (size.height || 1));

    const meshWidth = (bounds.width / size.width) * visibleWidth;
    const meshHeight = (bounds.height / size.height) * visibleHeight;

    const meshX = ((bounds.x + bounds.width / 2) / size.width - 0.5) * visibleWidth;
    const meshY = -((bounds.y + bounds.height / 2) / size.height - 0.5) * visibleHeight;

    meshRef.current.position.set(meshX, meshY, 0);
    meshRef.current.scale.set(meshWidth, meshHeight, 1);

    // Calculate hover & pointer within the bounds of this element
    const insideX = inputs.pointerPxX >= bounds.x && inputs.pointerPxX <= bounds.x + bounds.width;
    const insideY = inputs.pointerPxY >= bounds.y && inputs.pointerPxY <= bounds.y + bounds.height;
    const isHovered = insideX && insideY;

    // Spring interpolation for hover state
    const targetHover = isHovered ? 1.0 : 0.0;
    uniforms.uHover.value = THREE.MathUtils.lerp(uniforms.uHover.value, targetHover, dt * 6.0);

    // Map pointer inside local UV [-1, 1]
    if (isHovered && bounds.width > 0 && bounds.height > 0) {
      const localNormX = ((inputs.pointerPxX - bounds.x) / bounds.width) * 2 - 1;
      const localNormY = -(((inputs.pointerPxY - bounds.y) / bounds.height) * 2 - 1);
      uniforms.uPointer.value.x = THREE.MathUtils.lerp(uniforms.uPointer.value.x, localNormX, dt * 10);
      uniforms.uPointer.value.y = THREE.MathUtils.lerp(uniforms.uPointer.value.y, localNormY, dt * 10);
    }

    uniforms.uPointerVelocity.value = THREE.MathUtils.lerp(
      uniforms.uPointerVelocity.value,
      inputs.pointerVel,
      dt * 5
    );
    uniforms.uTime.value += dt;
    uniforms.uProgress.value = inputs.sceneProgress.deformable || 0;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1, subdivisions, subdivisions]} />
      <shaderMaterial
        vertexShader={DeformableVertexShader}
        fragmentShader={DeformableFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
