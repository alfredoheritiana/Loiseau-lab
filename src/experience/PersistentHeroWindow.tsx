import React from 'react';
import { HeroPhysicalSystem } from '../webgl/HeroPhysicalSystem';
import { useExperience } from '../context/ExperienceContext';
import { CANVAS_IDS } from '../motion/flipIds';

interface PersistentHeroWindowProps {
  progress?: number;
}

/**
 * PersistentHeroWindow
 * Stays permanently mounted across the entire experience.
 * Survives the Loader -> Hero handoff with zero recreation.
 */
export const PersistentHeroWindow: React.FC<PersistentHeroWindowProps> = ({ progress = 0 }) => {
  const { inputsRef, introPhase } = useExperience();

  const heroProgress = progress || inputsRef.current?.sceneProgress.hero || 0;
  const isLoaderPhase = introPhase === 'loading' || introPhase === 'tension';

  return (
    <group name={CANVAS_IDS.HERO_WINDOW} userData={{ id: CANVAS_IDS.HERO_WINDOW }}>
      <HeroPhysicalSystem progress={heroProgress} />
    </group>
  );
};
