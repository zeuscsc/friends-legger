'use client';

import React from 'react';

interface WarpContainerProps {
  isSwapped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
}

const WarpContainer: React.FC<WarpContainerProps> = ({ isSwapped, front, back }) => {
  return (
    <div className="w-full h-full min-h-screen relative overflow-hidden bg-gray-950">
      {/* Front View (Friend's Legger) */}
      <div 
        className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto overflow-x-hidden z-10 ${
          isSwapped ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
      >
        {front}
      </div>

      {/* Back View (HSBC App) */}
      <div 
        className={`absolute inset-0 w-full h-full transition-all duration-700 delay-100 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-y-auto overflow-x-hidden z-20 ${
          isSwapped 
            ? 'translate-x-0 scale-100 opacity-100' 
            : 'translate-x-full scale-90 opacity-0'
        }`}
      >
        {back}
      </div>

      {/* Background overlay for depth during transition */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-700 pointer-events-none z-0 ${
        isSwapped ? 'opacity-40' : 'opacity-0'
      }`}></div>
    </div>
  );
};

export default WarpContainer;
