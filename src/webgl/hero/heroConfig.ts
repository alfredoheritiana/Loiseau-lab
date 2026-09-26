import { QualityLevel } from '../../types';

export interface TierConfig {
  nodeCount: number;
  connectorCount: number;
  particleCount: number;
  fluidProfile: 'balanced' | 'performance' | 'off';
  enableAO: boolean;
  enableTransmission: boolean;
  dprMax: number;
}

export const HERO_TIERS: Record<QualityLevel, TierConfig> = {
  HIGH: {
    nodeCount: 20,       // 18–22 nodes
    connectorCount: 11,   // 10–12 connectors
    particleCount: 650,   // 500–800 sparse micro-points
    fluidProfile: 'balanced',
    enableAO: true,
    enableTransmission: true,
    dprMax: 1.75,
  },
  MEDIUM: {
    nodeCount: 14,       // 13–16 nodes
    connectorCount: 8,    // 7–9 connectors
    particleCount: 350,   // 250–450 particles
    fluidProfile: 'performance',
    enableAO: true,
    enableTransmission: false,
    dprMax: 1.25,
  },
  LOW: {
    nodeCount: 9,        // 8–10 nodes
    connectorCount: 5,    // 4–6 connectors
    particleCount: 100,   // 0–150 particles
    fluidProfile: 'off',
    enableAO: false,
    enableTransmission: false,
    dprMax: 1.0,
  },
  STATIC: {
    nodeCount: 8,
    connectorCount: 4,
    particleCount: 0,
    fluidProfile: 'off',
    enableAO: false,
    enableTransmission: false,
    dprMax: 1.0,
  },
};

export const HERO_COLORS = {
  // ~70% Dark Anodized Graphite / Smoked Ceramic
  GRAPHITE_DARK: '#121411',
  GRAPHITE_CORE: '#161914',
  GRAPHITE_SURFACE: '#20241E',

  // ~18% Off-White Satin / Silver Grey
  OFFWHITE_SATIN: '#DCE0D5',
  OFFWHITE_PURE: '#ECEEE5',

  // ~8% Signal Lime (Restrained, high-value accents)
  SIGNAL_LIME: '#CFFE16',
  LIME_EMISSIVE: '#7EBA00',

  // ~4% Deep Translucent Accent
  TRANSLUCENT_POD: '#1A2416',

  // Connectors
  CONNECTOR_NEUTRAL: '#8A8E85',
  CONNECTOR_LIME: '#CFFE16',
};
