import React, { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { Move } from 'lucide-react';

export const Scene07_DeformableMedia: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const mediaTargetRef = useRef<HTMLDivElement>(null);
  const { setActiveScene, setNavTheme, registerTrackedElement, unregisterTrackedElement, inputsRef } = useExperience();

  useEffect(() => {
    const el = mediaTargetRef.current;
    if (el) {
      registerTrackedElement('deformable-media-window', el);
    }
    return () => {
      unregisterTrackedElement('deformable-media-window');
    };
  }, [registerTrackedElement, unregisterTrackedElement]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        setActiveScene('scene-07-deformable');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-07-deformable');
        setNavTheme('dark');
      },
      onUpdate: (self) => {
        if (inputsRef.current) {
          inputsRef.current.sceneProgress.deformable = self.progress;
        }
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme, inputsRef]);

  return (
    <section
      id="scene-07-deformable"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#080808] text-[#ECEEE5] flex flex-col justify-between p-8 sm:p-14 md:p-20 border-b border-white/10"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-utility-mono tracking-widest text-white/40">
        <div>
          <span className="text-[#CFFE16]">07</span> // LUSION DEFORMABLE MEDIA BENCHMARK
        </div>
        <div>DOM BOUNDS TRACKING + CUSTOM DISPLACEMENT SHADER</div>
      </div>

      {/* Main View: Title & DOM Tracked Surface */}
      <div className="my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Text */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-utility-mono text-[#CFFE16] uppercase tracking-wider">
            SYNCHRONIZED WEBGL SURFACE
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-editorial-sans font-bold uppercase tracking-tight text-white leading-tight">
            DEFORMABLE <br />
            <span className="font-editorial-serif italic font-normal text-[#CFFE16]">Interactive</span> <br />
            SURFACE.
          </h2>
          <p className="text-sm sm:text-base text-white/70 font-sans leading-relaxed">
            A subdivided WebGL plane mirrors this exact DOM container's bounding rectangle. Move your pointer over the target to activate real-time vertex displacement with spring physics and chromatic iridescence.
          </p>

          <div className="pt-4 flex items-center gap-2 text-xs font-utility-mono text-[#CFFE16]">
            <Move className="w-4 h-4 animate-pulse" />
            <span>HOVER AND DRAG CURSOR OVER WINDOW</span>
          </div>
        </div>

        {/* Right DOM Media Placeholder (TRACKED BY WEBGL PLANE) */}
        <div className="lg:col-span-7 flex justify-center">
          <div
            ref={mediaTargetRef}
            className="w-full max-w-xl h-72 sm:h-96 relative border border-white/20 p-4 flex flex-col justify-between cursor-crosshair select-none bg-black/40"
          >
            {/* Top metadata tags */}
            <div className="flex justify-between items-center text-[10px] font-utility-mono text-white/60">
              <span className="text-[#CFFE16] font-bold">LUSION SHADER MATRIX</span>
              <span>SUBDIV: 32×32 MESH</span>
            </div>

            {/* Center target indicator */}
            <div className="mx-auto my-auto text-center pointer-events-none opacity-80">
              <div className="w-12 h-12 mx-auto rounded-full border border-dashed border-[#CFFE16] flex items-center justify-center mb-2">
                <div className="w-2 h-2 rounded-full bg-[#CFFE16]" />
              </div>
              <div className="text-xs font-utility-mono text-white/80">INTERACTIVE TRACK ZONE</div>
            </div>

            {/* Bottom stats inside placeholder */}
            <div className="flex justify-between items-center text-[10px] font-utility-mono text-white/50 border-t border-white/10 pt-2">
              <span>BOUNDS: RESIZE-OBSERVER</span>
              <span className="text-[#CFFE16]">UPOINTERVELOCITY: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Technical Note */}
      <div className="text-[11px] font-utility-mono text-white/30">
        NO GETBOUNDINGCLIENTRECT PER FRAME · CACHED OFFSETS FOR CONSTANT 60 FPS
      </div>
    </section>
  );
};
