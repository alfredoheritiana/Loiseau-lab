import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { RiveSignature } from '../components/RiveSignature';

export const Scene04_05_FramedMarquee: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const marqueeReverseRef = useRef<HTMLDivElement>(null);
  const [localProgress, setLocalProgress] = useState(0);

  const { setActiveScene, setNavTheme, inputsRef } = useExperience();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      onEnter: () => {
        setActiveScene('scene-04-marquee');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-04-marquee');
        setNavTheme('dark');
      },
      onUpdate: (self) => {
        const p = self.progress;
        setLocalProgress(p);
        if (inputsRef.current) {
          inputsRef.current.sceneProgress.marquee = p;
          inputsRef.current.sceneProgress.rive = p;
        }

        // Marquee horizontal translation scrubbed with scroll
        if (marqueeTrackRef.current) {
          const shift = -p * 600;
          marqueeTrackRef.current.style.transform = `translate3d(${shift}px, 0, 0)`;
        }
        if (marqueeReverseRef.current) {
          const shiftReverse = (p - 0.5) * 500;
          marqueeReverseRef.current.style.transform = `translate3d(${shiftReverse}px, 0, 0)`;
        }

        if (p > 0.45) {
          setActiveScene('scene-05-rive');
        } else {
          setActiveScene('scene-04-marquee');
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [setActiveScene, setNavTheme, inputsRef]);

  return (
    <section
      id="scene-04-marquee"
      ref={containerRef}
      className="relative w-full h-[220vh] bg-[#0A0C09] text-[#ECEEE5] overflow-hidden"
    >
      <div className="sticky top-0 w-full h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Top & Bottom Hairline Section Dividers */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />

        {/* Subtle section label */}
        <div className="absolute top-8 left-8 md:left-16 z-30 text-xs font-utility-mono tracking-widest text-white/50">
          <span className="text-[#CFFE16]">04 // 05</span> · EDITORIAL MARQUEE & VECTOR GESTURE
        </div>

        {/* LAYER 1 (BEHIND MEDIA): Giant Marquee Typography Track 1 */}
        <div
          ref={marqueeTrackRef}
          className="absolute z-0 top-[22%] whitespace-nowrap will-change-transform select-none pointer-events-none opacity-90 flex"
          aria-hidden="true"
        >
          <span className="text-[13vw] sm:text-[11vw] font-editorial-sans font-black uppercase tracking-tighter text-[#ECEEE5] pr-12">
            CHOREOGRAPHY <span className="text-[#CFFE16]">PERFORMANCE</span> SPEED COMPOSITION
          </span>
          <span className="text-[13vw] sm:text-[11vw] font-editorial-sans font-black uppercase tracking-tighter text-[#ECEEE5] pr-12">
            CHOREOGRAPHY <span className="text-[#CFFE16]">PERFORMANCE</span> SPEED COMPOSITION
          </span>
        </div>

        {/* LAYER 1B (BEHIND MEDIA): Giant Marquee Track 2 (Reverse direction, Serif contrast) */}
        <div
          ref={marqueeReverseRef}
          className="absolute z-0 top-[52%] whitespace-nowrap will-change-transform select-none pointer-events-none opacity-80 flex"
          aria-hidden="true"
        >
          <span className="text-[14vw] sm:text-[12vw] font-editorial-serif italic tracking-tight text-white/30 pr-16">
            Lando Norris Mechanics <span className="text-[#CFFE16] not-italic font-sans">×</span> Spatial Continuity
          </span>
          <span className="text-[14vw] sm:text-[12vw] font-editorial-serif italic tracking-tight text-white/30 pr-16">
            Lando Norris Mechanics <span className="text-[#CFFE16] not-italic font-sans">×</span> Spatial Continuity
          </span>
        </div>

        {/* LAYER 2 (FOREGROUND): Central Stable Framed Media Rectangle */}
        <div className="relative z-10 w-[85vw] max-w-2xl h-[52vh] sm:h-[58vh] bg-[#141813] border border-white/20 shadow-2xl p-4 sm:p-6 flex flex-col justify-between overflow-visible">
          {/* Top Frame Metadata */}
          <div className="flex items-center justify-between font-utility-mono text-xs text-white/60 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CFFE16]" />
              <span className="text-white font-medium">FRAMED ARTIFACT 04</span>
            </div>
            <div className="tracking-widest">ASPECT 16:9 RECT</div>
          </div>

          {/* Abstract Procedural Media Core (High aesthetic editorial graphics) */}
          <div className="my-auto relative w-full h-[65%] bg-[#0D100C] border border-white/10 overflow-hidden flex items-center justify-center">
            {/* Visual technical grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Abstract architectural silhouette & lens geometry */}
            <div className="relative z-10 text-center px-4">
              <div className="text-xs font-utility-mono text-[#CFFE16] tracking-widest uppercase mb-1">
                PERSISTENT OCCLUSION BENCHMARK
              </div>
              <div className="text-2xl sm:text-3xl font-editorial-serif italic text-white">
                "Text travels behind; frame commands foreground."
              </div>
            </div>

            {/* Corner markers */}
            <div className="absolute top-2 left-2 text-[9px] font-utility-mono text-white/30">00:04:12</div>
            <div className="absolute bottom-2 right-2 text-[9px] font-utility-mono text-[#CFFE16]">REF-04-OK</div>
          </div>

          {/* Bottom Frame Caption */}
          <div className="flex items-center justify-between font-utility-mono text-xs text-white/50 pt-3 border-t border-white/10">
            <div>LANDO EDITORIAL SYSTEM</div>
            <div className="text-[#CFFE16]">DEPTH RATIO 1.4 : 1.0</div>
          </div>

          {/* SCENE 05: RIVE / VECTOR STROKE SIGNATURE GESTURE */}
          {/* Crosses the central media and extends beyond its container! */}
          <RiveSignature progress={localProgress} />
        </div>
      </div>
    </section>
  );
};
