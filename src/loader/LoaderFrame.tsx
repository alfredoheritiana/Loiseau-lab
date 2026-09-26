import React from 'react';
import { FLIP_IDS } from '../motion/flipIds';
import { LoaderState } from './loaderStore';

interface LoaderFrameProps {
  state: LoaderState;
  isHeroLayout: boolean;
  displayProgress: number;
  innerRevealRatio: number; // 0 = solid lime, 1 = fully open window into 3D
  isBenchmark: boolean;
}

export const LoaderFrame: React.FC<LoaderFrameProps> = ({
  state,
  isHeroLayout,
  displayProgress,
  innerRevealRatio,
  isBenchmark,
}) => {
  const isHandoffOrHero = state === 'HANDOFF' || state === 'HERO';
  const isFinalHero = state === 'HERO';

  // Typography exit calculations based on innerRevealRatio and state
  // REFERENCE: clips horizontally, scales subtly, translates upward
  const refClip = Math.min(50, innerRevealRatio * 52);
  const refTranslateY = -innerRevealRatio * 20;
  const refScale = 1 + innerRevealRatio * 0.04;
  const refOpacity = isHandoffOrHero ? 0 : Math.max(0, 1 - innerRevealRatio * 1.5);

  // Lab 00: trails slightly behind, moves downward, masks out
  const labTranslateY = innerRevealRatio * 16;
  const labOpacity = isHandoffOrHero ? 0 : Math.max(0, 1 - Math.max(0, innerRevealRatio - 0.2) * 1.6);

  // Subtitle tags
  const tagsOpacity = isHandoffOrHero ? 0 : Math.max(0, 1 - innerRevealRatio * 2.0);

  // Corner markers color: dark on lime, Signal Lime #CFFE16 when aperture opens
  const cornerColor = innerRevealRatio > 0.4 || isHandoffOrHero ? 'border-[#CFFE16]' : 'border-[#080808]';

  // Frame border: visible during loading, dissolves once Hero is reached
  const frameBorderClass = isFinalHero
    ? 'border-transparent'
    : innerRevealRatio > 0.4 || isHandoffOrHero
    ? 'border border-[#CFFE16]/30'
    : 'border border-[#080808]/40';

  return (
    <div
      data-flip-id={FLIP_IDS.FRAME}
      className={`relative flex flex-col justify-between p-6 transition-colors duration-300 pointer-events-auto select-none ${
        isHeroLayout
          ? 'w-[90vw] max-w-xl h-72 sm:h-96'
          : 'w-[88vw] max-w-[480px] h-[300px] sm:h-[340px]'
      } ${frameBorderClass}`}
    >
      {/* 
        TRUE SHARED ELEMENT CORNER MARKERS:
        Survive GSAP Flip layout change from Loader -> Hero with identical data-flip-id!
      */}
      <div
        data-flip-id={FLIP_IDS.CORNER_TL}
        className={`absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 transition-colors duration-300 ${cornerColor}`}
      />
      <div
        data-flip-id={FLIP_IDS.CORNER_TR}
        className={`absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 transition-colors duration-300 ${cornerColor}`}
      />
      <div
        data-flip-id={FLIP_IDS.CORNER_BL}
        className={`absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 transition-colors duration-300 ${cornerColor}`}
      />
      <div
        data-flip-id={FLIP_IDS.CORNER_BR}
        className={`absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 transition-colors duration-300 ${cornerColor}`}
      />

      {/* 
        INTERNAL LIME COVER LAYER:
        Fades out as progress approaches 95-100%, revealing the living WebGL Hero knot
        and particles already moving underneath the frame window ("the world was already inside").
      */}
      {!isFinalHero && (
        <div
          className="absolute inset-0 bg-[#CFFE16] pointer-events-none transition-opacity duration-300 rounded-[1px]"
          style={{
            opacity: Math.max(0, 1 - innerRevealRatio * 1.4),
          }}
        />
      )}

      {/* Optical lens veil: soft dark vignette inside the window before full expansion */}
      {!isFinalHero && innerRevealRatio > 0.1 && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none transition-opacity duration-400"
          style={{
            opacity: isHandoffOrHero ? 0 : Math.max(0, 0.45 - innerRevealRatio * 0.4),
          }}
        />
      )}

      {/* Sub-label: Top Spatial Alignment (fades as frame opens) */}
      {!isHandoffOrHero && (
        <div
          className="relative z-10 flex justify-between items-center text-[10px] font-utility-mono uppercase tracking-widest text-[#080808]/70"
          style={{
            opacity: Math.max(0, 1 - innerRevealRatio * 2),
          }}
        >
          <span>SPATIAL ALIGNMENT // 00</span>
          <span className="font-bold">SHARED ELEMENT ANCHOR</span>
        </div>
      )}

      {/* Center Typography Composition with Architectural Exit (No Glitch) */}
      {!isHandoffOrHero && (
        <div className="relative z-10 my-auto text-center overflow-hidden py-1">
          {/* REFERENCE: Horizontal clip + slight upward translation */}
          <div
            style={{
              opacity: refOpacity,
              transform: `translateY(${refTranslateY}px) scale(${refScale})`,
              clipPath: `inset(0 ${refClip}% 0 ${refClip}%)`,
              transition: 'clip-path 250ms ease-out, transform 250ms ease-out',
            }}
          >
            <div className="text-4xl sm:text-6xl md:text-7xl font-editorial-sans font-black tracking-tighter uppercase leading-[0.88] text-[#080808]">
              REFERENCE
            </div>
          </div>

          {/* Lab 00: Trails slightly behind, moves downward, masks out */}
          <div
            className="mt-1"
            style={{
              opacity: labOpacity,
              transform: `translateY(${labTranslateY}px)`,
              transition: 'transform 250ms ease-out, opacity 250ms ease-out',
            }}
          >
            <div className="text-4xl sm:text-6xl md:text-7xl font-editorial-serif italic font-normal text-[#080808] leading-[0.88]">
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
      )}

      {/* Sub-label: Bottom Target Indicator */}
      {!isHandoffOrHero && (
        <div
          className="relative z-10 flex justify-between items-center text-[10px] font-utility-mono text-[#080808]/70 border-t border-[#080808]/20 pt-2"
          style={{
            opacity: Math.max(0, 1 - innerRevealRatio * 2),
          }}
        >
          <span>TARGET: 3D MONOCOQUE</span>
          <span className="font-bold">
            {displayProgress < 98 ? `ASSEMBLING ${Math.round(displayProgress)}%` : 'SYSTEM ARMED'}
          </span>
        </div>
      )}

      {/* Hero Stable State Overlay Tags (Benchmark Mode Only) */}
      {isFinalHero && isBenchmark && (
        <>
          <div className="absolute top-3 left-3 text-[10px] font-utility-mono text-white/40 tracking-wider">
            DOM/WEBGL SHARED BOUNDS
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] font-utility-mono text-[#CFFE16] tracking-wider">
            [DRAG POINTER TO DISPLACE]
          </div>
        </>
      )}
    </div>
  );
};
