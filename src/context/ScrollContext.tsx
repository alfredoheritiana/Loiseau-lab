import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from './ExperienceContext';

gsap.registerPlugin(ScrollTrigger);

interface ScrollContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; duration?: number }) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  lenis: null,
  scrollTo: () => {},
});

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const { inputsRef, reducedMotion } = useExperience();

  useEffect(() => {
    // If reduced motion is explicitly preferred, use milder scroll settings
    const lenis = new Lenis({
      duration: reducedMotion ? 0.4 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !reducedMotion,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Synchronize Lenis with GSAP ScrollTrigger via single timing source
    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      if (inputsRef.current) {
        inputsRef.current.scrollY = e.scroll;
        inputsRef.current.scrollVelocity = e.velocity;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        inputsRef.current.normalizedScroll = maxScroll > 0 ? e.scroll / maxScroll : 0;
      }
    });

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    // Disable lag smoothing for precise frame-by-frame synchronization
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [inputsRef, reducedMotion]);

  const scrollTo = (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number }
  ) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: options?.offset ?? 0,
        duration: options?.duration ?? (reducedMotion ? 0.2 : 1.4),
      });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <ScrollContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => useContext(ScrollContext);
