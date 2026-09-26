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
    nodeCount: 22,
    connectorCount: 12,
    particleCount: 950,
    fluidProfile: 'balanced',
    enableAO: true,
    enableTransmission: true,
    dprMax: 1.8,
  },
  MEDIUM: {
    nodeCount: 16,
    connectorCount: 8,
    particleCount: 450,
    fluidProfile: 'performance',
    enableAO: true,
    enableTransmission: false,
    dprMax: 1.25,
  },
  LOW: {
    nodeCount: 10,
    connectorCount: 5,
    particleCount: 120,
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
  GRAPHITE_DARK: '#0F120E',
  GRAPHITE_SURFACE: '#1C201A',
  OFFWHITE_SATIN: '#ECEEE5',
  SIGNAL_LIME: '#CFFE16',
  LIME_EMISSIVE: '#A3E300',
  CONNECTOR_BASE: 'rgba(236, 238, 229, 0.45)',
  CONNECTOR_LIME: 'rgba(207, 254, 22, 0.85)',
};
