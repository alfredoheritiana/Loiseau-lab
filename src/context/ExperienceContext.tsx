import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { QualityLevel, SceneId, DOMTrackedBounds, AppMode } from '../types';
import { profileDevice, DeviceProfile } from '../utils/deviceProfiler';
import { ReadinessStages } from '../loader/readinessStore';

interface ExperienceContextType {
  // App mode: Presentation (default) vs Benchmark
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;

  // Quality & motion
  qualityLevel: QualityLevel;
  setQualityLevel: (level: QualityLevel, isManual?: boolean) => void;
  deviceProfile: DeviceProfile;
  manualQualityOverride: boolean;
  reducedMotion: boolean;
  debugMode: boolean;
  setDebugMode: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Active scene & theme for HUD
  activeScene: SceneId;
  setActiveScene: (id: SceneId) => void;
  navTheme: 'dark' | 'light' | 'green' | 'blue' | 'immersive';
  setNavTheme: (theme: 'dark' | 'light' | 'green' | 'blue' | 'immersive') => void;

  // High-frequency mutable input refs (avoid React rerender per frame)
  inputsRef: React.RefObject<{
    pointerX: number; // -1 to 1
    pointerY: number; // -1 to 1
    pointerPxX: number;
    pointerPxY: number;
    pointerVelX: number;
    pointerVelY: number;
    pointerVel: number;
    pointerDown: boolean;
    scrollY: number;
    normalizedScroll: number;
    scrollVelocity: number;
    viewportWidth: number;
    viewportHeight: number;
    aspectRatio: number;
    dpr: number;
    // Local progress registers for key scenes
    sceneProgress: {
      hero: number;
      transition: number;
      marquee: number;
      rive: number;
      deformable: number;
      cardFullscreen: number;
      worldA: number;
      worldPortal: number;
      worldB: number;
      socialFan: number;
      finalRealtime: number;
    };
  }>;

  // Real adaptive readiness stages
  readiness: ReadinessStages;
  setReadinessStage: (stage: keyof ReadinessStages, value: boolean) => void;

  // DOM tracking for WebGL projection
  registerTrackedElement: (id: string, element: HTMLElement) => void;
  unregisterTrackedElement: (id: string) => void;
  getTrackedBounds: (id: string) => DOMTrackedBounds | null;

  // Intro & Loader Phase Synchronization
  introPhase: 'loading' | 'tension' | 'opening' | 'expanding' | 'settling' | 'ready';
  setIntroPhase: (phase: 'loading' | 'tension' | 'opening' | 'expanding' | 'settling' | 'ready') => void;

  // Diagnostics for dev panel
  fps: number;
  frameTime: number;
  activeSceneName: string;
}

const initialProfile = profileDevice();

const defaultInputs = {
  pointerX: 0,
  pointerY: 0,
  pointerPxX: 0,
  pointerPxY: 0,
  pointerVelX: 0,
  pointerVelY: 0,
  pointerVel: 0,
  pointerDown: false,
  scrollY: 0,
  normalizedScroll: 0,
  scrollVelocity: 0,
  viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1440,
  viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 900,
  aspectRatio: typeof window !== 'undefined' ? window.innerWidth / (window.innerHeight || 1) : 1.6,
  dpr: initialProfile.dpr,
  sceneProgress: {
    hero: 0,
    transition: 0,
    marquee: 0,
    rive: 0,
    deformable: 0,
    cardFullscreen: 0,
    worldA: 0,
    worldPortal: 0,
    worldB: 0,
    socialFan: 0,
    finalRealtime: 0,
  },
};

const ExperienceContext = createContext<ExperienceContextType | null>(null);

