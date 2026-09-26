import React, { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { Compass, Sparkles, Layers } from 'lucide-react';

export const Scene12_14_ImmersiveBridge: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState<'WORLD_A' | 'PORTAL' | 'WORLD_B'>('WORLD_A');
  const [worldProgress, setWorldProgress] = useState(0);

  const { setActiveScene, setNavTheme, inputsRef } = useExperience();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onEnter: () => {
        setActiveScene('scene-12-world-a');
        setNavTheme('immersive');
      },
      onEnterBack: () => {
        setActiveScene('scene-14-world-b');
        setNavTheme('blue');
      },
      onUpdate: (self) => {
        const p = self.progress;
        setWorldProgress(p);

        // Partition the scroll progress:
        // 0.00 - 0.50: World A (Spline tunnel travel)
        // 0.50 - 0.60: Portal transition (converging geometry + white flash)
        // 0.60 - 1.00: World B (Signal-blue corridor with persistent shared object)
        if (inputsRef.current) {
          if (p < 0.55) {
            inputsRef.current.sceneProgress.worldA = p / 0.55;
            inputsRef.current.sceneProgress.worldB = 0;
            inputsRef.current.sceneProgress.worldPortal = 0;
          } else if (p < 0.65) {
            inputsRef.current.sceneProgress.worldA = 1.0;
            inputsRef.current.sceneProgress.worldPortal = (p - 0.55) / 0.1;
            inputsRef.current.sceneProgress.worldB = 0;
          } else {
            inputsRef.current.sceneProgress.worldA = 1.0;
            inputsRef.current.sceneProgress.worldPortal = 0;
            inputsRef.current.sceneProgress.worldB = (p - 0.65) / 0.35;
          }
        }

        if (p < 0.5) {
          setStage('WORLD_A');
          setActiveScene('scene-12-world-a');
          setNavTheme('immersive');
        } else if (p < 0.62) {
          setStage('PORTAL');
          setActiveScene('scene-13-world-portal');
          setNavTheme('light');
        } else {
          setStage('WORLD_B');
          setActiveScene('scene-14-world-b');
          setNavTheme('blue');
        }
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme, inputsRef]);

  return (
    <section
      id="scene-12-world-a"
      ref={containerRef}
      className="relative w-full h-[400vh] bg-transparent text-[#ECEEE5] overflow-hidden"
    >
      {/* Sticky Cinematic HUD & Overlay */}
      <div className="sticky top-0 w-full h-screen flex flex-col justify-between p-6 sm:p-12 pointer-events-none select-none">
        {/* Top HUD bar */}
        <div className="flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CFFE16] animate-ping" />
            <span className="text-xs font-utility-mono uppercase tracking-widest text-[#CFFE16] font-bold">
              {stage === 'WORLD_A'
                ? 'SCENE 12 // IMMERSIVE WORLD A (SPLINE TUNNEL)'
                : stage === 'PORTAL'
                ? 'SCENE 13 // CONVERGING PORTAL TRANSITION'
                : 'SCENE 14 // IMMERSIVE WORLD B (SIGNAL BLUE CORRIDOR)'}
            </span>
          </div>

          <div className="text-xs font-utility-mono text-white/70 flex items-center gap-4">
            <span className="hidden sm:inline">DETERMINISTIC SPLINE</span>
            <span className="text-[#CFFE16] font-bold tabular-nums">
              PROGRESS: {(worldProgress * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Center Minimal Crosshair HUD */}
        <div className="mx-auto my-auto relative flex flex-col items-center justify-center opacity-40">
          <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#CFFE16] rounded-full" />
          </div>
          <div className="mt-3 text-[10px] font-utility-mono tracking-widest text-white/60">
            {stage === 'WORLD_A'
              ? 'CAMERA TRAVEL: CATMULL-ROM'
              : stage === 'PORTAL'
              ? 'OCCLUSION MASK: EMISSIVE WHITEOUT'
              : 'SHARED PERSISTENT OBJECT ACTIVE'}
          </div>
        </div>

        {/* Bottom Technical Telemetry */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-t border-white/10 pt-4 z-20">
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-editorial-sans font-bold uppercase tracking-tight text-white">
              {stage === 'WORLD_A'
                ? 'GEOMETRIC EXTRUSION WORLD'
                : stage === 'PORTAL'
                ? 'CROSSFADE CONVERGENCE'
                : 'COBALT GRAPHIC CORRIDOR'}
            </div>
            <div className="text-xs font-utility-mono text-white/50">
              REVERSIBLE SCRUBBING · POSITION DERIVED DETERMINISTICALLY FROM SCROLL PROGRESS
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-utility-mono text-[#CFFE16]">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
            <span>SCROLL UP OR DOWN TO REVERSE FLIGHT</span>
          </div>
        </div>
      </div>
    </section>
  );
};
