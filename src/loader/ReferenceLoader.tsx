import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useExperience } from '../context/ExperienceContext';
import { LoaderFrame } from './LoaderFrame';
import { LoaderState } from './loaderStore';

gsap.registerPlugin(Flip);

interface ReferenceLoaderProps {
  onHandoffStart?: () => void;
  onComplete: () => void;
}

export const ReferenceLoader: React.FC<ReferenceLoaderProps> = ({
  onHandoffStart,
  onComplete,
}) => {
  const { reducedMotion, appMode, setIntroPhase } = useExperience();

  const [state, setState] = useState<LoaderState>('BOOT');
  const [realProgress, setRealProgress] = useState(14);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isHeroLayout, setIsHeroLayout] = useState(false);

  // Asset verification tracking
  const [readinessStages, setReadinessStages] = useState({
    fonts: false,
    webgl: false,
    shaders: false,
    dom: false,
  });

  const animFrameRef = useRef<number | null>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const limeTopRef = useRef<HTMLDivElement>(null);
  const limeBottomRef = useRef<HTMLDivElement>(null);
  const limeLeftRef = useRef<HTMLDivElement>(null);
  const limeRightRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  // 1. Truthful Critical Asset Loading Pipeline
  useEffect(() => {
    setState('LOADING');
    setIntroPhase('loading');

    const verifyCriticalAssets = async () => {
      // Step A: Typography & Fonts
      if (document.fonts) {
        await document.fonts.ready;
      }
      setReadinessStages((prev) => ({ ...prev, fonts: true }));
      setRealProgress(42);

      // Step B: WebGL 2.0 Context & Hardware Capability
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        setReadinessStages((prev) => ({ ...prev, webgl: true }));
        setRealProgress(74);
      }

      // Step C: High-float Shader Precision
      if (gl) {
        const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        if (precision && precision.precision > 0) {
          setReadinessStages((prev) => ({ ...prev, shaders: true }));
          setRealProgress(92);
        }
      }

      // Step D: DOM Viewport & Metrics
      if (typeof window !== 'undefined' && window.innerWidth > 0) {
        setReadinessStages((prev) => ({ ...prev, dom: true }));
        setRealProgress(100);
      }
    };

    verifyCriticalAssets();
  }, [setIntroPhase]);

  // 2. High-Precision Display Progress Smoothing (Never reaches 100 before real readiness)
  useEffect(() => {
    const tick = () => {
      setDisplayProgress((prev) => {
        if (prev < realProgress) {
          const step = Math.max(1.4, (realProgress - prev) * 0.16);
          const next = Math.min(prev + step, realProgress);
          return parseFloat(next.toFixed(1));
        }
        return prev;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [realProgress]);

  // 3. Tension and Aperture Preparation (90-98%)
  const innerRevealRatio =
    displayProgress < 88
      ? 0
      : Math.min(1, (displayProgress - 88) / 10);

  // 4. Trigger Handoff immediately at 100% (Zero Hold State)
  useEffect(() => {
    if (realProgress >= 100 && displayProgress >= 99 && state === 'LOADING') {
      setState('READY');
      setIntroPhase('opening');

      // Capture GSAP Flip state of the frame and corner markers before layout changes
      flipStateRef.current = Flip.getState('[data-flip-id]', {
        props: 'borderRadius,borderColor,backgroundColor,opacity',
      });

      // Switch to Hero layout
      setState('HANDOFF');
      setIntroPhase('expanding');
      setIsHeroLayout(true);
      onHandoffStart?.();
    }
  }, [realProgress, displayProgress, state, onHandoffStart, setIntroPhase]);

  // 5. Run GSAP Flip & Spatial Lime Displacement during HANDOFF
  useLayoutEffect(() => {
    if (state === 'HANDOFF' && flipStateRef.current) {
      const duration = reducedMotion ? 0.35 : 1.45;

      // Master Timeline for synchronized Flip and spatial lime panel displacement
      const tl = gsap.timeline({
        onComplete: () => {
          setState('HERO');
          setIntroPhase('ready');
          onComplete();
        },
      });

      // A. GSAP Flip on Shared Frame and Corner Markers
      tl.add(
        Flip.from(flipStateRef.current, {
          duration,
          ease: 'power4.out',
          targets: '[data-flip-id]',
          nested: true,
          absolute: true,
        }),
        0
      );

      // B. Spatial Displacement of Lime Shutter Panels (outward beyond viewport)
      if (limeTopRef.current) {
        tl.to(
          limeTopRef.current,
          {
            yPercent: -105,
            duration: duration * 0.9,
            ease: 'power4.out',
          },
          0.05
        );
      }
      if (limeBottomRef.current) {
        tl.to(
          limeBottomRef.current,
          {
            yPercent: 105,
            duration: duration * 0.9,
            ease: 'power4.out',
          },
          0.05
        );
      }
      if (limeLeftRef.current) {
        tl.to(
          limeLeftRef.current,
          {
            xPercent: -105,
            duration: duration * 0.9,
            ease: 'power4.out',
          },
          0.05
        );
      }
      if (limeRightRef.current) {
        tl.to(
          limeRightRef.current,
          {
            xPercent: 105,
            duration: duration * 0.9,
            ease: 'power4.out',
          },
          0.05
        );
      }

      // C. Displace Top & Bottom Shell Bars off-screen
      if (topBarRef.current) {
        tl.to(
          topBarRef.current,
          {
            y: -80,
            opacity: 0,
            duration: duration * 0.6,
            ease: 'power4.out',
          },
          0
        );
      }
      if (bottomBarRef.current) {
        tl.to(
          bottomBarRef.current,
          {
            y: 80,
            opacity: 0,
            duration: duration * 0.6,
            ease: 'power4.out',
          },
          0
        );
      }

      // Mid-Flip Hero copy settling cue (around 75% expansion)
      tl.call(
        () => {
          setIntroPhase('settling');
        },
        [],
        duration * 0.72
      );
    }
  }, [state, reducedMotion, onComplete, setIntroPhase]);

  if (state === 'HERO') {
    return null;
  }

  const isBenchmark = appMode === 'benchmark';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none select-none"
      aria-live="polite"
      aria-label="System Initializing"
    >
      {/* ========================================================================= */}
      {/* 4 SPATIAL LIME SHUTTER PANELS (Top, Bottom, Left, Right)                  */}
      {/* Displace outward beyond viewport bounds with GSAP Flip during HANDOFF     */}
      {/* ========================================================================= */}
      <div
        ref={limeTopRef}
        className="absolute top-0 left-0 right-0 h-1/2 bg-[#CFFE16] origin-top will-change-transform pointer-events-auto"
      />
      <div
        ref={limeBottomRef}
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#CFFE16] origin-bottom will-change-transform pointer-events-auto"
      />
      <div
        ref={limeLeftRef}
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#CFFE16] origin-left will-change-transform pointer-events-auto"
      />
      <div
        ref={limeRightRef}
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-[#CFFE16] origin-right will-change-transform pointer-events-auto"
      />

      {/* Main Layout Viewport containing the Shared Frame */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-12 md:p-16 text-[#080808] pointer-events-none">
        {/* Top Minimal Editorial Bar */}
        <div
          ref={topBarRef}
          className="flex items-start justify-between font-utility-mono text-xs uppercase tracking-widest font-bold"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#080808] animate-pulse" />
            <span>LOISEAU BENCHMARK LAB</span>
          </div>

          <div className="text-right flex items-center gap-4">
            <span className="hidden sm:inline">BOOT SEQUENCE</span>
            <span className="px-2 py-0.5 border border-[#080808]/30 text-[10px]">
              SYS VER 0.1
            </span>
          </div>
        </div>

        {/* 
          CENTER: THE SHARED REFERENCE FRAME
          Survives GSAP Flip and transforms physically into the Hero spatial frame!
        */}
        <div className="relative my-auto w-full flex items-center justify-center pointer-events-auto">
          <LoaderFrame
            state={state}
            isHeroLayout={isHeroLayout}
            displayProgress={displayProgress}
            innerRevealRatio={innerRevealRatio}
            isBenchmark={isBenchmark}
          />
        </div>

        {/* Bottom Bar: Readiness Indicators & Honest Numeric Counter */}
        <div
          ref={bottomBarRef}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-[#080808]/20 pt-6"
        >
          {/* Readiness Indicators */}
          <div className="space-y-1">
            <div className="font-utility-mono text-xs tracking-wider uppercase font-bold text-[#080808]">
              STARTUP PIPELINE
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-utility-mono text-[#080808]/80">
              <span className={readinessStages.fonts ? 'font-bold' : 'opacity-40'}>
                {readinessStages.fonts ? '✓' : '○'} FONTS
              </span>
              <span>·</span>
              <span className={readinessStages.webgl ? 'font-bold' : 'opacity-40'}>
                {readinessStages.webgl ? '✓' : '○'} WEBGL
              </span>
              <span>·</span>
              <span className={readinessStages.shaders ? 'font-bold' : 'opacity-40'}>
                {readinessStages.shaders ? '✓' : '○'} SHADERS
              </span>
              <span>·</span>
              <span className={readinessStages.dom ? 'font-bold' : 'opacity-40'}>
                {readinessStages.dom ? '✓' : '○'} DOM
              </span>
            </div>
          </div>

          {/* Numeric Display Counter */}
          <div className="flex items-baseline gap-2">
            <span className="text-6xl sm:text-7xl md:text-8xl font-editorial-sans font-black tabular-nums tracking-tighter leading-none text-[#080808]">
              {Math.min(100, Math.floor(displayProgress)).toString().padStart(3, '0')}
            </span>
            <span className="text-xl sm:text-2xl font-editorial-sans font-bold text-[#080808]/70">
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
