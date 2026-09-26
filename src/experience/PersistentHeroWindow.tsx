import React, { useEffect, useCallback } from 'react';
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
  const { inputsRef, setReadinessStage } = useExperience();

  const heroProgress = progress || inputsRef.current?.sceneProgress.hero || 0;

  useEffect(() => {
    setReadinessStage('heroModule', true);
  }, [setReadinessStage]);

  const handleGeometryReady = useCallback(() => {
    setReadinessStage('sourceGeometryReady', true);
  }, [setReadinessStage]);

  const handleSimulationReady = useCallback(() => {
    setReadinessStage('particleSimulationReady', true);
  }, [setReadinessStage]);

  const handleGhostCoreReady = useCallback(() => {
    setReadinessStage('ghostCoreReady', true);
  }, [setReadinessStage]);

  const handleShadersReady = useCallback(() => {
    setReadinessStage('shaderCompileReady', true);
  }, [setReadinessStage]);

  const handleWarmupReady = useCallback(() => {
    setReadinessStage('warmupReady', true);
  }, [setReadinessStage]);

  return (
    <group name={CANVAS_IDS.HERO_WINDOW} userData={{ id: CANVAS_IDS.HERO_WINDOW }}>
      <HeroPhysicalSystem
        progress={heroProgress}
        onGeometryReady={handleGeometryReady}
        onSimulationReady={handleSimulationReady}
        onGhostCoreReady={handleGhostCoreReady}
        onShadersReady={handleShadersReady}
        onWarmupReady={handleWarmupReady}
      />
    </group>
  );
};
