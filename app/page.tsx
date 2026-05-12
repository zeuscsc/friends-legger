'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, AiAnalysis, ExpenseSplit, SplitPerson, Transaction, AiAction } from '@/types';
import OwedSummary from '@/components/OwedSummary';
import TransactionTable from '@/components/TransactionTable';
import AiInsights from '@/components/AiInsights';
import CardRecommendations from '@/components/CardRecommendations';
import ChatBubble from '@/components/ChatBubble';

export default function Dashboard() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', friendName: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, aiRes] = await Promise.all([
          fetch('/api/user-data'),
          fetch('/api/ai-gateway')
        ]);

        const userJson = await userRes.json();
        const aiJson = await aiRes.json();

        setUserData(userJson);
        setAiAnalysis(aiJson);
        if (userJson.splits) {
          setSplits(userJson.splits);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateSplit = useCallback((split: ExpenseSplit) => {
    setSplits(prev => {
      const index = prev.findIndex(s => s.transactionId === split.transactionId);
      if (index >= 0) {
        const newSplits = [...prev];
        newSplits[index] = split;
        return newSplits;
      }
      return [...prev, split];
    });
  }, []);

  const handleUpdateTransaction = useCallback((updated: Transaction) => {
    setManualTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setUserData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        transactions: prev.transactions.map(t => t.id === updated.id ? updated : t)
      };
    });
  }, []);

  const handleAiAction = useCallback((action: AiAction) => {
    if (!userData) return;

    if (action.type === 'organize_splits' && action.splits) {
      action.splits.forEach((split: ExpenseSplit) => handleUpdateSplit(split));
      return;
    }

    // Search in both real and manual transactions
    const allTransactions = [...userData.transactions, ...manualTransactions];
    const transaction = allTransactions.find(t => 
      t.description.toLowerCase().includes((action.match || '').toLowerCase())
    );

    if (transaction && action.peopleCount) {
      // Create a split with placeholders
      const perPerson = transaction.amount / action.peopleCount;
      const people: SplitPerson[] = [];
      
      // Person 0 is usually the user themselves in Splitwise, 
      // but here we just need placeholders for the OTHERS who owe us.
      // If there are 4 people, 3 owe us money.
      for (let i = 1; i < action.peopleCount; i++) {
        people.push({
          id: `p-${Date.now()}-${i}`,
          name: `Friend ${i}`,
          amountOwed: perPerson,
          hasPaid: false
        });
      }

      const newSplit: ExpenseSplit = {
        transactionId: transaction.id,
        totalAmount: transaction.amount,
        people
      };

      handleUpdateSplit(newSplit);
    }
  }, [userData, manualTransactions, handleUpdateSplit]);

  const handleAddManualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.friendName) return;

    const amount = parseFloat(newExpense.amount);
    const id = `manual-${Date.now()}`;
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, '0')}${now.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`;

    const transaction: Transaction = {
      id,
      description: newExpense.description,
      amount,
      transDate: date,
      postDate: date,
      currency: 'HKD',
      isCredit: false,
      category: 'Manual Split'
    };

    const split: ExpenseSplit = {
      transactionId: id,
      totalAmount: amount,
      people: [{
        id: `p-${Date.now()}`,
        name: newExpense.friendName,
        amountOwed: amount / 2,
        hasPaid: false
      }]
    };

    setManualTransactions(prev => [transaction, ...prev]);
    handleUpdateSplit(split);
    setNewExpense({ description: '', amount: '', friendName: '' });
    setShowManualForm(false);
  };

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium animate-pulse text-sm">Analyzing spending... (Powered by HSBC AI Agentic Gateway)</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 pb-12">
      {/* Header - Mobile First */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 md:py-4 mb-6 md:mb-8 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Logo & Brand */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 md:flex-none md:mr-auto">
            <h1 className="hidden sm:block text-lg md:text-xl font-bold text-gray-100 tracking-tight">SmartSpend</h1>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-400">Welcome, <strong className="text-gray-200">{userData?.name}</strong></span>
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
          </div>

          {/* Mobile User Avatar */}
          <div className="md:hidden">
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-3 pb-4">
              <div className="text-sm text-gray-400">Welcome, <strong className="text-gray-200">{userData?.name}</strong></div>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                Account Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                Help & Support
              </button>
              <button className="w-full text-left px-4 py-2 text-red-500 font-medium hover:bg-red-950 rounded-lg transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content - Mobile First Stack */}
      <div className="px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Main Content Area - display:contents on mobile so children join outer flex and can be reordered */}
            <div className="contents md:block md:flex-1 md:min-w-0">
              {/* Account Overview - first on mobile and desktop */}
              <div className="order-1">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-100">Owed to You</h2>
                  <button 
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="bg-red-600 text-white text-xs md:text-sm px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
                  >
                    {showManualForm ? 'Cancel' : '+ New Shared Expense'}
                  </button>
                </div>

                {showManualForm && (
                  <form onSubmit={handleAddManualExpense} className="mb-8 bg-gray-900 p-6 rounded-xl border border-red-900 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="text-gray-100 font-bold mb-4 text-sm uppercase tracking-wider">Record Manual Debt</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input 
                        placeholder="Description (e.g., Movie Tickets)"
                        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      />
                      <input 
                        placeholder="Amount (HKD)"
                        type="number"
                        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      />
                      <input 
                        placeholder="Friend Name"
                        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
                        value={newExpense.friendName}
                        onChange={(e) => setNewExpense({ ...newExpense, friendName: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-colors">
                      Record Shared Expense
                    </button>
                  </form>
                )}

                {userData && (
                  <OwedSummary 
                    splits={splits} 
                    transactions={[...userData.transactions, ...manualTransactions]} 
                  />
                )}
              </div>
              {/* Recent Transactions - third on mobile (after AI Insights), natural on desktop */}
              <div className="order-3 md:order-none">
                {userData && (
                  <TransactionTable 
                    transactions={[...manualTransactions, ...userData.transactions]} 
                    splits={splits}
                    onUpdateSplit={handleUpdateSplit}
                    onUpdateTransaction={handleUpdateTransaction}
                  />
                )}
              </div>
            </div>

            {/* Sidebar / AI Insights - second on mobile (between Account Summary and Transactions) */}
            <div className="order-2 md:order-none w-full md:w-96">
              {aiAnalysis && <AiInsights analysis={aiAnalysis} />}
            </div>
          </div>

          {/* Bottom Section - Card Recommendations */}
          <div className="mt-8 md:mt-12">
            {aiAnalysis && <CardRecommendations recommendations={aiAnalysis.recommendations} />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 md:px-6 mt-12 md:mt-16 pt-6 md:pt-8 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SmartSpend. For demonstration purposes only.
        </p>
      </footer>

      <ChatBubble onAiAction={handleAiAction} />
    </main>
  );
}
