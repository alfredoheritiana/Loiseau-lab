import React, { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../context/ExperienceContext';
import { CollectionItem } from '../types';

const collectionItems: CollectionItem[] = [
  { id: 'c1', index: '01', year: '2024', title: 'MONOCOQUE V.01', category: 'STRUCTURAL', color: '#161914', accent: '#CFFE16', geometryType: 'torus' },
  { id: 'c2', index: '02', year: '2024', title: 'VENTURI FLUTE', category: 'AERODYNAMICS', color: '#14161B', accent: '#2140FF', geometryType: 'cylinder' },
  { id: 'c3', index: '03', year: '2024', title: 'APEX SPLITTER', category: 'SURFACE', color: '#1A1814', accent: '#FF5522', geometryType: 'octahedron' },
  { id: 'c4', index: '04', year: '2025', title: 'VORTEX CORE', category: 'AERODYNAMICS', color: '#151915', accent: '#CFFE16', geometryType: 'knot' },
  { id: 'c5', index: '05', year: '2025', title: 'CHASSIS SPINE', category: 'STRUCTURAL', color: '#17151C', accent: '#A020F0', geometryType: 'dodecahedron' },
  { id: 'c6', index: '06', year: '2025', title: 'DIFFUSER BLADE', category: 'SURFACE', color: '#191515', accent: '#FF3333', geometryType: 'icosahedron' },
  { id: 'c7', index: '07', year: '2025', title: 'TORSION STRUT', category: 'STRUCTURAL', color: '#141818', accent: '#00E5FF', geometryType: 'cylinder' },
  { id: 'c8', index: '08', year: '2026', title: 'CANOPY SHROUD', category: 'MONOCOQUE', color: '#1B1A14', accent: '#FFD700', geometryType: 'torus' },
  { id: 'c9', index: '09', year: '2026', title: 'HALO FAIRING', category: 'MONOCOQUE', color: '#181519', accent: '#FF0099', geometryType: 'octahedron' },
  { id: 'c10', index: '10', year: '2026', title: 'FLIGHT WINGLET', category: 'AERODYNAMICS', color: '#141A16', accent: '#CFFE16', geometryType: 'knot' },
  { id: 'c11', index: '11', year: '2026', title: 'ACTUATOR VALVE', category: 'STRUCTURAL', color: '#15171B', accent: '#2140FF', geometryType: 'dodecahedron' },
  { id: 'c12', index: '12', year: '2026', title: 'GROUND VENTURE', category: 'SURFACE', color: '#191914', accent: '#ECEEE5', geometryType: 'icosahedron' },
];

export const Scene10_CollectionGrid: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { setActiveScene, setNavTheme } = useExperience();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        setActiveScene('scene-10-collection');
        setNavTheme('dark');
      },
      onEnterBack: () => {
        setActiveScene('scene-10-collection');
        setNavTheme('dark');
      },
    });

    return () => trigger.kill();
  }, [setActiveScene, setNavTheme]);

  return (
    <section
      id="scene-10-collection"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#0A0C09] text-[#ECEEE5] p-6 sm:p-12 md:p-16 border-b border-white/10"
    >
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 border-b border-white/10 pb-8">
        <div>
          <div className="text-xs font-utility-mono text-[#CFFE16] uppercase tracking-widest mb-1">
            10 // LANDO HELMET HALL OF FAME ARCHITECTURE
          </div>
          <h2 className="text-4xl sm:text-6xl font-editorial-sans font-black tracking-tight uppercase text-white">
            COLLECTION <span className="font-editorial-serif italic font-normal text-white/70">Archive</span>
          </h2>
        </div>
        <div className="text-xs font-utility-mono text-white/50 text-right space-y-1">
          <div>TOTAL REGISTERED ARTIFACTS: 12</div>
          <div>HOVER FOR ALTERNATE PROCEDURAL CROPS</div>
        </div>
      </div>

      {/* 12-Item High Density CSS Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {collectionItems.map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative bg-[#131612] border border-white/10 hover:border-white/40 transition-all duration-300 flex flex-col justify-between p-4 cursor-pointer overflow-hidden"
            >
              {/* Top metadata */}
              <div className="flex items-center justify-between font-utility-mono text-[11px] text-white/50 mb-3">
                <span className="group-hover:text-[#CFFE16] transition-colors font-bold">{item.index}</span>
                <span>{item.year}</span>
              </div>

              {/* Procedural Visual Artifact Thumbnail */}
              <div className="relative w-full aspect-square bg-[#0B0D0A] border border-white/5 overflow-hidden flex items-center justify-center my-2 transition-transform duration-500 group-hover:scale-98">
                {/* Visual geometric pattern tailored to geometryType */}
                <div
                  className="w-24 h-24 rounded-lg border-2 transition-all duration-500 flex items-center justify-center"
                  style={{
                    borderColor: isHovered ? item.accent : 'rgba(255,255,255,0.2)',
                    transform: isHovered ? 'rotate(45deg) scale(1.15)' : 'rotate(0deg) scale(1)',
                    backgroundColor: isHovered ? `${item.accent}15` : 'transparent',
                  }}
                >
                  <div
                    className="w-12 h-12 border border-dashed transition-transform duration-700"
                    style={{
                      borderColor: isHovered ? item.accent : 'rgba(255,255,255,0.4)',
                      transform: isHovered ? 'rotate(-90deg)' : 'rotate(0deg)',
                    }}
                  />
                </div>

                {/* Subtle crop overlay on hover */}
                {isHovered && (
                  <div className="absolute bottom-2 right-2 text-[9px] font-utility-mono px-1.5 py-0.5 bg-black text-[#CFFE16]">
                    INSPECT
                  </div>
                )}
              </div>

              {/* Bottom Title & Category */}
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="text-[10px] font-utility-mono text-white/40 tracking-wider mb-0.5">
                  {item.category}
                </div>
                <h3 className="text-sm sm:text-base font-editorial-sans font-bold text-white uppercase tracking-tight group-hover:text-[#CFFE16] transition-colors truncate">
                  {item.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Note */}
      <div className="mt-12 pt-6 border-t border-white/10 flex justify-between text-[11px] font-utility-mono text-white/40">
        <span>LANDO HIGH-DENSITY EDITORIAL PROPORTIONS</span>
        <span>NO EXCESSIVE MOTION · PURE ART DIRECTION</span>
      </div>
    </section>
  );
};
