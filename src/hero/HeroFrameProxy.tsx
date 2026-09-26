import React from 'react';

interface HeroFrameProxyProps {
  children?: React.ReactNode;
}

/**
 * HeroFrameProxy
 * Provides the spatial target for the GSAP Flip shared frame.
 * Centered vertically and horizontally in the sticky Hero viewport.
 */
export const HeroFrameProxy: React.FC<HeroFrameProxyProps> = ({ children }) => {
  return (
    <div className="relative z-10 mx-auto my-auto w-full max-w-xl h-72 sm:h-96 flex items-center justify-center pointer-events-auto">
      {children}
    </div>
  );
};
