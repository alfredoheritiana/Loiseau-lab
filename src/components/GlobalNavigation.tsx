import React from 'react';
import { useExperience } from '../context/ExperienceContext';
import { useScroll } from '../context/ScrollContext';
import { Menu, Activity, Eye, SlidersHorizontal, Sparkles } from 'lucide-react';

interface GlobalNavProps {
  onOpenMenu: () => void;
  isEntered?: boolean;
}

export const GlobalNavigation: React.FC<GlobalNavProps> = ({ onOpenMenu, isEntered = true }) => {
  const {
    navTheme,
    activeScene,
    debugMode,
    setDebugMode,
    appMode,
    setAppMode,
    toggleAppMode,
    fps,
  } = useExperience();
  const { scrollTo } = useScroll();

  // Dynamic theme colors adapting to scroll territory
  const isLight = navTheme === 'light';
  const isGreen = navTheme === 'green';
  const isBlue = navTheme === 'blue';

  const textColor = isGreen
    ? 'text-[#080808]'
    : isLight
    ? 'text-[#181A17]'
    : isBlue
    ? 'text-[#FFFFFF]'
    : 'text-[#ECEEE5]';

  const subColor = isGreen
    ? 'text-[#080808]/70'
    : isLight
    ? 'text-[#181A17]/60'
    : 'text-[#ECEEE5]/60';

  const borderStyle = isLight ? 'border-[#181A17]/10' : 'border-white/10';

  const isBenchmark = appMode === 'benchmark';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-colors duration-500 pointer-events-auto backdrop-blur-[4px]"
      role="banner"
    >
      <div
        className={`flex items-center justify-between px-6 md:px-12 py-4 border-b ${borderStyle} transition-opacity duration-500 ${
          isEntered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Zone 1: Brand Title Wordmark */}
        <div
          className={`flex items-center gap-3 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] delay-0 ${
            isEntered ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
          }`}
        >
          <button
            onClick={() => scrollTo(0)}
            className="group flex items-baseline gap-2 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#CFFE16]"
            aria-label="LOISEAU Reference Lab 00 Home"
          >
            <span className={`text-base font-bold tracking-tight uppercase ${textColor}`}>
              LOISEAU
            </span>
            <span className={`text-xs font-utility-mono tracking-widest ${subColor}`}>
              REF LAB 00
            </span>
          </button>

          {/* Benchmark Context Chip (Compact and understated) */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-utility-mono tracking-wider ${
              isLight
                ? 'border-[#181A17]/15 text-[#181A17]/70'
                : 'border-white/15 text-white/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#CFFE16]" />
            <span>LUSION × LANDO CORE</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean unboxed editorial links) */}
        <nav
          className={`hidden md:flex items-center gap-7 text-xs font-utility-mono uppercase tracking-wider transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[60ms] ${
            isEntered ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
          }`}
          aria-label="Primary Navigation"
        >
          <button
            onClick={() => scrollTo('#scene-02-hero')}
            className={`transition-colors hover:text-[#CFFE16] cursor-pointer ${
              activeScene.includes('hero') ? 'text-[#CFFE16] font-bold' : subColor
            }`}
          >
            01. Hero
          </button>
          <button
            onClick={() => scrollTo('#scene-04-marquee')}
            className={`transition-colors hover:text-[#CFFE16] cursor-pointer ${
              activeScene.includes('marquee') || activeScene.includes('rive')
                ? 'text-[#CFFE16] font-bold'
                : subColor
            }`}
          >
            02. Marquee
          </button>
          <button
            onClick={() => scrollTo('#scene-07-deformable')}
            className={`transition-colors hover:text-[#CFFE16] cursor-pointer ${
              activeScene.includes('deformable') ? 'text-[#CFFE16] font-bold' : subColor
            }`}
          >
            03. Deformable
          </button>
          <button
            onClick={() => scrollTo('#scene-09-split')}
            className={`transition-colors hover:text-[#CFFE16] cursor-pointer ${
              activeScene.includes('split') ? 'text-[#CFFE16] font-bold' : subColor
            }`}
          >
            04. Split
          </button>
          <button
            onClick={() => scrollTo('#scene-10-collection')}
            className={`transition-colors hover:text-[#CFFE16] cursor-pointer ${
              activeScene.includes('collection') ? 'text-[#CFFE16] font-bold' : subColor
            }`}
          >
            05. Collection
          </button>
          <button
            onClick={() => scrollTo('#scene-11-fullscreen-card')}
            className={`transition-colors hover:text-[#CFFE16] cursor-pointer ${
              activeScene.includes('world') || activeScene.includes('card')
                ? 'text-[#CFFE16] font-bold'
                : subColor
            }`}
          >
            06. Worlds
          </button>
        </nav>

        {/* Zone 3: Actions — Mode Selector & Menu */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher: PRESENTATION vs BENCHMARK */}
          <div
            className={`flex items-center p-0.5 border text-[11px] font-utility-mono transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[120ms] ${
              isEntered ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
            } ${
              isLight ? 'border-[#181A17]/20 bg-white/40' : 'border-white/15 bg-black/40'
            }`}
            role="radiogroup"
            aria-label="View Mode Selector"
          >
            {/* Presentation Mode Button */}
            <button
              onClick={() => setAppMode('presentation')}
              role="radio"
              aria-checked={!isBenchmark}
              className={`px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                !isBenchmark
                  ? isLight
                    ? 'bg-[#181A17] text-white shadow-sm font-semibold'
                    : 'bg-[#CFFE16] text-[#080808] shadow-sm font-bold'
                  : `${subColor} hover:text-white`
              }`}
              title="Presentation Mode: Refined, unpolluted visual experience"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PRESENTATION</span>
            </button>

            {/* Benchmark Mode Button */}
            <button
              onClick={() => {
                setAppMode('benchmark');
                setDebugMode(true);
              }}
              role="radio"
              aria-checked={isBenchmark}
              className={`px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                isBenchmark
                  ? isLight
                    ? 'bg-[#181A17] text-white shadow-sm font-semibold'
                    : 'bg-[#CFFE16] text-[#080808] shadow-sm font-bold'
                  : `${subColor} hover:text-white`
              }`}
              title="Benchmark Mode: Reveals telemetry and inspection overlays [Key: B]"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">BENCHMARK</span>
              {isBenchmark && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#080808] animate-ping ml-0.5" />
              )}
            </button>
          </div>

          {/* Quick FPS readout (visible only in Benchmark Mode) */}
          {isBenchmark && (
            <button
              onClick={() => setDebugMode((prev) => !prev)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-utility-mono border border-[#CFFE16]/50 text-[#CFFE16] bg-black/60 cursor-pointer min-h-[38px]"
              title="Toggle Telemetry Console (~)"
            >
              <span className="font-bold">{fps} FPS</span>
            </button>
          )}

          {/* Fullscreen Menu Trigger (Accessible 44px touch target) */}
          <button
            onClick={onOpenMenu}
            className={`flex items-center justify-center gap-2 text-xs font-utility-mono font-semibold uppercase tracking-wider px-3.5 min-h-[40px] border transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[180ms] cursor-pointer ${
              isEntered ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
            } ${
              isGreen
                ? 'border-[#080808] text-[#080808] hover:bg-[#080808] hover:text-[#CFFE16]'
                : 'border-white/20 text-[#ECEEE5] hover:border-[#CFFE16] hover:text-[#CFFE16]'
            }`}
            aria-label="Open Fullscreen Navigation Menu"
          >
            <Menu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MENU</span>
          </button>
        </div>
      </div>
    </header>
  );
};
