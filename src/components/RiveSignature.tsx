import React, { useRef, useEffect } from 'react';

interface RiveSignatureProps {
  progress: number; // 0 to 1 scroll-controlled progress
}

export const RiveSignature: React.FC<RiveSignatureProps> = ({ progress }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const secondaryPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const secondary = secondaryPathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength}`;
    
    // Controllable by scroll progress
    const drawProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.6));
    const offset = pathLength * (1 - drawProgress);
    path.style.strokeDashoffset = `${offset}`;

    if (secondary) {
      const secLength = secondary.getTotalLength();
      secondary.style.strokeDasharray = `${secLength}`;
      const secOffset = secLength * (1 - Math.max(0, Math.min(1, (progress - 0.35) / 0.5)));
      secondary.style.strokeDashoffset = `${secOffset}`;
    }
  }, [progress]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-visible flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[140%] max-w-none h-auto -translate-x-[15%] select-none"
      >
        {/* Shadow stroke for depth */}
        <path
          d="M 60 480 C 180 460, 240 280, 360 260 C 460 240, 520 420, 640 380 C 740 340, 780 180, 890 140 C 940 120, 980 150, 990 200"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Primary Signal Green Graphic Vector Gesture */}
        <path
          ref={pathRef}
          d="M 50 470 C 170 450, 230 270, 350 250 C 450 230, 510 410, 630 370 C 730 330, 770 170, 880 130 C 930 110, 970 140, 980 190"
          stroke="#CFFE16"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-[stroke-dashoffset] duration-75"
        />

        {/* Secondary Delicate Orbit Line */}
        <path
          ref={secondaryPathRef}
          d="M 120 400 C 260 440, 480 180, 720 280 C 850 330, 920 220, 960 240"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
          opacity="0.8"
          className="transition-[stroke-dashoffset] duration-75"
        />
      </svg>
    </div>
  );
};
