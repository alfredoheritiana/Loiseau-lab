import React, { forwardRef } from 'react';

export interface LoaderFrameProps {
  displayProgress: number;
  innerRevealRatio: number; // 0 = solid lime, 1 = transparent to real 3D Canvas
  isHandoff: boolean;
  cornerOpacity?: number;
}

export const LoaderFrame = forwardRef<HTMLDivElement, LoaderFrameProps>(
  ({ displayProgress, innerRevealRatio, isHandoff, cornerOpacity = 1 }, ref) => {
    // Typography exit calculations (No glitch, smooth architectural motion)
    const refClip = isHandoff ? 50 : Math.min(50, innerRevealRatio * 50);
    const refTranslateY = isHandoff ? -16 : -innerRevealRatio * 14;
    const refOpacity = isHandoff ? 0 : Math.max(0, 1 - innerRevealRatio * 1.5);

    const labTranslateY = isHandoff ? 12 : innerRevealRatio * 10;
    const labOpacity = isHandoff ? 0 : Math.max(0, 1 - Math.max(0, innerRevealRatio - 0.15) * 1.6);

    const tagsOpacity = isHandoff ? 0 : Math.max(0, 1 - innerRevealRatio * 2.2);

    // Corner guides color: black on lime, turns Signal Lime #CFFE16 when aperture opens
    const isApertureRevealed = innerRevealRatio > 0.4 || isHandoff;
    const cornerBorderClass = isApertureRevealed ? 'border-[#CFFE16]' : 'border-[#080808]';

    return (
      <div
        ref={ref}
        className="relative flex flex-col justify-between p-6 pointer-events-none select-none w-[88vw] max-w-[480px] h-[300px] sm:h-[340px]"
        style={{
          border: isHandoff ? '1px solid rgba(207, 254, 22, 0.25)' : '1px solid rgba(8, 8, 8, 0.35)',
        }}
      >
        {/* 
          FOUR CORNER GUIDES:
          Travel with the frame during GSAP animation and match Hero target guides.
        */}
        <div
          className={`absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 transition-colors duration-200 ${cornerBorderClass}`}
          style={{ opacity: cornerOpacity }}
        />
        <div
          className={`absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 transition-colors duration-200 ${cornerBorderClass}`}
          style={{ opacity: cornerOpacity }}
        />
        <div
          className={`absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 transition-colors duration-200 ${cornerBorderClass}`}
          style={{ opacity: cornerOpacity }}
        />
        <div
          className={`absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 transition-colors duration-200 ${cornerBorderClass}`}
          style={{ opacity: cornerOpacity }}
        />

        {/* 
          LIME COVER LAYER (During 0–85% loading):
          Fades out around 88–92% to reveal the transparent hole through which the
          REAL Hero (mounted in PersistentCanvas at z-0) becomes visible!
          NO BLACK RECTANGLE.
        */}
        <div
          className="absolute inset-0 bg-[#CFFE16] pointer-events-none transition-opacity duration-300 rounded-[1px]"
          style={{
            opacity: Math.max(0, 1 - innerRevealRatio * 1.5),
          }}
        />

        {/* Sub-label: Top Spatial Alignment */}
        <div
          className="relative z-10 flex justify-between items-center text-[10px] font-utility-mono uppercase tracking-widest text-[#080808]/70"
          style={{
            opacity: isHandoff ? 0 : Math.max(0, 1 - innerRevealRatio * 2),
            transition: 'opacity 200ms ease',
          }}
        >
          <span>SPATIAL ALIGNMENT // 00</span>
          <span className="font-bold">SHARED ELEMENT ANCHOR</span>
        </div>

        {/* Center Typography Composition with Controlled Architectural Exit (No Glitch) */}
        <div className="relative z-10 my-auto text-center overflow-hidden py-1">
          {/* REFERENCE: Horizontal clip + upward translation */}
          <div
            style={{
              opacity: refOpacity,
              transform: `translateY(${refTranslateY}px)`,
              clipPath: `inset(0 ${refClip}% 0 ${refClip}%)`,
              transition: 'clip-path 300ms ease, transform 300ms ease, opacity 250ms ease',
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
              transition: 'transform 300ms ease 60ms, opacity 250ms ease 60ms',
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
              transition: 'opacity 200ms ease',
            }}
          >
            <span>[ LUSION.CO ]</span>
            <span className="opacity-40">×</span>
            <span>[ LANDONORRIS.COM ]</span>
          </div>
        </div>

        {/* Sub-label: Bottom Target Indicator */}
        <div
          className="relative z-10 flex justify-between items-center text-[10px] font-utility-mono text-[#080808]/70 border-t border-[#080808]/20 pt-2"
          style={{
            opacity: isHandoff ? 0 : Math.max(0, 1 - innerRevealRatio * 2),
            transition: 'opacity 200ms ease',
          }}
        >
          <span>TARGET: 3D MONOCOQUE</span>
          <span className="font-bold">
            {displayProgress < 98 ? `ASSEMBLING ${Math.round(displayProgress)}%` : 'SYSTEM ARMED'}
          </span>
        </div>
      </div>
    );
  }
);

LoaderFrame.displayName = 'LoaderFrame';
