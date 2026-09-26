import { QualityLevel } from '../../types';

export interface TierConfig {
  simSize: number;       // Texture size for GPGPU (simSize * simSize = particle count)
  particleCount: number; // Exact particle count
  enableAO: boolean;
  enableBloom: boolean;
  trailSteps: number;
  dprMax: number;
}

export const HERO_TIERS: Record<QualityLevel, TierConfig> = {
  HIGH: {
    simSize: 180,
    particleCount: 180 * 180, // 32,400 particles (within 28k–42k)
    enableAO: true,
    enableBloom: true,
    trailSteps: 12,
    dprMax: 1.75,
  },
  MEDIUM: {
    simSize: 140,
    particleCount: 140 * 140, // 19,600 particles (within 16k–24k)
    enableAO: true,
    enableBloom: true,
    trailSteps: 8,
    dprMax: 1.25,
  },
  LOW: {
    simSize: 100,
    particleCount: 100 * 100, // 10,000 particles (within 8k–14k)
    enableAO: false,
    enableBloom: false,
    trailSteps: 4,
    dprMax: 1.0,
  },
  STATIC: {
    simSize: 80,
    particleCount: 80 * 80,   // 6,400 particles (within 5k–9k)
    enableAO: false,
    enableBloom: false,
    trailSteps: 2,
    dprMax: 1.0,
  },
};

export const HERO_COLORS = {
  // ~81% Pale Ivory / Cool Silver Particles
  IVORY_SILVER: '#ECEEE5',
  SILVER_PALE: '#DCE0D5',

  // ~14% Dark Graphite / Ghost Particles
  GRAPHITE_DARK: '#121411',
  GRAPHITE_SHADOW: '#1A1D18',

  // ~5% Signal Acid Lime Particles
  SIGNAL_LIME: '#CFFE16',
  LIME_PULSE: '#A6FA00',

  // Ghost Core: Subtly smoked dark glass
  GHOST_CORE_BODY: '#10130F',
  GHOST_CORE_WING: '#161914',
};
