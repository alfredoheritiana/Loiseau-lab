import React, { useState } from 'react';
import { useExperience } from './context/ExperienceContext';
import { ExperienceRoot } from './experience/ExperienceRoot';
import { PersistentCanvas } from './webgl/PersistentCanvas';
import { GlobalShell } from './shell/GlobalShell';
import { ReferenceLoader } from './loader/ReferenceLoader';

// Benchmark Scenes in Exact Sequential Specification Order
import { Scene02_03_Hero } from './scenes/Scene02_03_Hero';
import { Scene04_05_FramedMarquee } from './scenes/Scene04_05_FramedMarquee';
import { Scene06_Manifesto } from './scenes/Scene06_Manifesto';
import { Scene07_DeformableMedia } from './scenes/Scene07_DeformableMedia';
import { Scene08_EditorialCollage } from './scenes/Scene08_EditorialCollage';
import { Scene09_ConceptualSplit } from './scenes/Scene09_ConceptualSplit';
import { Scene10_CollectionGrid } from './scenes/Scene10_CollectionGrid';
import { Scene11_CardToFullscreen } from './scenes/Scene11_CardToFullscreen';
import { Scene12_14_ImmersiveBridge } from './scenes/Scene12_14_ImmersiveBridge';
import { Scene15_EditorialCampaign } from './scenes/Scene15_EditorialCampaign';
import { Scene16_SocialFan } from './scenes/Scene16_SocialFan';
import { Scene17_FinalRealtime } from './scenes/Scene17_FinalRealtime';
import { Scene18_Footer } from './scenes/Scene18_Footer';

export function AppContent() {
  const [isLoaderActive, setIsLoaderActive] = useState(true);
  const { introPhase } = useExperience();

  const isNavEntered = !isLoaderActive || introPhase === 'settling' || introPhase === 'ready';

  return (
    <div className="relative min-h-screen bg-[#080808] text-[#ECEEE5] selection:bg-[#CFFE16] selection:text-[#080808]">
      {/* SCENE 01: BRANDED REFERENCE LOADER (GSAP Flip + Shared Frame) */}
      {isLoaderActive && (
        <ReferenceLoader onComplete={() => setIsLoaderActive(false)} />
      )}

      {/* PERSISTENT WEBGL CANVAS (One persistent renderer across all scenes) */}
      <PersistentCanvas />

      {/* GLOBAL SHELL (Top Navigation, Menu Takeover, Benchmark HUD) */}
      <GlobalShell isEntered={isNavEntered} />

      {/* SEMANTIC ACCESSIBLE MAIN DOM VIEWPORT */}
      <main id="main-content" className="relative z-10 w-full overflow-x-hidden">
        {/* SCENES 02 & 03: MEDIA-DOMINANT HERO + SHARED ELEMENT TRANSITION */}
        <Scene02_03_Hero />

        {/* SCENES 04 & 05: FRAMED MEDIA + GIANT MARQUEE + RIVE VECTOR SIGNATURE */}
        <Scene04_05_FramedMarquee />

        {/* SCENE 06: EDITORIAL MANIFESTO */}
        <Scene06_Manifesto />

        {/* SCENE 07: LUSION-STYLE DEFORMABLE MEDIA WINDOW */}
        <Scene07_DeformableMedia />

        {/* SCENE 08: LANDO-STYLE EDITORIAL COLLAGE */}
        <Scene08_EditorialCollage />

        {/* SCENE 09: CONCEPTUAL SPLIT (SYSTEM / EXPRESSION) */}
        <Scene09_ConceptualSplit />

        {/* SCENE 10: COLLECTION ARCHIVE GRID (12+ ARTIFACTS) */}
        <Scene10_CollectionGrid />

        {/* SCENE 11: CARD TO FULLSCREEN TRANSITION */}
        <Scene11_CardToFullscreen />

        {/* SCENES 12, 13 & 14: IMMERSIVE WORLD A (SPLINE TUNNEL), PORTAL & WORLD B */}
        <Scene12_14_ImmersiveBridge />

        {/* SCENE 15: EDITORIAL CAMPAIGN POSTER */}
        <Scene15_EditorialCampaign />

        {/* SCENE 16: SOCIAL CARD FAN CHOREOGRAPHY */}
        <Scene16_SocialFan />

        {/* SCENE 17: FINAL REALTIME SCENE (PERSISTENT OBJECT CLOSURE) */}
        <Scene17_FinalRealtime />

        {/* SCENE 18: CALM ARCHIVAL FOOTER */}
        <Scene18_Footer />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ExperienceRoot>
      <AppContent />
    </ExperienceRoot>
  );
}
