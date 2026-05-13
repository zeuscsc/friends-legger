import React from 'react';
import { CardRecommendation } from '@/types';

interface CardRecommendationsProps {
  recommendations: CardRecommendation[];
}

const CardRecommendations: React.FC<CardRecommendationsProps> = ({ recommendations }) => {
  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-lg md:text-xl font-bold text-gray-200 mb-4 md:mb-6">Recommended for You</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {recommendations.map((card) => (
          <div key={card.id} className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden flex flex-col">
            <div className="h-40 md:h-48 bg-gray-900 flex items-center justify-center p-0 overflow-hidden">
               {card.imageUrl ? (
                 <img 
                   src={card.imageUrl} 
                   alt={card.cardName} 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="border-2 border-gray-700 rounded-lg w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm text-center m-4">
                   {card.imagePlaceholder}
                 </div>
               )}
            </div>
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              <h3 className="text-base md:text-lg font-bold text-gray-100 mb-1">{card.cardName}</h3>
              <p className="text-xs text-red-600 font-semibold uppercase mb-2 md:mb-3">{card.rewardType}</p>
              <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4 flex-1">{card.benefit}</p>
              <div className="pt-3 md:pt-4 border-t border-gray-700">
                <p className="text-[10px] text-gray-500 uppercase mb-2">Recommended for</p>
                <span className="inline-block px-3 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">
                  {card.recommendedFor}
                </span>
              </div>
              <button className="mt-4 md:mt-6 w-full py-2.5 md:py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base">
                Learn More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardRecommendations;
