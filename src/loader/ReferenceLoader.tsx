import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { useExperience } from '../context/ExperienceContext';
import { calculateRealProgress } from './readinessStore';
import { LoaderFrame } from './LoaderFrame';

interface ReferenceLoaderProps {
  onComplete: () => void;
}

export const ReferenceLoader: React.FC<ReferenceLoaderProps> = ({ onComplete }) => {
  const { readiness, setReadinessStage, reducedMotion, setIntroPhase, qualityLevel } = useExperience();

  const realProgress = calculateRealProgress(readiness);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isHandoff, setIsHandoff] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const handoffStartedRef = useRef(false);

  // DOM and SVG element refs
  const loaderFrameRef = useRef<HTMLDivElement>(null);
  const apertureRef = useRef<SVGRectElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  // Initial aperture rect coordinates (centered)
  const [initialAperture, setInitialAperture] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const h = typeof window !== 'undefined' ? window.innerHeight : 900;
    const frameW = Math.min(w * 0.88, 480);
    const frameH = w >= 640 ? 340 : 300;
    return {
      x: (w - frameW) / 2,
      y: (h - frameH) / 2,
      width: frameW,
      height: frameH,
    };
  });

  // Measure initial DOM rect once LoaderFrame mounts
  useEffect(() => {
    if (loaderFrameRef.current) {
      const rect = loaderFrameRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setInitialAperture({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }, []);

  // 1. Base fonts & DOM readiness trigger
  useEffect(() => {
    setIntroPhase('loading');

    const verifyBase = async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
      setReadinessStage('baseFontsDom', true);
    };

    verifyBase();
  }, [setIntroPhase, setReadinessStage]);

  // 2. High-Precision Display Progress Smoothing (displayProgress <= realProgress)
  useEffect(() => {
    const tick = () => {
      setDisplayProgress((prev) => {
        if (prev < realProgress) {
          const step = Math.max(1.2, (realProgress - prev) * 0.18);
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

  // 3. Early Loading vs. Real 3D Reveal inside Frame (at ~88–92%)
  const innerRevealRatio =
    displayProgress < 86
      ? 0
      : Math.min(1, (displayProgress - 86) / 10);

  // 4. Master Handoff Timeline Trigger (at 100% real readiness)
  useEffect(() => {
    if (
      realProgress >= 100 &&
      displayProgress >= 99 &&
      !handoffStartedRef.current &&
      loaderFrameRef.current &&
      apertureRef.current
    ) {
      handoffStartedRef.current = true;
      setIsHandoff(true);

      const frameEl = loaderFrameRef.current;
      const apertureEl = apertureRef.current;

      // Measure fromRect and toRect ONCE at handoff
      const fromRect = frameEl.getBoundingClientRect();
      const target = document.querySelector('[data-hero-handoff-target="true"]');
      const toRect = target
        ? target.getBoundingClientRect()
        : {
            left: (window.innerWidth - Math.min(window.innerWidth * 0.92, 1440)) / 2,
            top: (window.innerHeight - Math.min(window.innerHeight * 0.72, 760)) / 2,
            width: Math.min(window.innerWidth * 0.92, 1440),
            height: Math.min(window.innerHeight * 0.72, 760),
          };

      // Set initial aperture attribute values explicitly to fromRect
      gsap.set(apertureEl, {
        attr: {
          x: fromRect.left,
          y: fromRect.top,
          width: fromRect.width,
          height: fromRect.height,
        },
      });

      // Fix LoaderFrame position to fromRect before animating geometry
      gsap.set(frameEl, {
        position: 'fixed',
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
        margin: 0,
        maxWidth: 'none',
        maxHeight: 'none',
        zIndex: 30,
      });

      // Master Timeline (~1.35 seconds desktop duration)
      const tl = gsap.timeline();
      const durationB = reducedMotion ? 0.3 : 0.9;
      const durationC = reducedMotion ? 0.15 : 0.35;

      // Phase A (0.00 -> 0.15): Top and bottom bars slide off-screen
      if (topBarRef.current) {
        tl.to(
          topBarRef.current,
          {
            y: -80,
            opacity: 0,
            duration: 0.45,
            ease: 'power3.out',
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
            duration: 0.45,
            ease: 'power3.out',
          },
          0
        );
      }

      // Phase B (0.15 -> 0.95): Animate SVG aperture rect from fromRect to toRect
      tl.to(
        apertureEl,
        {
          attr: {
            x: toRect.left,
            y: toRect.top,
            width: toRect.width,
            height: toRect.height,
          },
          duration: durationB,
          ease: 'power4.inOut',
        },
        0.15
      );

      // Simultaneously animate LoaderFrame geometry from fromRect to toRect
      tl.to(
        frameEl,
        {
          left: toRect.left,
          top: toRect.top,
          width: toRect.width,
          height: toRect.height,
          duration: durationB,
          ease: 'power4.inOut',
        },
        0.15
      );

      // Phase C (0.90 -> 1.25): Expand aperture from Hero target to viewport bounds
      tl.to(
        apertureEl,
        {
          attr: {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          },
          duration: durationC,
          ease: 'power4.out',
        },
        0.15 + durationB - 0.05
      );

      // Loader corner guides fade during final 150ms while Hero target guides reveal
      tl.to(
        frameEl,
        {
          opacity: 0,
          duration: 0.18,
          ease: 'power2.out',
        },
        0.15 + durationB + 0.1
      );

      // Phase D (~0.90): Allow Hero copy and Global Navigation to begin entering
      tl.call(
        () => {
          setIntroPhase('settling');
        },
        [],
        0.90
      );

      // Phase E (~1.30): Ready state & completion handoff
      tl.call(
        () => {
          setIntroPhase('ready');
          setIsComplete(true);
          onComplete();
        },
        [],
        1.30
      );
    }
  }, [realProgress, displayProgress, reducedMotion, setIntroPhase, onComplete]);

  if (isComplete) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none select-none"
      aria-live="polite"
      aria-label="System Initializing"
    >
      {/* Real Fullscreen SVG Aperture Mask */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        width="100%"
        height="100%"
      >
        <defs>
          <mask id="reference-loader-mask">
            {/* White base = Lime background visible */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />

            {/* Black hole = Transparent aperture revealing the real 3D Hero at z-0 */}
            <rect
              ref={apertureRef}
              x={initialAperture.x}
              y={initialAperture.y}
              width={initialAperture.width}
              height={initialAperture.height}
              rx="0"
              fill="black"
            />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="#CFFE16"
          mask="url(#reference-loader-mask)"
        />
      </svg>

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

        {/* Center: Shared Reference Frame */}
        <div className="relative my-auto w-full flex items-center justify-center pointer-events-none">
          <LoaderFrame
            ref={loaderFrameRef}
            displayProgress={displayProgress}
            innerRevealRatio={innerRevealRatio}
            isHandoff={isHandoff}
          />
        </div>

        {/* Bottom Bar: True Weighted Readiness Checklist & Numeric Counter */}
        <div
          ref={bottomBarRef}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-[#080808]/20 pt-6"
        >
          {/* Readiness Indicators */}
          <div className="space-y-1">
            <div className="font-utility-mono text-xs tracking-wider uppercase font-bold text-[#080808]">
              REAL ADAPTIVE PIPELINE [{qualityLevel}]
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-utility-mono text-[#080808]/80">
              <span className={readiness.baseFontsDom ? 'font-bold' : 'opacity-40'}>
                {readiness.baseFontsDom ? '✓' : '○'} BASE/FONTS
              </span>
              <span>·</span>
              <span className={readiness.heroModulePhysics ? 'font-bold' : 'opacity-40'}>
                {readiness.heroModulePhysics ? '✓' : '○'} MODULES
              </span>
              <span>·</span>
              <span className={readiness.rapierReady ? 'font-bold' : 'opacity-40'}>
                {readiness.rapierReady ? '✓' : '○'} RAPIER
              </span>
              <span>·</span>
              <span className={readiness.fluidReady ? 'font-bold' : 'opacity-40'}>
                {readiness.fluidReady ? '✓' : '○'} FLUID
              </span>
              <span>·</span>
              <span className={readiness.shaderCompileReady ? 'font-bold' : 'opacity-40'}>
                {readiness.shaderCompileReady ? '✓' : '○'} SHADERS
              </span>
              <span>·</span>
              <span className={readiness.warmupReady ? 'font-bold' : 'opacity-40'}>
                {readiness.warmupReady ? '✓' : '○'} WARMUP
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
