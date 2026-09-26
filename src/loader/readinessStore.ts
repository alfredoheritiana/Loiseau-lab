export interface ReadinessStages {
  baseFontsDom: boolean;            // 8% - Fonts and DOM viewport metrics ready
  heroModule: boolean;              // 12% - Hero 3D module loaded
  sourceGeometryReady: boolean;     // 15% - 3 procedural ribbon geometries generated & sampled
  particleSimulationReady: boolean; // 15% - GPGPU buffers & textures initialized
  ghostCoreReady: boolean;          // 10% - Ghost core mesh mounted
  shaderCompileReady: boolean;      // 25% - Shaders precompiled via compileAsync
  warmupReady: boolean;             // 15% - First 10 frames warmed up and profiled
}

export const STAGE_WEIGHTS: Record<keyof ReadinessStages, number> = {
  baseFontsDom: 8,
  heroModule: 12,
  sourceGeometryReady: 15,
  particleSimulationReady: 15,
  ghostCoreReady: 10,
  shaderCompileReady: 25,
  warmupReady: 15,
};

export function calculateRealProgress(stages: ReadinessStages): number {
  let sum = 0;
  for (const [key, done] of Object.entries(stages)) {
    if (done) {
      sum += STAGE_WEIGHTS[key as keyof ReadinessStages] || 0;
    }
  }
  return Math.min(100, sum);
}
