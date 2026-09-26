import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { ArrowDown } from 'lucide-react';
import { FLIP_IDS } from '../motion/flipIds';

export const Scene02_03_Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sharedMediaFrameRef = useRef<HTMLDivElement>(null);
  const { setActiveScene, setNavTheme, inputsRef, appMode, introPhase } = useExperience();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onEnter: () => {
        setActiveScene('scene-02-hero');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-02-hero');
        setNavTheme('dark');
      },
      onUpdate: (self) => {
        const p = self.progress;
        if (inputsRef.current) {
          inputsRef.current.sceneProgress.hero = p;
          // Scene 03 is the transition range (0.5 to 1.0)
          inputsRef.current.sceneProgress.transition = Math.max(0, Math.min(1, (p - 0.45) / 0.55));
        }

        if (p > 0.5) {
          setActiveScene('scene-03-transition');
        } else {
          setActiveScene('scene-02-hero');
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [setActiveScene, setNavTheme, inputsRef]);

  const isBenchmark = appMode === 'benchmark';
  const isHeroVisible = introPhase === 'settling' || introPhase === 'ready';

  return (
    <section
      id="scene-02-hero"
      ref={containerRef}
      className="relative w-full h-[220vh] bg-transparent text-[#ECEEE5]"
    >
      {/* Sticky Hero Viewport (100vh) */}
      <div className="sticky top-0 w-full h-screen flex flex-col justify-between p-6 md:p-12 pointer-events-none">
        {/* Subtle technical background grid indicators (dimmed in presentation, slightly pronounced in benchmark) */}
        <div
          className={`absolute inset-0 grid grid-cols-6 md:grid-cols-12 pointer-events-none border-b border-white/10 transition-opacity duration-500 ${
            isHeroVisible ? (isBenchmark ? 'opacity-25' : 'opacity-10') : 'opacity-0'
          }`}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-white/10 h-full" />
          ))}
        </div>

        {/* Top Utility Layer */}
        <div
          className={`relative z-10 flex items-start justify-between text-xs font-utility-mono tracking-widest text-white/50 pt-16 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[60ms] ${
            isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
          }`}
        >
          <div className="space-y-1">
            <div className="text-[#CFFE16] font-bold">
              {isBenchmark ? 'BENCHMARK 01 // 02' : 'LOISEAU REFERENCE LAB'}
            </div>
            <div className="text-[11px] text-white/70">
              {isBenchmark ? 'MONOCOQUE PHYSICAL KNOT' : 'INTERACTIVE SPATIAL ENGINE'}
            </div>
          </div>

          <div className="text-right space-y-1 hidden sm:block">
            {isBenchmark ? (
              <>
                <div>COORDINATES: 52°22'N 0°54'W</div>
                <div className="text-[#CFFE16]">PHYSICS ENGINE: INSTANCED REPULSION</div>
              </>
            ) : (
              <div>BENCHMARK PROTOTYPE 00</div>
            )}
          </div>
        </div>

        {/* Center Target Frame for Scene 03 Shared Element Transition & Loader Handoff */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-xl h-72 sm:h-96 flex items-center justify-center">
          <div
            ref={sharedMediaFrameRef}
            data-flip-id={FLIP_IDS.FRAME}
            className={`w-full h-full relative flex items-center justify-center transition-all duration-500 pointer-events-auto ${
              isBenchmark
                ? 'border border-white/20 bg-white/[0.02]'
                : 'border border-white/10 hover:border-[#CFFE16]/30'
            }`}
          >
            {/* Corner crosshairs (connecting directly from the loader's exit geometry via GSAP Flip) */}
            <div
              data-flip-id={FLIP_IDS.CORNER_TL}
              className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#CFFE16] transition-transform group-hover:scale-110"
            />
            <div
              data-flip-id={FLIP_IDS.CORNER_TR}
              className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#CFFE16] transition-transform group-hover:scale-110"
            />
            <div
              data-flip-id={FLIP_IDS.CORNER_BL}
              className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#CFFE16] transition-transform group-hover:scale-110"
            />
            <div
              data-flip-id={FLIP_IDS.CORNER_BR}
              className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#CFFE16] transition-transform group-hover:scale-110"
            />

            {/* Subtle metadata tags inside frame */}
            {isBenchmark && (
              <>
                <div className="absolute top-3 left-3 text-[10px] font-utility-mono text-white/40 tracking-wider">
                  DOM/WEBGL SHARED BOUNDS
                </div>
                <div className="absolute bottom-3 right-3 text-[10px] font-utility-mono text-[#CFFE16] tracking-wider">
                  [DRAG POINTER TO DISPLACE]
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Editorial Meta Information: Safely revealed from below without ANY accidental clipping */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-4">
          <div className="space-y-1">
            <div
              className={`text-[11px] font-utility-mono text-[#CFFE16] tracking-wider uppercase transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[120ms] ${
                isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              EDITORIAL BENCHMARK
            </div>
            <div className="overflow-hidden py-1">
              <h1
                className={`text-3xl sm:text-5xl md:text-6xl font-editorial-sans font-extrabold tracking-tighter uppercase leading-none transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[200ms] ${
                  isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                PHYSICAL PRESENCE.
              </h1>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 text-xs font-utility-mono text-white/50 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[280ms] ${
              isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <span className="animate-pulse text-[#CFFE16]">●</span>
            <span>SCROLL TO ADVANCE SEQUENCE</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#CFFE16] animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};
