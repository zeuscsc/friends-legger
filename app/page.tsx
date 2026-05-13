'use client';

import React, { useState, useCallback } from 'react';
import { UserProfile, ExpenseSplit, SplitPerson, Transaction, AiAction } from '@/types';
import AuthSimulation from '@/components/AuthSimulation';
import WarpContainer from '@/components/WarpContainer';
import ChatInterface from '@/components/ChatInterface';
import { generateId } from '@/utils/generateId';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [resubmitMessage, setResubmitMessage] = useState<string | null>(null);
  const [wasAuthDeclined, setWasAuthDeclined] = useState(false);

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

  const handleAiAction = useCallback((action: AiAction) => {
    // Expense splitting logic preserved for when the LLM triggers it
    if (action.type === 'organize_splits' && action.splits) {
      action.splits.forEach((split: ExpenseSplit) => handleUpdateSplit(split));
      return;
    }

    if (!userData) return;

    const allTransactions = [...userData.transactions, ...manualTransactions];
    const transaction = allTransactions.find(t => 
      t.description.toLowerCase().includes((action.match || '').toLowerCase())
    );

    if (transaction && action.peopleCount) {
      const perPerson = transaction.amount / action.peopleCount;
      const people: SplitPerson[] = [];
      for (let i = 1; i < action.peopleCount; i++) {
        people.push({
          id: generateId('p'),
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

  const handleRequireAuth = (message: string) => {
    setPendingMessage(message);
    setIsSwapped(true);
  };

  const handleAuthComplete = async () => {
    setIsAuthenticated(true);
    setWasAuthDeclined(false);
    setIsSwapped(false);
    
    // Fetch user data after auth
    try {
      const userRes = await fetch('/api/user-data');
      const userJson = await userRes.json();
      setUserData(userJson);
      if (userJson.splits) {
        setSplits(userJson.splits);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    // Trigger auto-resubmit
    if (pendingMessage) {
      setResubmitMessage(pendingMessage);
      setPendingMessage(null);
    }
  };

  const handleCancelAuth = () => {
    setIsSwapped(false);
    setWasAuthDeclined(true);
    // Trigger auto-resubmit even if cancelled (LLM will handle without data)
    if (pendingMessage) {
      setResubmitMessage(pendingMessage);
      setPendingMessage(null);
    }
  };

  const renderFrontContent = () => {
    return (
      <main className="min-h-screen bg-gray-950">
        <ChatInterface 
          onAiAction={handleAiAction} 
          isAuthenticated={isAuthenticated}
          onRequireAuth={handleRequireAuth}
          pendingMessageToResubmit={resubmitMessage}
          onResubmitComplete={() => setResubmitMessage(null)}
          wasAuthDeclined={wasAuthDeclined}
        />
      </main>
    );
  };

  return (
    <WarpContainer 
      isSwapped={isSwapped}
      front={renderFrontContent()}
      back={<AuthSimulation onComplete={handleAuthComplete} onCancel={handleCancelAuth} />}
    />
  );
}
