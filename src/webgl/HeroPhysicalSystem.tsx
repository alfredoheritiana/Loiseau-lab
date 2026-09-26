import React from 'react';
import { HeroExperience } from './hero/HeroExperience';

export interface HeroPhysicalSystemProps {
  progress?: number;
  onShadersReady?: () => void;
  onWarmupReady?: () => void;
  onGeometryReady?: () => void;
  onSimulationReady?: () => void;
  onGhostCoreReady?: () => void;
}

/**
 * HeroPhysicalSystem
 * Compatibility wrapper mounting the Phase 3 Particle Sculpture Hero.
 */
export const HeroPhysicalSystem: React.FC<HeroPhysicalSystemProps> = (props) => {
  return <HeroExperience {...props} />;
};
