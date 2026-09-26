import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FluidSimulation, FLUID_PROFILES } from 'three-fluid-fx';
import { useExperience } from '../../context/ExperienceContext';

interface HeroFluidSystemProps {
  profile: 'balanced' | 'performance' | 'off';
  onFluidReady?: () => void;
  onFluidUpdate?: (velocityTexture: any) => void;
}

export const HeroFluidSystem: React.FC<HeroFluidSystemProps> = ({
  profile,
  onFluidReady,
  onFluidUpdate,
}) => {
  const { gl, size } = useThree();
  const { inputsRef } = useExperience();
  const fluidRef = useRef<FluidSimulation | null>(null);
  const isReadyReported = useRef(false);

  useEffect(() => {
    if (profile === 'off') {
      onFluidReady?.();
      return;
    }

    try {
      const fluidConfig = profile === 'balanced' ? FLUID_PROFILES.balanced : FLUID_PROFILES.performance;

      const sim = new FluidSimulation(gl as any, {
        ...fluidConfig,
        simResolution: profile === 'balanced' ? 128 : 64,
        dyeResolution: profile === 'balanced' ? 256 : 128,
        densityDissipation: 0.98,
        velocityDissipation: 0.98,
        pressureIterations: profile === 'balanced' ? 12 : 6,
      });

      fluidRef.current = sim;
      if (!isReadyReported.current) {
        isReadyReported.current = true;
        onFluidReady?.();
      }
    } catch (err) {
      console.warn('Fluid simulation initialization fallback:', err);
      onFluidReady?.();
    }

    return () => {
      if (fluidRef.current) {
        fluidRef.current.dispose();
        fluidRef.current = null;
      }
    };
  }, [gl, profile, onFluidReady]);

  // Track size updates using sim.resize()
  useEffect(() => {
    if (fluidRef.current && size.width > 0 && size.height > 0) {
      fluidRef.current.resize(size.width, size.height);
    }
  }, [size]);

  useFrame((state, delta) => {
    const sim = fluidRef.current;
    if (!sim || profile === 'off') return;

    const inputs = inputsRef.current;
    const speed = inputs?.pointerVel || 0;

    // Pointer velocity splat: convert normalized (-1 to 1) to UV (0 to 1)
    if (speed > 0.04) {
      const u = (inputs.pointerX + 1) * 0.5;
      const v = (inputs.pointerY + 1) * 0.5;
      const dx = (inputs.pointerVelX || 0) * 0.015;
      const dy = (inputs.pointerVelY || 0) * 0.015;

      sim.addSplat(u, v, dx, dy, {
        radius: 0.035,
        dyeColor: [0.81, 0.99, 0.09], // signal lime tint
      });
    }

    // Step simulation
    sim.step(Math.min(delta, 0.033));
    onFluidUpdate?.(sim.velocityTexture);
  });

  return null;
};
