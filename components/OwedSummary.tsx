'use client';

import React, { useState } from 'react';
import { ExpenseSplit, Transaction } from '@/types';

interface OwedSummaryProps {
  splits: ExpenseSplit[];
  transactions: Transaction[];
}

const OwedSummary: React.FC<OwedSummaryProps> = ({ splits, transactions }) => {
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  // Calculate total owed (excluding paid ones)
  const totalOwed = splits.reduce((acc, split) => {
    const unpaid = split.people
      .filter(p => !p.hasPaid)
      .reduce((sum, p) => sum + p.amountOwed, 0);
    return acc + unpaid;
  }, 0);

  // Group by person name with transaction details
  const friendBreakdown: { [key: string]: { total: number; details: { description: string; amount: number; date: string }[] } } = {};
  
  splits.forEach(split => {
    const transaction = transactions.find(t => t.id === split.transactionId);
    split.people.forEach(p => {
      if (!p.hasPaid) {
        if (!friendBreakdown[p.name]) {
          friendBreakdown[p.name] = { total: 0, details: [] };
        }
        friendBreakdown[p.name].total += p.amountOwed;
        friendBreakdown[p.name].details.push({
          description: transaction?.description || 'Unknown Transaction',
          amount: p.amountOwed,
          date: transaction?.transDate || ''
        });
      }
    });
  });

  const friends = Object.entries(friendBreakdown).map(([name, data]) => ({ name, ...data }));

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Owed Card */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Total Owed to You</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-400">
              HKD {totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">From {friends.length} friends</p>
        </div>

        {/* Friends Breakdown Card */}
        <div className="md:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Breakdown by Friend</h3>
          {friends.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No outstanding debts. Everyone is even!</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {friends.map(({ name, total }) => (
                <button 
                  key={name} 
                  onClick={() => setSelectedFriend(selectedFriend === name ? null : name)}
                  className={`px-4 py-2 rounded-lg border transition-all flex flex-col text-left ${
                    selectedFriend === name 
                      ? 'bg-red-600 border-red-500 shadow-lg shadow-red-900/20' 
                      : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <span className={`text-sm font-semibold ${selectedFriend === name ? 'text-white' : 'text-gray-100'}`}>{name}</span>
                  <span className={`text-xs font-medium ${selectedFriend === name ? 'text-red-100' : 'text-green-400'}`}>
                    HKD {total.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View for Selected Friend */}
      {selectedFriend && friendBreakdown[selectedFriend] && (
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-100">Debt Details: {selectedFriend}</h4>
            <button onClick={() => setSelectedFriend(null)} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {friendBreakdown[selectedFriend].details.map((detail, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-200">{detail.description}</p>
                  <p className="text-xs text-gray-500">{detail.date}</p>
                </div>
                <span className="text-sm font-bold text-green-400">HKD {detail.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-4 flex justify-between items-center border-t border-gray-600 mt-2">
              <span className="text-sm font-bold text-gray-100">Total Outstanding</span>
              <span className="text-lg font-black text-green-400">HKD {friendBreakdown[selectedFriend].total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwedSummary;
