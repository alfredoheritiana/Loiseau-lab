import { QualityLevel } from '../types';

export interface DeviceProfile {
  tier: QualityLevel;
  cpuCores: number;
  memoryGb: number;
  effectiveType: string;
  saveData: boolean;
  dpr: number;
  isMobile: boolean;
  webgl2: boolean;
  score: number;
}

/**
 * Lightweight safe device profiler.
 * Safely inspects browser signals without ever crashing on missing APIs.
 */
export function profileDevice(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      tier: 'MEDIUM',
      cpuCores: 4,
      memoryGb: 4,
      effectiveType: '4g',
      saveData: false,
      dpr: 1,
      isMobile: false,
      webgl2: true,
      score: 50,
    };
  }

  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  const effectiveType = conn?.effectiveType || '4g';
  const saveData = Boolean(conn?.saveData);
  const downlink = typeof conn?.downlink === 'number' ? conn.downlink : 10;

  const cpuCores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const memoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 4;

  const dpr = window.devicePixelRatio || 1;
  const isMobile = window.innerWidth < 768;

  // WebGL capability check
  let webgl2 = false;
  let maxTextureSize = 4096;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl) {
      webgl2 = true;
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    }
  } catch {
    webgl2 = false;
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Composite scoring model (0 to 100)
  let score = 50;

  // CPU Score (-20 to +25)
  if (cpuCores >= 8) score += 20;
  else if (cpuCores >= 6) score += 10;
  else if (cpuCores <= 2) score -= 20;

  // Memory Score (-25 to +20)
  if (memoryGb >= 8) score += 15;
  else if (memoryGb >= 6) score += 10;
  else if (memoryGb <= 2) score -= 25;

  // Network / SaveData penalty
  if (saveData) score -= 30;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') score -= 30;
  else if (effectiveType === '3g') score -= 15;
  else if (downlink >= 15) score += 10;

  // Screen / Texture
  if (isMobile) score -= 15;
  if (maxTextureSize >= 8192) score += 10;
  if (!webgl2) score -= 35;

  // Explicit reduced motion defaults to LOW
  if (prefersReduced) {
    return {
      tier: 'LOW',
      cpuCores,
      memoryGb,
      effectiveType,
      saveData,
      dpr: 1,
      isMobile,
      webgl2,
      score: 10,
    };
  }

  // Derive initial quality tier
  let tier: QualityLevel = 'MEDIUM';
  if (score >= 65 && !isMobile && webgl2 && !saveData) {
    tier = 'HIGH';
  } else if (score <= 32 || saveData || !webgl2) {
    tier = 'LOW';
  } else {
    tier = 'MEDIUM';
  }

  return {
    tier,
    cpuCores,
    memoryGb,
    effectiveType,
    saveData,
    dpr: Math.min(dpr, tier === 'HIGH' ? 2 : 1.25),
    isMobile,
    webgl2,
    score,
  };
}
