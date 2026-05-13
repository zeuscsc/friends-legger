import React from 'react';
import { AiAnalysis } from '@/types';

interface AiInsightsProps {
  analysis: AiAnalysis;
}

const AiInsights: React.FC<AiInsightsProps> = ({ analysis }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const categoryPriority = ['Subscription', 'Cloud Services', 'Dining', 'Entertainment', 'Travel', 'Groceries', 'Bills', 'Payment'];

  const groupedSpending = analysis.discretionarySpending.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = { items: [], total: 0 };
    acc[category].items.push(item);
    acc[category].total += item.amount;
    return acc;
  }, {} as Record<string, { items: typeof analysis.discretionarySpending; total: number }>);

  const sortedCategories = Object.keys(groupedSpending).sort((a, b) => {
    const indexA = categoryPriority.indexOf(a);
    const indexB = categoryPriority.indexOf(b);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-gradient-to-br from-red-950 to-gray-900 p-4 md:p-6 rounded-xl shadow-sm border border-red-900 mb-6 md:mb-8">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <div className="bg-red-600 p-1 md:p-1.5 rounded-full flex-shrink-0">
          <svg className="w-4 md:w-5 h-4 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-base md:text-xl font-bold text-gray-100 flex-1">AI Insights</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden flex-shrink-0 p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle insights"
        >
            <svg className={'w-5 h-5 text-gray-400 transition-transform ' + (isExpanded ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {isExpanded || (typeof window !== 'undefined' && window.innerWidth >= 768) ? (
        <>
            <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-6 leading-relaxed">
            {analysis.summary}
          </p>

          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Suggested Discretionary Cuts
            </h3>
            
            {sortedCategories.map((category) => (
              <details key={category} className="group bg-gray-800/50 rounded-lg border border-red-900/30 overflow-hidden transition-all">
                <summary className="p-3 md:p-4 cursor-pointer font-semibold text-sm md:text-base text-gray-100 flex justify-between items-center list-none hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-red-500">
                      <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span>{category} <span className="text-xs text-gray-500 ml-1 font-normal">({groupedSpending[category].items.length} items)</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm md:text-base font-bold text-gray-100">HKD {groupedSpending[category].total.toFixed(2)}</span>
                  </div>
                </summary>
                
                <div className="p-3 md:p-4 pt-0 space-y-3 border-t border-red-900/20 mt-1 bg-gray-900/30">
                  {groupedSpending[category].items.map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 py-2 border-b border-gray-800 last:border-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm md:text-base text-gray-200 truncate">{item.description}</h4>
                        <p className="text-xs md:text-sm text-gray-400 italic line-clamp-2">&quot;{item.reason}&quot;</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm md:text-base font-semibold text-red-400">- HKD {item.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
          
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-red-900 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <span className="text-sm md:text-base text-gray-400 font-medium">Total Potential Savings:</span>
            <span className="text-xl md:text-2xl font-black text-red-600">HKD {analysis.totalDiscretionaryAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 mb-3">Click to expand full insights</p>
        </div>
      )}
    </div>
  );
};

export default AiInsights;