export const ExperienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode: Presentation is default, stored in localStorage
  const [appMode, setAppModeState] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('loiseau_ref_lab_mode');
      if (stored === 'benchmark' || stored === 'presentation') {
        return stored;
      }
    }
    return 'presentation';
  });

  const setAppMode = useCallback((mode: AppMode) => {
    setAppModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('loiseau_ref_lab_mode', mode);
    }
  }, []);

  const toggleAppMode = useCallback(() => {
    setAppModeState((prev) => {
      const next = prev === 'presentation' ? 'benchmark' : 'presentation';
      if (typeof window !== 'undefined') {
        localStorage.setItem('loiseau_ref_lab_mode', next);
      }
      return next;
    });
  }, []);

  const [qualityLevel, setQualityLevelState] = useState<QualityLevel>(initialProfile.tier);
  const [manualQualityOverride, setManualQualityOverride] = useState(false);

  const setQualityLevel = useCallback((level: QualityLevel, isManual: boolean = true) => {
    setQualityLevelState(level);
    if (isManual) {
      setManualQualityOverride(true);
    }
  }, []);

  const [readiness, setReadiness] = useState<ReadinessStages>({
    baseFontsDom: false,
    heroModule: false,
    sourceGeometryReady: false,
    particleSimulationReady: false,
    ghostCoreReady: false,
    shaderCompileReady: false,
    warmupReady: false,
  });

  const setReadinessStage = useCallback((stage: keyof ReadinessStages, value: boolean) => {
    setReadiness((prev) => (prev[stage] === value ? prev : { ...prev, [stage]: value }));
  }, []);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [activeScene, setActiveScene] = useState<SceneId>('scene-02-hero');
  const [navTheme, setNavTheme] = useState<'dark' | 'light' | 'green' | 'blue' | 'immersive'>('dark');
  const [introPhase, setIntroPhase] = useState<'loading' | 'tension' | 'opening' | 'expanding' | 'settling' | 'ready'>('loading');
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.6);

  const inputsRef = useRef({ ...defaultInputs });
  const trackedElementsRef = useRef<Map<string, { el: HTMLElement; bounds: DOMTrackedBounds }>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Check reduced motion & hardware capability
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setQualityLevel('LOW');
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) setQualityLevel('LOW');
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    // Initial DPR & quality adjustment
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setQualityLevel('MEDIUM');
      inputsRef.current.dpr = Math.min(window.devicePixelRatio, 1.25);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Keyboard shortcut for debug HUD (Tilde key ~ or Ctrl+D, and 'b' key for Benchmark mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '`' || e.key === '~' || (e.ctrlKey && e.key === 'd')) {
        toggleAppMode();
        setDebugMode((prev) => !prev);
      } else if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleAppMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAppMode]);

  // Pointer tracking with high-performance velocity calculation
  useEffect(() => {
    let lastTime = performance.now();
    let lastX = 0;
    let lastY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(now - lastTime, 1);
      const pxX = e.clientX;
      const pxY = e.clientY;

      const normX = (pxX / window.innerWidth) * 2 - 1;
      const normY = -(pxY / window.innerHeight) * 2 + 1;

      const velX = (pxX - lastX) / dt;
      const velY = (pxY - lastY) / dt;
      const speed = Math.sqrt(velX * velX + velY * velY);

      inputsRef.current.pointerX = normX;
      inputsRef.current.pointerY = normY;
      inputsRef.current.pointerPxX = pxX;
      inputsRef.current.pointerPxY = pxY;
      inputsRef.current.pointerVelX = velX;
      inputsRef.current.pointerVelY = velY;
      inputsRef.current.pointerVel = speed;

      lastTime = now;
      lastX = pxX;
      lastY = pxY;
    };

    const handlePointerDown = () => {
      inputsRef.current.pointerDown = true;
    };
    const handlePointerUp = () => {
      inputsRef.current.pointerDown = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // Window resize listener to cache viewport parameters
  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      inputsRef.current.viewportWidth = w;
      inputsRef.current.viewportHeight = h;
      inputsRef.current.aspectRatio = w / (h || 1);
      inputsRef.current.dpr = Math.min(window.devicePixelRatio || 1, qualityLevel === 'HIGH' ? 2 : 1.25);

      // Re-measure tracked elements
      trackedElementsRef.current.forEach((entry) => {
        const rect = entry.el.getBoundingClientRect();
        entry.bounds = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          visible: rect.bottom > 0 && rect.top < window.innerHeight,
        };
      });
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, [qualityLevel]);

  // Set up ResizeObserver for tracked elements
  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        for (const [id, item] of trackedElementsRef.current.entries()) {
          if (item.el === entry.target) {
            const rect = entry.target.getBoundingClientRect();
            item.bounds = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              visible: rect.bottom > 0 && rect.top < window.innerHeight,
            };
            break;
          }
        }
      });
    });

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  const registerTrackedElement = useCallback((id: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const bounds: DOMTrackedBounds = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      visible: rect.bottom > 0 && rect.top < window.innerHeight,
    };
    trackedElementsRef.current.set(id, { el: element, bounds });
    resizeObserverRef.current?.observe(element);
  }, []);

  const unregisterTrackedElement = useCallback((id: string) => {
    const entry = trackedElementsRef.current.get(id);
    if (entry && resizeObserverRef.current) {
      resizeObserverRef.current.unobserve(entry.el);
    }
    trackedElementsRef.current.delete(id);
  }, []);

  const getTrackedBounds = useCallback((id: string): DOMTrackedBounds | null => {
    return trackedElementsRef.current.get(id)?.bounds || null;
  }, []);

  // Performance monitor loop (FPS & frame timing estimate without lag)
  useEffect(() => {
    let frameCount = 0;
    let lastCheck = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      const delta = now - lastCheck;
      if (delta >= 1000) {
        const measuredFps = Math.round((frameCount * 1000) / delta);
        setFps(measuredFps);
        setFrameTime(parseFloat((delta / frameCount).toFixed(2)));
        frameCount = 0;
        lastCheck = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <ExperienceContext.Provider
      value={{
        appMode,
        setAppMode,
        toggleAppMode,
        qualityLevel,
        setQualityLevel,
        deviceProfile: initialProfile,
        manualQualityOverride,
        readiness,
        setReadinessStage,
        reducedMotion,
        debugMode,
        setDebugMode,
        activeScene,
        setActiveScene,
        navTheme,
        setNavTheme,
        introPhase,
        setIntroPhase,
        inputsRef,
        registerTrackedElement,
        unregisterTrackedElement,
        getTrackedBounds,
        fps,
        frameTime,
        activeSceneName: activeScene,
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
};

export const useExperience = () => {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error('useExperience must be used within an ExperienceProvider');
  }
  return context;
};
