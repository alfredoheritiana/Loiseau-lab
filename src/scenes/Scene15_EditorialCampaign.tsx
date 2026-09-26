import React, { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';

export const Scene15_EditorialCampaign: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { setActiveScene, setNavTheme } = useExperience();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        setActiveScene('scene-15-campaign');
        setNavTheme('light');
      },
      onEnterBack: () => {
        setActiveScene('scene-15-campaign');
        setNavTheme('light');
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme]);

  return (
    <section
      id="scene-15-campaign"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#ECEEE5] text-[#181A17] p-6 sm:p-12 md:p-16 border-b border-[#181A17]/15 overflow-hidden select-none"
    >
      {/* Top Editorial Index */}
      <div className="flex items-center justify-between text-xs font-utility-mono uppercase tracking-widest text-[#181A17]/50 border-b border-[#181A17]/10 pb-4">
        <div>15 // LANDO EDITORIAL CAMPAIGN BENCHMARK</div>
        <div>STATIC POSTER COMPOSITION TEST</div>
      </div>

      {/* Main Massive Headline */}
      <div className="my-8">
        <h2 className="text-6xl sm:text-8xl md:text-9xl font-editorial-sans font-black tracking-tighter uppercase leading-[0.88] text-[#181A17]">
          CHAMPION <br />
          <span className="font-editorial-serif italic font-normal text-[#2140FF]">
            Architectures.
          </span>
        </h2>
      </div>

      {/* Asymmetric Poster Layout with Overlapping Media Items */}
      <div className="relative mt-8 min-h-[60vh] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Large Central Dominant Media Item */}
        <div className="lg:col-span-7 bg-[#1A1D18] text-[#ECEEE5] p-6 sm:p-8 border border-[#181A17]/20 shadow-2xl relative">
          <div className="flex justify-between items-center text-xs font-utility-mono text-white/50 border-b border-white/10 pb-3 mb-6">
            <span className="text-[#CFFE16] font-bold">PRIMARY POSTER ARTIFACT</span>
            <span>RATIO 16:10</span>
          </div>

          <div className="w-full h-72 sm:h-96 bg-[#10130F] border border-white/10 flex flex-col justify-between p-6 relative overflow-hidden">
            {/* Architectural diagonal graphic */}
            <div className="absolute -top-12 -right-12 w-64 h-64 border border-dashed border-[#CFFE16]/30 rounded-full pointer-events-none" />

            <div className="text-xs font-utility-mono text-[#CFFE16]">
              PERSISTENT OBJECT INTEGRATION
            </div>
            <div className="my-auto">
              <div className="text-3xl sm:text-4xl font-editorial-sans font-black uppercase tracking-tight text-white">
                NARRATIVE CONTINUITY
              </div>
              <p className="mt-2 text-sm text-white/70 font-editorial-serif italic">
                "The 3D icosahedral core transitions from the blue corridor directly into this editorial frame."
              </p>
            </div>
            <div className="flex justify-between text-[10px] font-utility-mono text-white/40">
              <span>CANVAS → DOM</span>
              <span>NO ABRUPT REMOVAL</span>
            </div>
          </div>
        </div>

        {/* Smaller Overlapping Media Fragments & Editorial Copy */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:-ml-12 relative z-10">
          {/* Overlapping Fragment 1 */}
          <div className="bg-[#2140FF] text-white p-6 shadow-xl border border-black/10 rotate-1">
            <div className="text-xs font-utility-mono text-[#CFFE16] mb-1">
              FRAGMENT 15-A
            </div>
            <div className="text-xl font-editorial-serif italic mb-2">
              Asymmetric Visual Hierarchy
            </div>
            <p className="text-xs font-sans text-white/80 leading-relaxed">
              Composition relies on intentional offsets and weight imbalance rather than repetitive symmetrical card columns.
            </p>
          </div>

          {/* Overlapping Fragment 2 */}
          <div className="bg-white text-[#181A17] p-6 shadow-xl border border-[#181A17]/20 -rotate-1">
            <div className="text-xs font-utility-mono text-[#181A17]/60 mb-1">
              TECHNICAL SPECIFICATION
            </div>
            <div className="text-sm font-utility-mono space-y-1 text-[#181A17]/80">
              <div>DOM ELEVATION: SINGLE-LEVEL</div>
              <div>TYPOGRAPHIC CONTRAST: 4.8×</div>
              <div className="text-[#2140FF] font-bold">ANTI-AI SLOP: VALIDATED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Editorial Caption */}
      <div className="mt-12 pt-6 border-t border-[#181A17]/10 flex flex-wrap justify-between text-xs font-utility-mono text-[#181A17]/50">
        <div>LANDO NORRIS ASYMMETRIC CAMPAIGN STRUCTURE</div>
        <div>TEST: SECTION LOOKS DESIGNED AS A STANDALONE POSTER</div>
      </div>
    </section>
  );
};
