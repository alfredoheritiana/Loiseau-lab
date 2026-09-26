import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { useScroll } from '../context/ScrollContext';

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    id: '#scene-02-hero',
    num: '01',
    title: 'MEDIA HERO & PHYSICS',
    category: 'LUSION / LANDO HYBRID',
    desc: 'Central monocoque geometry, PBR materials, instanced pointer repulsion, and rotation inertia.',
  },
  {
    id: '#scene-04-marquee',
    num: '02',
    title: 'FRAMED MEDIA & MARQUEE',
    category: 'LANDO EDITORIAL',
    desc: 'Massive moving typography occluded by stable editorial media framing.',
  },
  {
    id: '#scene-06-manifesto',
    num: '03',
    title: 'EDITORIAL MANIFESTO',
    category: 'TYPOGRAPHIC CONTRAST',
    desc: 'Extreme scale contrast between grotesque and high-contrast serif with signal highlights.',
  },
  {
    id: '#scene-07-deformable',
    num: '04',
    title: 'DEFORMABLE MEDIA WINDOW',
    category: 'LUSION SHADER',
    desc: 'Subdivided plane tracking DOM container with interactive vertex displacement and spring return.',
  },
  {
    id: '#scene-08-collage',
    num: '05',
    title: 'EDITORIAL COLLAGE',
    category: 'LANDO COMPOSITION',
    desc: 'Layered parallax composition with data-depth and dark-to-light theme transition.',
  },
  {
    id: '#scene-09-split',
    num: '06',
    title: 'SYSTEM / EXPRESSION SPLIT',
    category: 'TAXONOMY COMPOSITION',
    desc: 'Full-viewport conceptual division translating structural logic into poster art.',
  },
  {
    id: '#scene-10-collection',
    num: '07',
    title: 'COLLECTION ARCHIVE GRID',
    category: 'LANDO HALL OF FAME',
    desc: '12 high-density abstract objects with hover crop reveal and metadata precision.',
  },
  {
    id: '#scene-11-fullscreen-card',
    num: '08',
    title: 'CARD TO FULLSCREEN PORTAL',
    category: 'LUSION TRANSITION',
    desc: 'Continuous expansion of media card into WebGL camera spline tunnel without rendering cut.',
  },
  {
    id: '#scene-12-world-a',
    num: '09',
    title: 'IMMERSIVE WORLDS A & B',
    category: 'LUSION PERSISTENT 3D',
    desc: 'Deterministic scroll-as-time camera spline travel through geometric tunnel and blue corridor with shared persistent object.',
  },
  {
    id: '#scene-16-social-fan',
    num: '10',
    title: 'SOCIAL FAN CHOREOGRAPHY',
    category: 'LANDO SOCIAL CARDS',
    desc: 'Stacked card cluster fanning out horizontally with rotation and elevation spread.',
  },
  {
    id: '#scene-17-final',
    num: '11',
    title: 'CLOSURE REALTIME SCENE',
    category: 'NARRATIVE SYSTEM',
    desc: 'Re-emergence of persistent visual element providing spatial closure.',
  },
];

export const FullscreenMenu: React.FC<FullscreenMenuProps> = ({ isOpen, onClose }) => {
  const { scrollTo, lenis } = useScroll();
  const [hoveredItem, setHoveredItem] = useState(menuItems[0]);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard navigation & scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Lock scroll via Lenis while menu is open
    lenis?.stop();
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      lenis?.start();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, lenis, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (id: string) => {
    onClose();
    setTimeout(() => {
      scrollTo(id, { duration: 1.2 });
    }, 150);
  };

  return (
    <div
      ref={menuContainerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-50 bg-[#121610] text-[#ECEEE5] flex flex-col justify-between p-6 md:p-12 overflow-y-auto"
    >
      {/* Header bar inside menu */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="font-bold tracking-tight text-lg text-white">REF LAB 00</span>
          <span className="text-xs font-utility-mono text-[#CFFE16]">SYSTEM ARCHIVE INDEX</span>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="group flex items-center gap-2 text-xs font-utility-mono uppercase tracking-wider text-[#ECEEE5] hover:text-[#CFFE16] px-3 py-1.5 border border-white/20 hover:border-[#CFFE16] cursor-pointer"
          aria-label="Close Navigation Menu"
        >
          <span>CLOSE [ESC]</span>
          <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      {/* Main Content: Split List & Active Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
        {/* Navigation Item List */}
        <div className="lg:col-span-8 flex flex-col gap-1 pr-0 lg:pr-8 max-h-[60vh] overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isHovered = hoveredItem.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item)}
                className={`group flex items-baseline justify-between text-left py-2.5 px-3 border-b border-white/5 transition-all duration-200 cursor-pointer ${
                  isHovered ? 'bg-white/5 pl-5' : 'hover:pl-4'
                }`}
              >
                <div className="flex items-baseline gap-4">
                  <span className={`text-xs font-utility-mono ${isHovered ? 'text-[#CFFE16]' : 'text-white/40'}`}>
                    {item.num}
                  </span>
                  <span
                    className={`text-xl sm:text-2xl md:text-3xl font-editorial-sans tracking-tight transition-colors ${
                      isHovered ? 'text-[#CFFE16]' : 'text-[#ECEEE5]'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-utility-mono text-white/40">
                  <span className="hidden sm:inline">{item.category}</span>
                  <ArrowUpRight className={`w-4 h-4 transition-transform ${isHovered ? 'translate-x-1 -translate-y-1 text-[#CFFE16]' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Media Preview & Benchmark Note */}
        <div className="lg:col-span-4 hidden lg:flex flex-col justify-between border-l border-white/10 pl-8">
          <div>
            <div className="text-[11px] font-utility-mono text-[#CFFE16] tracking-widest uppercase mb-2">
              ACTIVE BENCHMARK FOCUS
            </div>
            <div className="text-2xl font-editorial-serif text-white mb-2">
              {hoveredItem.title}
            </div>
            <p className="text-sm text-[#ECEEE5]/70 leading-relaxed font-sans mb-6">
              {hoveredItem.desc}
            </p>
            <div className="p-4 bg-[#181E15] border border-white/10 text-xs font-utility-mono text-white/70 space-y-1.5">
              <div className="flex justify-between">
                <span>TARGET SPEC:</span>
                <span className="text-white font-medium">{hoveredItem.category}</span>
              </div>
              <div className="flex justify-between">
                <span>MECHANISM ID:</span>
                <span className="text-[#CFFE16] font-mono">{hoveredItem.num} / 11</span>
              </div>
              <div className="flex justify-between">
                <span>DETERMINISM:</span>
                <span className="text-[#CFFE16]">SCROLL-AS-TIME</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-xs text-white/40 font-utility-mono">
            PRESS [ESC] TO RETURN TO CANVAS
          </div>
        </div>
      </div>

      {/* Footer bar inside menu */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-utility-mono text-white/40 border-t border-white/10 pt-4 shrink-0">
        <div>LOISEAU ARCHIVE — REFERENCE LAB 00</div>
        
        <div className="flex items-center gap-4">
          <span>LUSION.CO × LANDONORRIS.COM</span>
        </div>
      </div>
    </div>
  );
};
