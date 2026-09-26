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
      {/* N8AO: Contact depth & physical occlusion */}
      <N8AO
        aoRadius={isHigh ? 1.4 : 0.9}
        intensity={isHigh ? 1.6 : 1.1}
        distanceFalloff={0.65}
      />

      {/* Selective Bloom on emissive lime accents */}
      <Bloom
        luminanceThreshold={0.82}
        luminanceSmoothing={0.2}
        intensity={0.45}
        mipmapBlur
      />

      {/* Explicit ACES Filmic Tone Mapping */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};
