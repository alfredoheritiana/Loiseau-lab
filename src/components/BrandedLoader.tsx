import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useExperience } from '../context/ExperienceContext';

interface BrandedLoaderProps {
  onComplete: () => void;
}

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({ onComplete }) => {
  const { reducedMotion, setIntroPhase } = useExperience();

  // Progress counter state (0 to 100)
  const [progress, setProgress] = useState(0);

  // High-precision timeline time (seconds from asset readiness: 0.00 to 1.65)
  const [timelineT, setTimelineT] = useState<number | null>(null);

  // Asset readiness flags
  const [readinessStages, setReadinessStages] = useState({
    fonts: false,
    webgl: false,
    shaders: false,
    dom: false,
  });

  const animFrameRef = useRef<number | null>(null);
  const readinessReachedRef = useRef(false);
  const timelineStartRef = useRef<number | null>(null);

  // Viewport dimensions
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Critical Asset Loading & Verification
  useEffect(() => {
    let targetProgress = 14;

    const verifySystemAssets = async () => {
      // 1. Verify typography & fonts
      if (document.fonts) {
        await document.fonts.ready;
      }
      setReadinessStages((prev) => ({ ...prev, fonts: true }));
      targetProgress = 42;

      // 2. Verify WebGL 2.0 / Context capability
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        setReadinessStages((prev) => ({ ...prev, webgl: true }));
        targetProgress = 76;
      }

      // 3. Verify Shader / Precision support
      if (gl) {
        const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        if (precision && precision.precision > 0) {
          setReadinessStages((prev) => ({ ...prev, shaders: true }));
          targetProgress = 94;
        }
      }

      // 4. Verify DOM viewport metrics
      if (typeof window !== 'undefined' && window.innerWidth > 0) {
        setReadinessStages((prev) => ({ ...prev, dom: true }));
        targetProgress = 100;
      }
    };

    verifySystemAssets();

    // High precision ticker to smoothly animate towards verified progress
    const tick = () => {
      setProgress((prev) => {
        if (prev < targetProgress) {
          const step = Math.max(1.4, (targetProgress - prev) * 0.15);
          const next = Math.min(prev + step, targetProgress);
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
  }, []);

  // 2. Master Choreography Timeline Trigger
  useEffect(() => {
    // When progress hits >= 98% and all critical assets verified, initiate presentation timeline
    if (progress >= 98 && !readinessReachedRef.current) {
      readinessReachedRef.current = true;

      // For reduced motion, run an accelerated 350ms handoff
      const totalTimelineDuration = reducedMotion ? 0.35 : 1.65;

      const runTimeline = (now: number) => {
        if (timelineStartRef.current === null) {
          timelineStartRef.current = now;
        }

        const elapsedSec = (now - timelineStartRef.current) / 1000;
        const currentT = Math.min(elapsedSec, totalTimelineDuration);
        setTimelineT(currentT);

        // Map timeline T into discrete architectural phases for ExperienceContext
        if (reducedMotion) {
          if (currentT < 0.15) {
            setIntroPhase('opening');
          } else if (currentT < 0.3) {
            setIntroPhase('settling');
          } else {
            setIntroPhase('ready');
          }
        } else {
          if (currentT < 0.20) {
            setIntroPhase('tension');
          } else if (currentT < 0.40) {
            setIntroPhase('opening');
          } else if (currentT < 1.10) {
            setIntroPhase('expanding');
          } else if (currentT < 1.40) {
            setIntroPhase('settling');
          } else {
            setIntroPhase('ready');
          }
        }

        if (currentT < totalTimelineDuration) {
          requestAnimationFrame(runTimeline);
        } else {
          // Finished! Set final state and complete handoff
          setIntroPhase('ready');
          setTimeout(() => {
            onComplete();
          }, 40);
        }
      };

      requestAnimationFrame(runTimeline);
    }
  }, [progress, onComplete, reducedMotion, setIntroPhase]);

  // Derived timeline parameters
  const t = timelineT ?? 0;
  const isTimelineActive = timelineT !== null;

  // Frame bounds computation across time
  const { w, h } = viewport;
  const isMobile = w < 640;

  // Target Hero Frame geometry (centered)
  const heroW = Math.min(w - 48, 576);
  const heroH = isMobile ? 288 : 384;
  const heroX = (w - heroW) / 2;
  const heroY = (h - heroH) / 2;

  // Initial Loader Reference Frame geometry (compact and architectural)
  const initialW = Math.min(w - (isMobile ? 36 : 64), isMobile ? 380 : 520);
  const initialH = isMobile ? 270 : 340;
  const initialX = (w - initialW) / 2;
  const initialY = (h - initialH) / 2;

  // Dynamic aperture bounds calculation
  let curX = initialX;
  let curY = initialY;
  let curW = initialW;
  let curH = initialH;
  let apertureOpenRatio = 0; // 0 = closed (solid lime interior), 1 = fully open window into 3D

  if (!isTimelineActive || t < 0.20) {
    // T = 0.00 to 0.20: Subtle 1.5% tension contraction
    const tensionP = Math.min(1, t / 0.20);
    const contract = 1.0 - 0.015 * Math.sin(tensionP * Math.PI);
    curW = initialW * contract;
    curH = initialH * contract;
    curX = (w - curW) / 2;
    curY = (h - curH) / 2;
    apertureOpenRatio = 0;
  } else if (t >= 0.20 && t < 0.40) {
    // T = 0.20 to 0.40: Aperture begins opening inside frame, frame starts expanding
    const p = (t - 0.20) / 0.20;
    apertureOpenRatio = Math.min(1, p * 1.2);
    // Slight expansion start
    curW = initialW + (heroW * 0.1) * p;
    curH = initialH + (heroH * 0.1) * p;
    curX = (w - curW) / 2;
    curY = (h - curH) / 2;
  } else if (t >= 0.40 && t < 1.15) {
    // T = 0.40 to 1.15: Aperture expands rapidly toward and beyond viewport!
    apertureOpenRatio = 1;
    const p = (t - 0.40) / 0.75;
    // Cubic bezier ease-out curve: fast initial expansion, smooth deceleration
    const ease = 1 - Math.pow(1 - p, 3.2);

    // Expand from initial dimensions to beyond viewport edges
    const targetW = w + 120;
    const targetH = h + 120;

    curW = initialW + (targetW - initialW) * ease;
    curH = initialH + (targetH - initialH) * ease;
    curX = (w - curW) / 2;
    curY = (h - curH) / 2;
  } else {
    // T >= 1.15: Aperture is fully beyond viewport
    apertureOpenRatio = 1;
    curW = w + 120;
    curH = h + 120;
    curX = -60;
    curY = -60;
  }

  // Corner markers interpolation:
  // Starts at loader frame corners -> locks at Hero frame corners
  let cornerX = initialX;
  let cornerY = initialY;
  let cornerW = initialW;
  let cornerH = initialH;

  if (t < 0.40) {
    cornerX = curX;
    cornerY = curY;
    cornerW = curW;
    cornerH = curH;
  } else if (t < 1.10) {
    const p = (t - 0.40) / 0.70;
    const ease = 1 - Math.pow(1 - p, 2.8);
    cornerX = initialX + (heroX - initialX) * ease;
    cornerY = initialY + (heroY - initialY) * ease;
    cornerW = initialW + (heroW - initialW) * ease;
    cornerH = initialH + (heroH - initialH) * ease;
  } else {
    cornerX = heroX;
    cornerY = heroY;
    cornerW = heroW;
    cornerH = heroH;
  }

  // Typography Exit states
  // REFERENCE: clips horizontally, scales subtly, translates upward
  let refClip = 0; // 0% to 50%
  let refTranslateY = 0;
  let refScale = 1;
  let refOpacity = 1;

  if (t >= 0.22 && t < 0.75) {
    const p = (t - 0.22) / 0.48;
    refClip = Math.min(50, p * 52);
    refTranslateY = -p * 22;
    refScale = 1 + p * 0.04;
    refOpacity = Math.max(0, 1 - p * 1.5);
  } else if (t >= 0.75) {
    refOpacity = 0;
    refClip = 50;
  }

  // Lab 00: trails slightly behind, moves downward, fades out smoothly
  let labTranslateY = 0;
  let labOpacity = 1;

  if (t >= 0.35 && t < 0.85) {
    const p = (t - 0.35) / 0.45;
    labTranslateY = p * 16;
    labOpacity = Math.max(0, 1 - p * 1.4);
  } else if (t >= 0.85) {
    labOpacity = 0;
  }

  // Subtitle tags: fade and clip horizontally
  const tagsOpacity = t < 0.25 ? 1 : Math.max(0, 1 - (t - 0.25) / 0.3);

  // Top and Bottom UI bar translations during expansion
  const uiRetreat = t < 0.65 ? 0 : Math.min(1, (t - 0.65) / 0.45);
  const uiEase = Math.pow(uiRetreat, 2);

  // Connecting frame lines fade out around T = 1.0 to 1.35
  const frameBorderOpacity = t < 0.85 ? 1 : Math.max(0, 1 - (t - 0.85) / 0.35);

  // Corner crosshairs color transition: black on lime -> Signal Green #CFFE16 when aperture opens
  const isCornerGreen = t >= 0.30;

  // Optical lens overlay inside aperture: dark overlay at first, clearing to full PBR vibrancy
  const lensOpacity = t < 0.20 ? 0 : t < 0.40 ? 0.45 : Math.max(0, 0.45 - (t - 0.40) * 0.9);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none select-none"
      aria-live="polite"
      aria-label="System Initializing"
    >
      {/* ========================================================================= */}
      {/* 4 PHYSICAL LIME SHUTTER PANELS (Top, Bottom, Left, Right)                */}
      {/* Creating an open architectural window to the living 3D Canvas underneath */}
      {/* ========================================================================= */}

      {/* Top Lime Panel */}
      <div
        className="absolute left-0 right-0 top-0 bg-[#CFFE16]"
        style={{
          height: `${Math.max(0, curY)}px`,
        }}
      />

      {/* Bottom Lime Panel */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-[#CFFE16]"
        style={{
          top: `${Math.min(h, curY + curH)}px`,
        }}
      />

      {/* Left Lime Panel */}
      <div
        className="absolute left-0 bg-[#CFFE16]"
        style={{
          top: `${Math.max(0, curY)}px`,
          height: `${Math.max(0, curH)}px`,
          width: `${Math.max(0, curX)}px`,
        }}
      />

      {/* Right Lime Panel */}
      <div
        className="absolute right-0 bg-[#CFFE16]"
        style={{
          top: `${Math.max(0, curY)}px`,
          height: `${Math.max(0, curH)}px`,
          left: `${Math.min(w, curX + curW)}px`,
        }}
      />

      {/* ========================================================================= */}
      {/* APERTURE INTERIOR WINDOW & OPTICAL LENS LAYER                            */}
      {/* Revealing the living Hero 3D world ("the world was already inside")      */}
      {/* ========================================================================= */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${curX}px`,
          top: `${curY}px`,
          width: `${curW}px`,
          height: `${curH}px`,
        }}
      >
        {/* Unopened Lime Interior Fill: Fades out as aperture opens (revealing 3D world) */}
        <div
          className="absolute inset-0 bg-[#CFFE16]"
          style={{
            opacity: Math.max(0, 1 - apertureOpenRatio * 1.5),
          }}
        />

        {/* Optical Lens Filter: Gives cinematic anticipation, then clears to PBR vibrancy */}
        <div
          className="absolute inset-0 bg-black backdrop-blur-[2px] pointer-events-none"
          style={{
            opacity: lensOpacity,
          }}
        />

        {/* Connecting Frame Line: Follows current aperture before fading */}
        <div
          className="absolute inset-0 border border-[#080808]/40 pointer-events-none"
          style={{
            opacity: Math.max(0, frameBorderOpacity * (1 - apertureOpenRatio)),
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* THE PRIMARY SHARED ELEMENT: CORNER GUIDES & REFERENCE FRAME               */}
      {/* Survives from loader directly into the Hero's alignment guides            */}
      {/* ========================================================================= */}
      <div
        className="absolute pointer-events-none transition-none"
        style={{
          left: `${cornerX}px`,
          top: `${cornerY}px`,
          width: `${cornerW}px`,
          height: `${cornerH}px`,
        }}
      >
        {/* Technical Connecting Frame Border (thins out & dissolves at T > 1.0) */}
        <div
          className="absolute inset-0 border transition-opacity duration-300 pointer-events-none"
          style={{
            borderColor: isCornerGreen ? 'rgba(207, 254, 22, 0.25)' : 'rgba(8, 8, 8, 0.4)',
            opacity: frameBorderOpacity,
          }}
        />

        {/* 
          THE 4 CORNER MARKERS (True Shared Elements)
          Interpolate smoothly to Hero geometry and remain as the Hero's corner crosshairs!
        */}
        <div
          className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 transition-colors duration-300"
          style={{
            borderColor: isCornerGreen ? '#CFFE16' : '#080808',
          }}
        />
        <div
          className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 transition-colors duration-300"
          style={{
            borderColor: isCornerGreen ? '#CFFE16' : '#080808',
          }}
        />
        <div
          className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 transition-colors duration-300"
          style={{
            borderColor: isCornerGreen ? '#CFFE16' : '#080808',
          }}
        />
        <div
          className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 transition-colors duration-300"
          style={{
            borderColor: isCornerGreen ? '#CFFE16' : '#080808',
          }}
        />

        {/* Internal Frame Sub-Label: Spatial Alignment (fades at T > 0.25) */}
        <div
          className="absolute top-3 left-4 right-4 flex justify-between items-center text-[10px] font-utility-mono uppercase tracking-widest text-[#080808]/70"
          style={{
            opacity: Math.max(0, 1 - (t / 0.28)),
          }}
        >
          <span>SPATIAL ALIGNMENT // 00</span>
          <span className="font-bold">SHARED ELEMENT ANCHOR</span>
        </div>

        {/* Internal Frame Sub-Label: Monocoque Target */}
        <div
          className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[10px] font-utility-mono text-[#080808]/70 border-t border-[#080808]/20 pt-2"
          style={{
            opacity: Math.max(0, 1 - (t / 0.28)),
          }}
        >
          <span>TARGET: 3D MONOCOQUE</span>
          <span className="font-bold">
            {progress < 98 ? `ASSEMBLING ${Math.round(progress)}%` : 'SYSTEM ARMED'}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* TYPOGRAPHY EXIT CHOREOGRAPHY (Precise, architectural, zero glitch)        */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
          {/* REFERENCE: Horizontal clip from both sides + subtle upward translation */}
          <div
            className="will-change-transform"
            style={{
              opacity: refOpacity,
              transform: `translateY(${refTranslateY}px) scale(${refScale})`,
              clipPath: `inset(0 ${refClip}% 0 ${refClip}%)`,
            }}
          >
            <div className="text-4xl sm:text-6xl md:text-7xl font-editorial-sans font-black tracking-tighter uppercase leading-[0.88] text-[#080808] text-center">
              REFERENCE
            </div>
          </div>

          {/* Lab 00: Trails slightly behind, moves downward, fades smoothly */}
          <div
            className="will-change-transform mt-1"
            style={{
              opacity: labOpacity,
              transform: `translateY(${labTranslateY}px)`,
            }}
          >
            <div className="text-4xl sm:text-6xl md:text-7xl font-editorial-serif italic font-normal text-[#080808] leading-[0.88] text-center">
              Lab 00
            </div>
          </div>

          {/* Dual tags [ LUSION.CO ] × [ LANDONORRIS.COM ] */}
          <div
            className="mt-3 flex items-center justify-center gap-2 text-[11px] font-utility-mono tracking-wider font-semibold text-[#080808]/80"
            style={{
              opacity: tagsOpacity,
            }}
          >
            <span>[ LUSION.CO ]</span>
            <span className="opacity-40">×</span>
            <span>[ LANDONORRIS.COM ]</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOP & BOTTOM SHELL BARS (Slide off-screen as lime field retreats)          */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-12 md:p-16 text-[#080808] pointer-events-none">
        {/* Top Minimal Editorial Bar */}
        <div
          className="flex items-start justify-between font-utility-mono text-xs uppercase tracking-widest font-bold"
          style={{
            transform: `translateY(-${uiEase * 65}px)`,
            opacity: Math.max(0, 1 - uiEase * 1.5),
          }}
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

        {/* Empty Spacer in middle (aperture occupies this space) */}
        <div className="flex-1 pointer-events-none" />

        {/* Bottom Bar: Readiness Indicators & Progress Number */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-[#080808]/20 pt-6"
          style={{
            transform: `translateY(${uiEase * 65}px)`,
            opacity: Math.max(0, 1 - uiEase * 1.5),
          }}
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

          {/* Large Numeric Counter (Tied to real readiness, 100% initiates transformation) */}
          <div className="flex items-baseline gap-2">
            <span className="text-6xl sm:text-7xl md:text-8xl font-editorial-sans font-black tabular-nums tracking-tighter leading-none text-[#080808]">
              {Math.min(100, Math.floor(progress)).toString().padStart(3, '0')}
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
