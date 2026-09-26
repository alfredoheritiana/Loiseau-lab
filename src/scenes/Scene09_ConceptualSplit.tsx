import React, { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { ArrowLeftRight } from 'lucide-react';

export const Scene09_ConceptualSplit: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const { setActiveScene, setNavTheme } = useExperience();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        setActiveScene('scene-09-split');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-09-split');
        setNavTheme('dark');
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme]);

  return (
    <section
      id="scene-09-split"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#080808] text-[#ECEEE5] flex flex-col justify-between border-b border-white/10 select-none overflow-hidden"
    >
      {/* Top Split Header */}
      <div className="flex items-center justify-between p-6 md:px-12 border-b border-white/10 z-20">
        <div className="flex items-center gap-3 text-xs font-utility-mono text-white/50">
          <span className="text-[#CFFE16]">09</span>
          <span>CONCEPTUAL TERRITORY SPLIT</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-utility-mono text-[#CFFE16]">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>TAXONOMY INTO BRAND COMPOSITION</span>
        </div>
      </div>

      {/* Main Full-Viewport Dual Split */}
      <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-[75vh]">
        {/* Territory A: SYSTEM (Structured / Architectural / Technical) */}
        <div
          onMouseEnter={() => setActiveSide('left')}
          onMouseLeave={() => setActiveSide(null)}
          className={`relative group flex flex-col justify-between p-8 sm:p-14 transition-colors duration-500 cursor-pointer overflow-hidden ${
            activeSide === 'left' ? 'bg-[#10140E]' : 'bg-[#0B0D0A]'
          }`}
        >
          {/* Subtle background technical grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#CFFE16_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

          {/* Territory Header */}
          <div className="relative z-10 flex justify-between items-baseline text-xs font-utility-mono text-white/60">
            <span>TERRITORY 01 // PRECISION</span>
            <span className="text-[#CFFE16]">ORTHOGONAL</span>
          </div>

          {/* Core Graphic Visual Object: Architectural Wireframe Blueprint */}
          <div className="relative z-10 my-auto py-12 flex flex-col items-center">
            <div className="w-52 h-52 sm:w-64 sm:h-64 border-2 border-white/20 relative flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
              <div className="absolute inset-3 border border-white/10" />
              <div className="absolute inset-8 border border-dashed border-[#CFFE16]/50" />
              <div className="w-16 h-16 border-2 border-[#CFFE16] rotate-45 transition-transform duration-700 group-hover:rotate-90" />
              <span className="absolute bottom-2 right-2 text-[9px] font-utility-mono text-white/40">CALIBRATED</span>
            </div>
            <h3 className="mt-8 text-5xl sm:text-6xl md:text-7xl font-editorial-sans font-black tracking-tighter uppercase text-white group-hover:text-[#CFFE16] transition-colors">
              SYSTEM
            </h3>
          </div>

          {/* Territory Footer */}
          <div className="relative z-10 text-xs font-utility-mono text-white/50 border-t border-white/10 pt-4 flex justify-between">
            <span>METHODOLOGY · SPECIFICATION</span>
            <span>01 // STRUCTURAL</span>
          </div>
        </div>

        {/* Territory B: EXPRESSION (Organic / Fluid / Human) */}
        <div
          onMouseEnter={() => setActiveSide('right')}
          onMouseLeave={() => setActiveSide(null)}
          className={`relative group flex flex-col justify-between p-8 sm:p-14 transition-colors duration-500 cursor-pointer overflow-hidden ${
            activeSide === 'right' ? 'bg-[#141217]' : 'bg-[#0E0C10]'
          }`}
        >
          {/* Subtle noise/gradient background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#2140FF]/10 via-transparent to-[#CFFE16]/5 pointer-events-none" />

          {/* Territory Header */}
          <div className="relative z-10 flex justify-between items-baseline text-xs font-utility-mono text-white/60">
            <span>TERRITORY 02 // INTUITION</span>
            <span className="text-[#2140FF] font-bold">CHROMATIC</span>
          </div>

          {/* Core Graphic Visual Object: Organic Fluid Curves */}
          <div className="relative z-10 my-auto py-12 flex flex-col items-center">
            <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full border-2 border-white/20 relative flex items-center justify-center transition-transform duration-700 group-hover:scale-105 overflow-hidden bg-gradient-to-br from-[#2140FF]/20 to-[#CFFE16]/20">
              <div className="w-36 h-36 rounded-full border border-white/30 animate-pulse" />
              <div className="absolute text-3xl font-editorial-serif italic text-white/90">
                Gestural
              </div>
            </div>
            <h3 className="mt-8 text-5xl sm:text-6xl md:text-7xl font-editorial-serif italic font-normal tracking-tight text-white group-hover:text-[#CFFE16] transition-colors">
              Expression
            </h3>
          </div>

          {/* Territory Footer */}
          <div className="relative z-10 text-xs font-utility-mono text-white/50 border-t border-white/10 pt-4 flex justify-between">
            <span>NARRATIVE · EMOTION</span>
            <span>02 // VISUAL</span>
          </div>
        </div>
      </div>

      {/* Bottom Center Indicator */}
      <div className="text-center py-3 border-t border-white/10 text-[11px] font-utility-mono text-white/40">
        NO FLOATING CARDS — FULL VIEWPORT SPLIT REPRODUCING ON TRACK / OFF TRACK ARCHITECTURE
      </div>
    </section>
  );
};
