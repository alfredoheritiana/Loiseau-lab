import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { SocialCardItem } from '../types';

const fanCards: SocialCardItem[] = [
  { id: 'sc1', tag: 'AERO // 01', headline: 'DOWNFORCE CURVES', meta: 'MONACO GP SPEC', theme: 'dark' },
  { id: 'sc2', tag: 'TELEMETRY', headline: '2.4G LATERAL LOAD', meta: 'HIGH SPEED SWEEP', theme: 'green' },
  { id: 'sc3', tag: 'COMPOSITE', headline: 'PRE-PREG CARBON', meta: 'AUTOCLAVE CURED', theme: 'dark' },
  { id: 'sc4', tag: 'MOTION', headline: 'DETERMINISTIC FLIGHT', meta: 'CAMERA SPLINE', theme: 'blue' },
  { id: 'sc5', tag: 'KINETIC', headline: 'SUSPENSION ARMS', meta: 'TORSION GEOMETRY', theme: 'dark' },
  { id: 'sc6', tag: 'PHYSICS', headline: 'INSTANCED PARTICLES', meta: 'REPULSION SIM', theme: 'green' },
  { id: 'sc7', tag: 'CHOREOGRAPHY', headline: 'SCROLL AS TIME', meta: 'TIME DILATION', theme: 'white' },
];

export const Scene16_SocialFan: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [fanProgress, setFanProgress] = useState(0);

  const { setActiveScene, setNavTheme, inputsRef } = useExperience();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onEnter: () => {
          setActiveScene('scene-16-social-fan');
          setNavTheme('dark');
        },
        onEnterBack: () => {
          setActiveScene('scene-16-social-fan');
          setNavTheme('dark');
        },
        onUpdate: (self) => {
          const p = self.progress;
          setFanProgress(p);
          if (inputsRef.current) {
            inputsRef.current.sceneProgress.socialFan = p;
          }
        },
      },
    });

    const isMobile = window.innerWidth < 768;
    const maxSpread = isMobile ? 120 : 380;
    const maxAngle = isMobile ? 12 : 24;

    cards.forEach((card, index) => {
      const normalizedIndex = (index - (cards.length - 1) / 2) / ((cards.length - 1) / 2);
      const targetX = normalizedIndex * maxSpread;
      const targetRotation = normalizedIndex * maxAngle;
      const targetY = Math.abs(normalizedIndex) * (isMobile ? 25 : 45);

      // Initial state: stacked near center/bottom
      gsap.set(card, {
        x: 0,
        y: 120,
        rotation: 0,
        scale: 0.9,
      });

      // Scrubbed fan spread
      tl.to(
        card,
        {
          x: targetX,
          y: targetY,
          rotation: targetRotation,
          scale: 1,
          ease: 'power2.out',
        },
        0
      );
    });

    return () => {
      tl.kill();
    };
  }, [setActiveScene, setNavTheme, inputsRef]);

  return (
    <section
      id="scene-16-social-fan"
      ref={containerRef}
      className="relative w-full h-[220vh] bg-[#090B08] text-[#ECEEE5] overflow-hidden"
    >
      {/* Sticky Fan Arena */}
      <div className="sticky top-0 w-full h-screen flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between text-xs font-utility-mono uppercase tracking-widest text-white/50 z-20">
          <div>
            <span className="text-[#CFFE16]">16</span> // LANDO SOCIAL CARD FAN BENCHMARK
          </div>
          <div className="text-[#CFFE16]">
            FAN EXPANSION: {(fanProgress * 100).toFixed(0)}%
          </div>
        </div>

        {/* Center Title */}
        <div className="my-auto text-center z-10 select-none">
          <div className="text-xs font-utility-mono text-[#CFFE16] uppercase tracking-widest mb-2">
            STACK TO HORIZONTAL FAN
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-editorial-sans font-black uppercase tracking-tight text-white">
            CHOREOGRAPHED SPREAD.
          </h2>
          <p className="mt-2 text-sm font-editorial-serif italic text-white/60">
            Scroll drives rotation, elevation, and lateral separation.
          </p>
        </div>

        {/* The Card Fan Stack (positioned in lower-center arena) */}
        <div className="relative w-full flex items-center justify-center pb-24 z-20 pointer-events-auto">
          {fanCards.map((card, idx) => {
            const isGreen = card.theme === 'green';
            const isBlue = card.theme === 'blue';
            const isWhite = card.theme === 'white';

            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className={`absolute w-44 sm:w-56 h-64 sm:h-80 p-5 rounded-xl border flex flex-col justify-between shadow-2xl transition-shadow hover:shadow-[0_0_30px_rgba(207,254,22,0.3)] cursor-pointer select-none ${
                  isGreen
                    ? 'bg-[#CFFE16] text-[#080808] border-[#CFFE16]'
                    : isBlue
                    ? 'bg-[#2140FF] text-white border-[#2140FF]'
                    : isWhite
                    ? 'bg-white text-[#080808] border-white'
                    : 'bg-[#151913] text-[#ECEEE5] border-white/20'
                }`}
                style={{ zIndex: 10 + idx }}
              >
                {/* Card Top */}
                <div className="flex justify-between items-center text-[10px] font-utility-mono font-bold">
                  <span>{card.tag}</span>
                  <span>#{idx + 1}</span>
                </div>

                {/* Card Center Graphic */}
                <div className="my-auto">
                  <div className="text-lg sm:text-xl font-editorial-sans font-black uppercase tracking-tight leading-tight">
                    {card.headline}
                  </div>
                </div>

                {/* Card Bottom */}
                <div className="flex justify-between items-center text-[10px] font-utility-mono pt-3 border-t border-current/20">
                  <span>{card.meta}</span>
                  <span>REF-00</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="flex justify-between text-[11px] font-utility-mono text-white/40 border-t border-white/10 pt-4 z-20">
          <span>RESPONSIVE FAN SPREAD ADAPTED FOR TOUCH</span>
          <span>DOM-DRIVEN GSAP TIMELINE · NO WEBGL OVERHEAD</span>
        </div>
      </div>
    </section>
  );
};
