import React, { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { useScroll } from '../context/ScrollContext';
import { ArrowUp } from 'lucide-react';

export const Scene18_Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const { setActiveScene, setNavTheme } = useExperience();
  const { scrollTo } = useScroll();

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom bottom',
      onEnter: () => {
        setActiveScene('scene-18-footer');
        setNavTheme('light');
      },
      onEnterBack: () => {
        setActiveScene('scene-18-footer');
        setNavTheme('light');
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme]);

  return (
    <footer
      id="scene-18-footer"
      ref={footerRef}
      className="relative w-full bg-[#ECEEE5] text-[#181A17] p-8 sm:p-14 md:p-20 select-none z-10"
    >
      {/* Top Header of Footer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#181A17]/15 pb-12 mb-12">
        <div>
          <div className="text-xs font-utility-mono text-[#2140FF] uppercase tracking-widest mb-1 font-semibold">
            18 // CALM ARCHIVAL FOOTER
          </div>
          <h2 className="text-4xl sm:text-5xl font-editorial-sans font-black uppercase tracking-tight text-[#181A17]">
            LOISEAU — REF LAB 00
          </h2>
          <p className="mt-2 text-sm text-[#181A17]/70 font-editorial-serif italic max-w-lg">
            A technical benchmark proving the integration of Lusion.co WebGL spatial choreography and LandoNorris.com editorial art direction.
          </p>
        </div>

        <button
          onClick={() => scrollTo(0)}
          className="flex items-center gap-2 text-xs font-utility-mono uppercase tracking-wider text-[#181A17] border border-[#181A17]/30 px-4 py-2 hover:bg-[#181A17] hover:text-[#ECEEE5] transition-colors cursor-pointer"
          aria-label="Back to Top"
        >
          <span>RETURN TO TOP</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Structured Benchmark Specifications Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs font-utility-mono text-[#181A17]/80">
        {/* Col 1: Lusion Systems */}
        <div className="space-y-3">
          <div className="font-bold text-[#181A17] uppercase tracking-wider border-b border-[#181A17]/10 pb-1">
            LUSION SYSTEMS
          </div>
          <ul className="space-y-1.5 text-[#181A17]/70">
            <li>· Persistent Canvas Engine</li>
            <li>· Instanced Pointer Physics</li>
            <li>· DOM-Tracked Deformable Mesh</li>
            <li>· Camera Spline Scrubbing</li>
            <li>· Seamless World Crossfades</li>
            <li>· Persistent Shared 3D Element</li>
          </ul>
        </div>

        {/* Col 2: Lando Systems */}
        <div className="space-y-3">
          <div className="font-bold text-[#181A17] uppercase tracking-wider border-b border-[#181A17]/10 pb-1">
            LANDO SYSTEMS
          </div>
          <ul className="space-y-1.5 text-[#181A17]/70">
            <li>· Media-Dominant Hero</li>
            <li>· Framed Media & Giant Marquee</li>
            <li>· Vector Gesture Signature</li>
            <li>· High-Contrast Serif / Sans</li>
            <li>· Asymmetric Poster Collage</li>
            <li>· 12+ Object Hall of Fame Grid</li>
            <li>· Interactive Social Fan</li>
          </ul>
        </div>

        {/* Col 3: Performance & Architecture */}
        <div className="space-y-3">
          <div className="font-bold text-[#181A17] uppercase tracking-wider border-b border-[#181A17]/10 pb-1">
            PERFORMANCE & RUNTIME
          </div>
          <ul className="space-y-1.5 text-[#181A17]/70">
            <li>· Lenis + GSAP Ticker Lock</li>
            <li>· Zero GC Allocations in useFrame</li>
            <li>· Adaptive Quality Tiers (H/M/L)</li>
            <li>· ResizeObserver Coordinate Cache</li>
            <li>· ACES Filmic Tone Mapping</li>
            <li>· Dynamic DPR Capping</li>
          </ul>
        </div>

        {/* Col 4: Accessibility & Standards */}
        <div className="space-y-3">
          <div className="font-bold text-[#181A17] uppercase tracking-wider border-b border-[#181A17]/10 pb-1">
            ACCESSIBILITY & SPECS
          </div>
          <ul className="space-y-1.5 text-[#181A17]/70">
            <li>· prefers-reduced-motion Support</li>
            <li>· Semantic Landmarks & Headings</li>
            <li>· Escape Keyboard Handlers</li>
            <li>· Zero Broken Image Guarantee</li>
            <li>· 200% Zoom Responsive Layout</li>
            <li>· Anti-AI Slop Layout Restraint</li>
          </ul>
        </div>
      </div>

      {/* Bottom Quiet Legal & Versioning */}
      <div className="mt-16 pt-6 border-t border-[#181A17]/15 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-utility-mono text-[#181A17]/50">
        <div>LOISEAU BENCHMARK LAB — LABORATORY ARTIFACT ONLY</div>
        <div>NO PROPRIETARY ASSETS USED · PROCEDURAL SYNTHESIS</div>
      </div>
    </footer>
  );
};
