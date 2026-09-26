import { QualityLevel } from '../../types';

export interface TierConfig {
  simSize: number;       // Texture size for GPGPU (simSize * simSize = particle count)
  particleCount: number; // Exact particle count
  enableAO: boolean;
  enableBloom: boolean;
  dprMax: number;
}

export const HERO_TIERS: Record<QualityLevel, TierConfig> = {
  HIGH: {
    simSize: 180,
    particleCount: 180 * 180, // 32,400 particles (within 24k–40k)
    enableAO: true,
    enableBloom: true,
    dprMax: 1.75,
  },
  MEDIUM: {
    simSize: 140,
    particleCount: 140 * 140, // 19,600 particles (within 14k–22k)
    enableAO: true,
    enableBloom: true,
    dprMax: 1.25,
  },
  LOW: {
    simSize: 100,
    particleCount: 100 * 100, // 10,000 particles (within 7k–12k)
    enableAO: false,
    enableBloom: false,
    dprMax: 1.0,
  },
  STATIC: {
    simSize: 80,
    particleCount: 80 * 80,   // 6,400 particles (within 4k–8k)
    enableAO: false,
    enableBloom: false,
    dprMax: 1.0,
  },
};

export const HERO_COLORS = {
  // 70–75% Dark Graphite / Smoked Ceramic / Anodized Titanium
  GRAPHITE_DARK: '#111310',
  GRAPHITE_SHEEN: '#1C201A',

  // 20–25% Off-White Satin / Silver Grey
  OFFWHITE_SATIN: '#D8DDD2',
  OFFWHITE_PURE: '#ECEEE5',

  // ~5% Signal Acid Lime (Rare, high-value visual accent)
  SIGNAL_LIME: '#CFFE16',
  LIME_GLOW: '#98DE00',

  // Ghost Core: subtle smoked glass
  GHOST_CORE_GRAPHITE: '#0E100D',
  GHOST_CORE_PALE: '#1A1D18',
};
