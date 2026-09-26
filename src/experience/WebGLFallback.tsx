import React from 'react';

export const WebGLFallback: React.FC = () => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden bg-radial from-[#12160d] to-[#080808]"
      aria-label="Static Monocoque Fallback"
    >
      {/* High-Fidelity Static Monocoque Geometry representation */}
      <div className="relative w-72 h-72 rounded-full border border-[#CFFE16]/20 flex items-center justify-center animate-[pulse_4s_ease-in-out_infinite]">
        <div className="w-56 h-56 rounded-full border border-dashed border-[#CFFE16]/30 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#0e120a] via-[#1a2212] to-[#CFFE16]/20 border border-[#CFFE16]/40 shadow-[0_0_50px_rgba(207,254,22,0.15)] flex items-center justify-center">
            <span className="font-utility-mono text-[10px] text-[#CFFE16]/80 tracking-widest uppercase">
              STATIC CORE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
