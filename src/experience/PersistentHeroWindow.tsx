import React, { useEffect } from 'react';
import { HeroPhysicalSystem } from '../webgl/HeroPhysicalSystem';
import { useExperience } from '../context/ExperienceContext';
import { CANVAS_IDS } from '../motion/flipIds';

interface PersistentHeroWindowProps {
  progress?: number;
}

/**
 * PersistentHeroWindow
 * Stays permanently mounted across the entire experience.
 * Reports real subsystem readiness to ExperienceContext / Loader.
 */
export const PersistentHeroWindow: React.FC<PersistentHeroWindowProps> = ({ progress = 0 }) => {
  const { inputsRef, setReadinessStage, qualityLevel } = useExperience();

  const heroProgress = progress || inputsRef.current?.sceneProgress.hero || 0;

  useEffect(() => {
    setReadinessStage('heroModulePhysics', true);
    setReadinessStage('heroEnvironment', true);

    if (qualityLevel === 'LOW' || qualityLevel === 'STATIC') {
      setReadinessStage('fluidReady', true);
    }
  }, [setReadinessStage, qualityLevel]);

  return (
    <group name={CANVAS_IDS.HERO_WINDOW} userData={{ id: CANVAS_IDS.HERO_WINDOW }}>
      <HeroPhysicalSystem
        progress={heroProgress}
        onPhysicsReady={() => setReadinessStage('rapierReady', true)}
        onFluidReady={() => setReadinessStage('fluidReady', true)}
        onShadersReady={() => setReadinessStage('shaderCompileReady', true)}
        onWarmupReady={() => setReadinessStage('warmupReady', true)}
      />
    </group>
  );
};
