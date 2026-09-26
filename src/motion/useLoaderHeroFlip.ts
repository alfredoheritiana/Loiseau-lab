import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

// Register GSAP Flip plugin
gsap.registerPlugin(Flip);

interface UseLoaderHeroFlipOptions {
  isHeroLayout: boolean;
  reducedMotion?: boolean;
  onFlipStart?: () => void;
  onFlipComplete?: () => void;
}

export function useLoaderHeroFlip({
  isHeroLayout,
  reducedMotion = false,
  onFlipStart,
  onFlipComplete,
}: UseLoaderHeroFlipOptions) {
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const isFirstRender = useRef(true);

  // Capture Flip state right before layout changes
  const captureFlipState = () => {
    flipStateRef.current = Flip.getState('[data-flip-id]', {
      props: 'borderRadius,backgroundColor,borderColor,opacity',
    });
  };

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (flipStateRef.current) {
      onFlipStart?.();

      Flip.from(flipStateRef.current, {
        duration: reducedMotion ? 0.35 : 1.45,
        ease: 'power4.out',
        targets: '[data-flip-id]',
        nested: true,
        absolute: true,
        onComplete: () => {
          flipStateRef.current = null;
          onFlipComplete?.();
        },
      });
    }
  }, [isHeroLayout, reducedMotion, onFlipStart, onFlipComplete]);

  return { captureFlipState };
}
