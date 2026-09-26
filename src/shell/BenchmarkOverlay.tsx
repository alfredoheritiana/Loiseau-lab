import React from 'react';
import { useExperience } from '../context/ExperienceContext';
import { X, Activity } from 'lucide-react';
import { QualityLevel } from '../types';
import { FLIP_IDS, CANVAS_IDS } from '../motion/flipIds';

export const BenchmarkOverlay: React.FC = () => {
  const {
    appMode,
    debugMode,
    setDebugMode,
    activeScene,
    qualityLevel,
    setQualityLevel,
    reducedMotion,
    fps,
    frameTime,
    inputsRef,
    introPhase,
  } = useExperience();

  // In Presentation mode, keep diagnostics completely hidden unless explicitly forced via hotkey
  if (appMode !== 'benchmark' && !debugMode) return null;
  if (!debugMode && appMode !== 'benchmark') return null;

  const inputs = inputsRef.current;
  const tiers: QualityLevel[] = ['HIGH', 'MEDIUM', 'LOW', 'STATIC'];

  return (
    <aside
      role="complementary"
      aria-label="Diagnostic Telemetry Console"
      className="fixed bottom-4 right-4 z-50 w-84 bg-[#0e110c]/95 text-[#ECEEE5] border border-[#CFFE16]/50 p-4 font-utility-mono text-xs backdrop-blur-md shadow-2xl transition-all duration-200 pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-2 text-[#CFFE16] font-bold">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>BENCHMARK HUD [B / ~]</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 border border-white/10">
            {appMode.toUpperCase()}
          </span>
          <button
            onClick={() => setDebugMode(false)}
            className="text-white/60 hover:text-white cursor-pointer"
            aria-label="Close Diagnostics"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Phase 2 Architecture Validation Metrics */}
      <div className="border-b border-white/10 pb-2 mb-2 text-[10px] space-y-1">
        <div className="text-white/50 uppercase font-bold tracking-wider">PHASE 2 FLIP & CANVAS STATUS:</div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div>INTRO PHASE: <span className="text-[#CFFE16] font-bold">{introPhase.toUpperCase()}</span></div>
          <div>CANVAS: <span className="text-[#CFFE16] font-bold">ONE PERSISTENT</span></div>
          <div>SHARED ID: <span className="text-white font-mono">{FLIP_IDS.FRAME}</span></div>
          <div>WEBGL ID: <span className="text-white font-mono">{CANVAS_IDS.HERO_WINDOW}</span></div>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="space-y-1.5 mb-3 text-[11px]">
        <div className="flex justify-between items-center bg-black/40 px-2 py-1 border border-white/5">
          <span className="text-white/60">FPS / FRAME TIME:</span>
          <span className={`font-bold ${fps < 45 ? 'text-amber-400' : 'text-[#CFFE16]'}`}>
            {fps} FPS ({frameTime}ms)
          </span>
        </div>

        <div className="flex justify-between items-center bg-black/40 px-2 py-1 border border-white/5">
          <span className="text-white/60">ACTIVE SCENE:</span>
          <span className="text-white font-medium truncate max-w-[150px]">
            {activeScene.replace('scene-', '')}
          </span>
        </div>

        <div className="flex justify-between items-center bg-black/40 px-2 py-1 border border-white/5">
          <span className="text-white/60">NORM SCROLL (Y):</span>
          <span className="text-white tabular-nums">
            {((inputs?.normalizedScroll || 0) * 100).toFixed(1)}% ({Math.round(inputs?.scrollY || 0)}px)
          </span>
        </div>

        <div className="flex justify-between items-center bg-black/40 px-2 py-1 border border-white/5">
          <span className="text-white/60">POINTER VELOCITY:</span>
          <span className="text-white tabular-nums">
            {(inputs?.pointerVel || 0).toFixed(2)} px/ms
          </span>
        </div>

        <div className="flex justify-between items-center bg-black/40 px-2 py-1 border border-white/5">
          <span className="text-white/60">MOTION COMPLIANCE:</span>
          <span className={reducedMotion ? 'text-amber-400 font-bold' : 'text-white/60'}>
            {reducedMotion ? 'REDUCED' : 'FULL'}
          </span>
        </div>
      </div>

      {/* Local Scene Progress Registers */}
      <div className="border-t border-white/10 pt-2 mb-3">
        <div className="text-[10px] text-white/50 uppercase mb-1">DETERMINISTIC PROGRESS:</div>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
          <div>HERO: {((inputs?.sceneProgress.hero || 0) * 100).toFixed(0)}%</div>
          <div>DEFORM: {((inputs?.sceneProgress.deformable || 0) * 100).toFixed(0)}%</div>
          <div>CARD: {((inputs?.sceneProgress.cardFullscreen || 0) * 100).toFixed(0)}%</div>
          <div>WORLD A: {((inputs?.sceneProgress.worldA || 0) * 100).toFixed(0)}%</div>
          <div>WORLD B: {((inputs?.sceneProgress.worldB || 0) * 100).toFixed(0)}%</div>
          <div>FAN: {((inputs?.sceneProgress.socialFan || 0) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Manual Quality Tier Override */}
      <div className="border-t border-white/10 pt-2">
        <div className="text-[10px] text-white/50 uppercase mb-1">QUALITY OVERRIDE:</div>
        <div className="grid grid-cols-4 gap-1">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setQualityLevel(tier)}
              className={`py-1 text-[10px] text-center font-bold border transition-colors cursor-pointer ${
                qualityLevel === tier
                  ? 'bg-[#CFFE16] text-[#080808] border-[#CFFE16]'
                  : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
