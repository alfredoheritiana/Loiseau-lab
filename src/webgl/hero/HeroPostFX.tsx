import React from 'react';
import { EffectComposer, N8AO, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { QualityLevel } from '../../types';

interface HeroPostFXProps {
  qualityLevel: QualityLevel;
}

export const HeroPostFX: React.FC<HeroPostFXProps> = ({ qualityLevel }) => {
  if (qualityLevel === 'STATIC' || qualityLevel === 'LOW') {
    return null;
  }

  const isHigh = qualityLevel === 'HIGH';

  return (
    <EffectComposer multisampling={isHigh ? 4 : 0}>
      {/* 
        N8AO: Soft physical contact grounding.
        Calibrated radius and intensity to avoid crushed black dirt.
      */}
      <N8AO
        aoRadius={isHigh ? 1.1 : 0.8}
        intensity={isHigh ? 0.95 : 0.65}
        distanceFalloff={0.9}
      />

      {/* 
        Restrained Bloom:
        High luminance threshold (0.90) guarantees off-white bodies NEVER bloom.
        Only kicks in on intense lime specular highlights and emissive edges.
      */}
      <Bloom
        luminanceThreshold={0.90}
        luminanceSmoothing={0.15}
        intensity={0.25}
        mipmapBlur
      />

      {/* Explicit ACES Filmic Tone Mapping */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};
