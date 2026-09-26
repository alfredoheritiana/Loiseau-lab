import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { Maximize2 } from 'lucide-react';

export const Scene11_CardToFullscreen: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const surroundingTextRef = useRef<HTMLDivElement>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);

  const { setActiveScene, setNavTheme, inputsRef } = useExperience();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onEnter: () => {
        setActiveScene('scene-11-fullscreen-card');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-11-fullscreen-card');
        setNavTheme('dark');
      },
      onUpdate: (self) => {
        const p = self.progress;
        setTransitionProgress(p);
        if (inputsRef.current) {
          inputsRef.current.sceneProgress.cardFullscreen = p;
        }

        // Interpolate card transformation: scale to 100vw / 100vh, radius to 0, fade surrounding DOM
        if (cardRef.current) {
          const scale = THREE_lerp(1.0, 2.6, p);
          const radius = Math.max(0, 16 * (1 - p * 1.5));
          cardRef.current.style.transform = `scale(${scale})`;
          cardRef.current.style.borderRadius = `${radius}px`;
          cardRef.current.style.opacity = `${Math.max(0.2, 1 - p * 0.8)}`;
        }

        if (surroundingTextRef.current) {
          surroundingTextRef.current.style.opacity = `${Math.max(0, 1 - p * 2.2)}`;
          surroundingTextRef.current.style.transform = `translateY(${-p * 100}px)`;
        }

        if (p > 0.85) {
          setActiveScene('scene-12-world-a');
          setNavTheme('immersive');
        } else {
          setActiveScene('scene-11-fullscreen-card');
          setNavTheme('dark');
        }
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme, inputsRef]);

  function THREE_lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  return (
    <section
      id="scene-11-fullscreen-card"
      ref={containerRef}
      className="relative w-full h-[250vh] bg-[#070807] text-[#ECEEE5] overflow-hidden"
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 w-full h-screen flex flex-col justify-between p-6 sm:p-12 items-center overflow-hidden">
        {/* Surrounding Editorial DOM (fades out as card expands) */}
        <div
          ref={surroundingTextRef}
          className="relative z-20 w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 transition-transform select-none"
        >
          <div>
            <div className="text-xs font-utility-mono text-[#CFFE16] uppercase tracking-widest mb-1">
              11 // CRITICAL BENCHMARK — CARD TO FULLSCREEN PORTAL
            </div>
            <h2 className="text-3xl sm:text-5xl font-editorial-sans font-black uppercase tracking-tight text-white">
              PORTAL INITIATION.
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-utility-mono text-white/60">
            <Maximize2 className="w-3.5 h-3.5 text-[#CFFE16]" />
            <span>CONTINUOUS EXPANSION INTO WEBGL WORLD</span>
          </div>
        </div>

        {/* The Morphing Card (expands smoothly into full viewport) */}
        <div className="relative z-10 my-auto flex items-center justify-center pointer-events-auto">
          <div
            ref={cardRef}
            className="w-[82vw] sm:w-[500px] h-[50vh] sm:h-[340px] bg-[#121610] border border-white/30 shadow-2xl overflow-hidden flex flex-col justify-between p-6 will-change-transform relative"
            style={{ borderRadius: '16px' }}
          >
            {/* Card Internal UI */}
            <div className="flex justify-between items-center text-xs font-utility-mono text-white/70 border-b border-white/10 pb-3">
              <span className="text-[#CFFE16] font-bold">LUSION SPATIAL PORTAL</span>
              <span>DEPTH 0.0 → 1.0</span>
            </div>

            {/* Glowing wireframe tunnel preview inside card */}
            <div className="my-auto text-center space-y-2 pointer-events-none">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-[#CFFE16] animate-spin flex items-center justify-center" style={{ animationDuration: '10s' }}>
                <div className="w-6 h-6 rounded-full bg-[#CFFE16]/40" />
              </div>
              <div className="text-sm font-editorial-serif italic text-white/90">
                "Card bounds expand to dissolve viewport boundary."
              </div>
            </div>

            {/* Card Bottom Metadata */}
            <div className="flex justify-between items-center text-[10px] font-utility-mono text-white/50 border-t border-white/10 pt-2">
              <span>TARGET: IMMERSIVE WORLD A</span>
              <span className="text-[#CFFE16]">SCRUB: {(transitionProgress * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Caption */}
        <div className="relative z-20 w-full text-center text-xs font-utility-mono text-white/40 pb-2 select-none">
          SCROLL SCRUB EXPANDS CARD TO COVER ENTIRE VIEWPORT BEFORE ENTERING CAMERA SPLINE
        </div>
      </div>
    </section>
  );
};
