import React, { useState } from 'react';
import { GlobalNavigation } from '../components/GlobalNavigation';
import { FullscreenMenu } from '../components/FullscreenMenu';
import { BenchmarkOverlay } from './BenchmarkOverlay';
import { useExperience } from '../context/ExperienceContext';

interface GlobalShellProps {
  isEntered?: boolean;
}

export const GlobalShell: React.FC<GlobalShellProps> = ({ isEntered = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { introPhase } = useExperience();

  // Navigation enters smoothly during settling / ready
  const navVisible = isEntered && (introPhase === 'settling' || introPhase === 'ready');

  return (
    <>
      {/* Top Editorial HUD Navigation */}
      <GlobalNavigation
        isEntered={navVisible}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* Fullscreen Takeover Menu */}
      <FullscreenMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Diagnostics Telemetry Overlay (Isolated fixed layer in Benchmark Mode) */}
      <BenchmarkOverlay />
    </>
  );
};
