import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';

export const Scene08_EditorialCollage: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const block1Ref = useRef<HTMLDivElement>(null);
  const block2Ref = useRef<HTMLDivElement>(null);
  const block3Ref = useRef<HTMLDivElement>(null);
  const block4Ref = useRef<HTMLDivElement>(null);

  const { setActiveScene, setNavTheme } = useExperience();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Parallax timeline on the collage elements
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onEnter: () => {
          setActiveScene('scene-08-collage');
          setNavTheme('dark');
        },
        onEnterBack: () => {
          setActiveScene('scene-08-collage');
          setNavTheme('light');
        },
        onUpdate: (self) => {
          // Transition theme smoothly from dark to light at progress > 0.45
          if (self.progress > 0.45) {
            setNavTheme('light');
          } else {
            setNavTheme('dark');
          }
        },
      },
    });

    if (block1Ref.current) {
      tl.to(block1Ref.current, { y: -180, rotate: -2, ease: 'none' }, 0);
    }
    if (block2Ref.current) {
      tl.to(block2Ref.current, { y: -320, rotate: 3, ease: 'none' }, 0);
    }
    if (block3Ref.current) {
      tl.to(block3Ref.current, { y: -220, rotate: -1.5, ease: 'none' }, 0);
    }
    if (block4Ref.current) {
      tl.to(block4Ref.current, { y: -400, rotate: 2, ease: 'none' }, 0);
    }

    return () => {
      tl.kill();
    };
  }, [setActiveScene, setNavTheme]);

  return (
    <section
      id="scene-08-collage"
      ref={containerRef}
      className="relative w-full min-h-[220vh] bg-gradient-to-b from-[#080808] via-[#141613] to-[#ECEEE5] text-[#ECEEE5] overflow-hidden"
    >
      {/* Sticky Background Title */}
      <div className="sticky top-20 w-full px-8 sm:px-14 md:px-20 z-0 pointer-events-none select-none">
        <div className="text-xs font-utility-mono text-[#CFFE16] uppercase tracking-widest mb-2">
          08 // EDITORIAL COLLAGE & PARALLAX
        </div>
        <h2 className="text-6xl sm:text-8xl md:text-9xl font-editorial-sans font-black tracking-tighter uppercase text-white/10 leading-none">
          ASYMMETRY
        </h2>
      </div>

      {/* Floating Parallax Collage Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-32 space-y-40">
        {/* Block 1: Medium landscape item */}
        <div className="flex justify-start">
          <div
            ref={block1Ref}
            data-depth="0.2"
            className="w-full sm:w-[480px] bg-[#161A14] border border-white/20 p-5 shadow-2xl rotate-[-1deg]"
          >
            <div className="w-full h-56 bg-[#0E110D] border border-white/10 relative overflow-hidden flex items-center justify-center">
              {/* Technical procedural art */}
              <div className="text-center p-4">
                <div className="text-xs font-utility-mono text-[#CFFE16]">FRAGMENT 08-A</div>
                <div className="text-2xl font-editorial-serif italic text-white">Aerodynamic Flow</div>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-xs font-utility-mono text-white/50">
              <span>SCALE: 1.0</span>
              <span className="text-[#CFFE16]">DEPTH: 0.2</span>
            </div>
          </div>
        </div>

        {/* Block 2: Large dominant portrait item overlapping right */}
        <div className="flex justify-end">
          <div
            ref={block2Ref}
            data-depth="0.5"
            className="w-full sm:w-[420px] bg-[#181C15] border border-white/20 p-6 shadow-2xl rotate-[2deg]"
          >
            <div className="w-full h-72 bg-[#0B0D0A] border border-white/10 relative flex flex-col justify-between p-4">
              <span className="text-[10px] font-utility-mono text-[#CFFE16]">PLATE IDENTIFIER // 08-B</span>
              <div className="my-auto text-center">
                <div className="text-3xl font-editorial-sans font-black text-white uppercase tracking-tighter">
                  STRUCTURAL
                </div>
                <div className="text-sm font-editorial-serif italic text-white/70">
                  Suspension geometry
                </div>
              </div>
              <span className="text-[10px] font-utility-mono text-white/40 text-right">COORD: REF-LN-4</span>
            </div>
            <div className="mt-3 flex justify-between text-xs font-utility-mono text-white/60">
              <span>OVERLAP ANCHOR</span>
              <span className="text-[#CFFE16]">SPEED: 1.4×</span>
            </div>
          </div>
        </div>

        {/* Block 3: Small accented note card (persists into light section) */}
        <div className="flex justify-center sm:justify-start sm:pl-32">
          <div
            ref={block3Ref}
            data-depth="0.3"
            className="w-full sm:w-[360px] bg-[#22281D] text-white border border-[#CFFE16]/50 p-5 shadow-2xl rotate-[-2deg]"
          >
            <div className="text-xs font-utility-mono text-[#CFFE16] tracking-widest uppercase mb-1">
              THEME TRANSITION LIAISON
            </div>
            <div className="text-lg font-editorial-serif italic mb-2">
              "Seamless environment shift from obsidian night to travertine day."
            </div>
            <div className="text-[11px] font-utility-mono text-white/60 border-t border-white/10 pt-2 flex justify-between">
              <span>DARK → LIGHT GRADIENT</span>
              <span className="text-[#CFFE16]">PERSISTENT</span>
            </div>
          </div>
        </div>

        {/* Block 4: Broad widescreen canvas in lower light zone */}
        <div className="flex justify-center">
          <div
            ref={block4Ref}
            data-depth="0.6"
            className="w-full max-w-2xl bg-white text-[#181A17] border border-[#181A17]/20 p-6 shadow-2xl rotate-[1deg]"
          >
            <div className="w-full h-48 bg-[#ECEEE5] border border-[#181A17]/10 flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-xs font-utility-mono text-[#181A17]/50 uppercase tracking-widest mb-1">
                  LIGHT ENVIRONMENT MANIFEST
                </div>
                <div className="text-2xl sm:text-3xl font-editorial-sans font-extrabold uppercase tracking-tight text-[#181A17]">
                  EDITORIAL PURITY REACHED.
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-xs font-utility-mono text-[#181A17]/60">
              <span>COLLAGE CLOSURE</span>
              <span className="font-bold text-[#181A17]">NO BENTO CLONES</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
