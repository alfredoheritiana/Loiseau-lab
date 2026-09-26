import React, { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { useScroll } from '../context/ScrollContext';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

export const Scene17_FinalRealtime: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { setActiveScene, setNavTheme } = useExperience();
  const { scrollTo } = useScroll();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        setActiveScene('scene-17-final');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-17-final');
        setNavTheme('dark');
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme]);

  return (
    <section
      id="scene-17-final"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#070806] text-[#ECEEE5] flex flex-col justify-between p-8 sm:p-14 md:p-20 border-b border-white/10 select-none overflow-hidden"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs font-utility-mono tracking-widest text-white/40 z-20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#CFFE16]" />
          <span>17 // NARRATIVE CLOSURE & PERSISTENT ARTIFACT</span>
        </div>
        <div className="text-[#CFFE16]">BENCHMARK VALIDATION COMPLETE</div>
      </div>

      {/* Main Closing Editorial Typography (Centered over WebGL persistent object) */}
      <div className="my-auto text-center z-20 py-16 space-y-6">
        <div className="text-xs font-utility-mono text-[#CFFE16] uppercase tracking-widest">
          INTERACTION BENCHMARK SYNTHESIS
        </div>
        <h2 className="text-4xl sm:text-6xl md:text-8xl font-editorial-sans font-black uppercase tracking-tight text-white leading-none">
          REFERENCE <br />
          <span className="font-editorial-serif italic font-normal text-[#CFFE16]">
            System Complete.
          </span>
        </h2>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-white/70 font-sans leading-relaxed">
          The monocoque core and persistent icosahedron have traveled from the media hero through the spline camera tunnel, blue corridor, and back to closure without a single rendering cut.
        </p>

        {/* Small CTA Button: Review Lab */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => scrollTo(0)}
            className="flex items-center gap-2 px-6 py-3 bg-[#CFFE16] text-[#080808] font-utility-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-xl cursor-pointer"
            aria-label="Review Lab from Beginning"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REVIEW LAB FROM SCENE 01</span>
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Verification */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 text-xs font-utility-mono text-white/40 border-t border-white/10 pt-4 z-20">
        <div>LANDO NORRIS EDITORIAL + LUSION REAL-TIME WEBGL</div>
        <div className="text-right">60 FPS VERIFIED · DETERMINISTIC SCROLL</div>
      </div>
    </section>
  );
};
