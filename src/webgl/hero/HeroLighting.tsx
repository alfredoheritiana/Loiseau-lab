import React from 'react';
import { HERO_COLORS } from './heroConfig';

/**
 * HeroLighting
 * Sculptural studio product photography lighting against genuine #080808 black.
 * Precision directional softboxes define silhouettes and material curvature without milkiness.
 */
export const HeroLighting: React.FC = () => {
  return (
    <group name="hero-lighting">
      {/* 
        Controlled dark ambient fill:
        Keeps dark sides legible while maintaining deep charcoal/black contrast.
      */}
      <ambientLight intensity={0.22} color="#181B16" />

      {/* 
        Key Softbox Light (Upper-left / front):
        Soft white, sculpts aerodynamic curves and highlights clearcoat sheen.
      */}
      <directionalLight
        position={[-3.5, 4.5, 4.0]}
        intensity={1.05}
        color="#FAFAFA"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* 
        Cool Rim Light (Rear-right / edge):
        Crisp, narrow rim light that cuts dark silhouettes away from the #080808 background.
      */}
      <directionalLight
        position={[4.8, 2.2, -3.2]}
        intensity={0.8}
        color="#D6E2ED"
      />

      {/* 
        Acid Lime Reflection Source (Back-right glance):
        Subtle specular kicker creating occasional acid-green edge highlights on graphite.
      */}
      <pointLight
        position={[2.6, -1.8, -1.8]}
        intensity={0.45}
        color={HERO_COLORS.SIGNAL_LIME}
        distance={9}
      />

      {/* 
        Soft Under-Fill:
        Prevents bottom surfaces from clipping into absolute void.
      */}
      <directionalLight
        position={[0.5, -4.0, 1.5]}
        intensity={0.16}
        color="#151713"
      />
    </group>
  );
};
