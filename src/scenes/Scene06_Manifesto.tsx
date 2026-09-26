import React, { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';

export const Scene06_Manifesto: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { setActiveScene, setNavTheme } = useExperience();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        setActiveScene('scene-06-manifesto');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-06-manifesto');
        setNavTheme('dark');
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme]);

  return (
    <section
      id="scene-06-manifesto"
      ref={sectionRef}
      className="relative w-full min-h-screen bg-[#080808] text-[#ECEEE5] flex flex-col justify-between p-8 sm:p-14 md:p-20 border-b border-white/10 select-none"
    >
      {/* Top Editorial Index Marker */}
      <div className="flex items-center justify-between text-xs font-utility-mono tracking-widest text-white/40">
        <div>06 // EDITORIAL POSTER MANIFESTO</div>
        <div className="text-[#CFFE16]">SCALE RATIO 6.4 : 1.0</div>
      </div>

      {/* Main Poster Typography (High-contrast Sans & Serif pairing) */}
      <div className="my-auto py-12 max-w-6xl">
        <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-editorial-sans font-black uppercase tracking-tighter leading-[0.92] text-white">
          MOTION <br />
          <span className="font-editorial-serif italic font-normal text-[#CFFE16]">
            Should Mean
          </span>{' '}
          <br />
          SOMETHING.
        </h2>

        {/* Serif Interruption & Micro Notes */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-end border-t border-white/10 pt-8">
          <div className="md:col-span-8">
            <p className="text-xl sm:text-2xl font-editorial-serif italic text-white/80 leading-snug">
              Every transition must preserve spatial truth. When elements move, they carry inertia, weight, and narrative continuity.
            </p>
          </div>
          <div className="md:col-span-4 text-xs font-utility-mono text-white/50 space-y-1">
            <div>PRIMARY: SANS BLACK 900</div>
            <div>COUNTERPOINT: SERIF ITALIC 400</div>
            <div className="text-[#CFFE16]">STATIC POSTER INTEGRITY: VERIFIED</div>
          </div>
        </div>
      </div>

      {/* Bottom Rules */}
      <div className="flex items-center justify-between text-[11px] font-utility-mono text-white/30 pt-4">
        <div>REFERENCE ARCHITECTURE — LANDO NORRIS</div>
        <div>NO DECORATIVE 3D IN POSTER ZONE</div>
      </div>
    </section>
  );
};
