export interface ReadinessStages {
  baseFontsDom: boolean;       // 8%
  heroModulePhysics: boolean;  // 17%
  heroEnvironment: boolean;    // 10%
  rapierReady: boolean;        // 15%
  fluidReady: boolean;         // 10%
  shaderCompileReady: boolean; // 25%
  warmupReady: boolean;        // 15%
}

export const STAGE_WEIGHTS: Record<keyof ReadinessStages, number> = {
  baseFontsDom: 8,
  heroModulePhysics: 17,
  heroEnvironment: 10,
  rapierReady: 15,
  fluidReady: 10,
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
