import React from 'react';
import { HERO_COLORS } from './heroConfig';

export const HeroLighting: React.FC = () => {
  return (
    <group name="hero-lighting">
      {/* Deep readable ambient base fill */}
      <ambientLight intensity={0.48} color="#D8DCD0" />

      {/* Large Soft White Key Light (Above/Front) */}
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.4}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Cool Neutral Edge / Rim Light (Opposite side) */}
      <directionalLight
        position={[-5, 2, -3]}
        intensity={0.85}
        color="#D6E4FF"
      />

      {/* Subtle Signal Lime Reflection Accent (Back-right rim) */}
      <pointLight
        position={[3, -2, -2]}
        intensity={0.65}
        color={HERO_COLORS.SIGNAL_LIME}
        distance={12}
      />

      {/* Bottom Under-Glow Fill (Prevents black crush on underside curves) */}
      <directionalLight
        position={[0, -5, 2]}
        intensity={0.25}
        color="#222820"
      />
    </group>
  );
};
