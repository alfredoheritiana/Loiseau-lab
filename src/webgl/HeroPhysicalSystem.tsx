import React from 'react';
import { HeroExperience } from './hero/HeroExperience';

export interface HeroPhysicalSystemProps {
  progress?: number;
  onShadersReady?: () => void;
  onWarmupReady?: () => void;
  onPhysicsReady?: () => void;
  onFluidReady?: () => void;
}

/**
 * HeroPhysicalSystem
 * Clean compatibility wrapper mounting the new Phase 3 Kinetic Constellation Hero.
 */
export const HeroPhysicalSystem: React.FC<HeroPhysicalSystemProps> = (props) => {
  return <HeroExperience {...props} />;
};
