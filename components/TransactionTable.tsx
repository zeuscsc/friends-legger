'use client';

import React, { useState } from 'react';
import { Transaction, ExpenseSplit, SplitPerson } from '@/types';

interface TransactionTableProps {
  transactions: Transaction[];
  splits: ExpenseSplit[];
  onUpdateSplit: (split: ExpenseSplit) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, splits, onUpdateSplit, onUpdateTransaction }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingDetailsId, setEditingDetailsId] = useState<string | null>(null);
  const [editFormValues, setEditFormValues] = useState<Partial<Transaction>>({});

  const getSplit = React.useCallback((transactionId: string) => splits.find(s => s.transactionId === transactionId), [splits]);

  const startSplitting = (t: Transaction) => {
    const existing = getSplit(t.id);
    if (!existing) {
      // Look for reimbursement transactions in the full list
      // Mock data uses originalId_reimburseN format
      const reimbursements = transactions.filter(rt => 
        rt.id.startsWith(`${t.id}_reimburse`) && rt.isCredit
      );

      const people: SplitPerson[] = reimbursements.map(rt => {
        // Try to extract name: "PAYME FROM SARAH LEE - ..." or "FPS FROM DAVID CHAN"
        let name = 'Friend';
        const fromMatch = rt.description.match(/(?:FROM|TO)\s+([^-\d]+)(?:-|$)/i);
        if (fromMatch) {
          name = fromMatch[1].trim();
        }

        return {
          id: `p-${rt.id}`,
          name: name,
          amountOwed: rt.amount,
          hasPaid: true
        };
      });

      // If no reimbursements found, default to a 2-way split (User + 1 Friend)
      if (people.length === 0) {
        people.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Friend 1',
          amountOwed: t.amount / 2,
          hasPaid: false
        });
      }

      const newSplit: ExpenseSplit = {
        transactionId: t.id,
        totalAmount: t.amount,
        people
      };
      onUpdateSplit(newSplit);
    }
    setEditingTransactionId(t.id);
  };

  const handleEdit = (t: Transaction) => {
    setEditingDetailsId(t.id);
    setEditFormValues({ ...t });
  };

  const handleSave = () => {
    if (editingDetailsId && editFormValues) {
      const updatedTransaction = editFormValues as Transaction;
      onUpdateTransaction(updatedTransaction);
      
      // If there's an associated split, update its totalAmount
      const existingSplit = getSplit(editingDetailsId);
      if (existingSplit && existingSplit.totalAmount !== updatedTransaction.amount) {
        onUpdateSplit({
          ...existingSplit,
          totalAmount: updatedTransaction.amount
        });
      }
      
      setEditingDetailsId(null);
    }
  };

  const updatePerson = (transactionId: string, personId: string, updates: Partial<SplitPerson>) => {
    const split = getSplit(transactionId);
    if (!split) return;

    const newPeople = split.people.map(p => 
      p.id === personId ? { ...p, ...updates } : p
    );
    onUpdateSplit({ ...split, people: newPeople });
  };

  const handleAmountOwedChange = (transactionId: string, personId: string, value: string) => {
    const parsed = Number.parseFloat(value);
    updatePerson(transactionId, personId, { amountOwed: Number.isFinite(parsed) ? parsed : 0 });
  };

  const addPerson = React.useCallback((transactionId: string) => {
    const split = getSplit(transactionId);
    if (!split) return;

    const newPerson: SplitPerson = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Friend ${split.people.length + 1}`,
      amountOwed: 0,
      hasPaid: false
    };

    const updatedPeople = [...split.people, newPerson];
    onUpdateSplit({ ...split, people: updatedPeople });
  }, [getSplit, onUpdateSplit]);

  const removePerson = (transactionId: string, personId: string) => {
    const split = getSplit(transactionId);
    if (!split) return;

    const newPeople = split.people.filter(p => p.id !== personId);
    onUpdateSplit({ ...split, people: newPeople });
  };

  const formatAmount = (transaction: Transaction) => {
    const amount = transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
    return `${transaction.isCredit ? '+' : ''}${amount}`;
  };

  const renderSplitEditor = (transaction: Transaction, split: ExpenseSplit) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-bold text-gray-200">Split Management</h4>
        <button
          onClick={() => addPerson(transaction.id)}
          className="w-full sm:w-auto text-xs bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          + Add Person
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {split.people.map((person) => (
          <div key={person.id} className="bg-gray-900 p-3 rounded-xl border border-gray-700 flex flex-col gap-3 min-w-0">
            <div className="flex items-start gap-2">
              <input
                className="min-w-0 w-full bg-transparent border-b border-gray-700 text-sm font-medium text-gray-100 focus:outline-none focus:border-red-600 px-1 py-0.5"
                value={person.name}
                onChange={(e) => updatePerson(transaction.id, person.id, { name: e.target.value })}
                placeholder="Friend Name"
              />
              <button
                onClick={() => removePerson(transaction.id, person.id)}
                className="text-gray-500 hover:text-red-500 p-1 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <label htmlFor={`owed-${transaction.id}-${person.id}`} className="text-xs text-gray-400 whitespace-nowrap">
                  Owes (HKD)
                </label>
                <input
                  id={`owed-${transaction.id}-${person.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={person.amountOwed}
                  onChange={(e) => handleAmountOwedChange(transaction.id, person.id, e.target.value)}
                  className="w-28 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm font-semibold text-green-400 focus:outline-none focus:border-red-600"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer self-start">
                <span className="text-[10px] uppercase font-bold text-gray-500">Paid?</span>
                <input
                  type="checkbox"
                  checked={person.hasPaid}
                  onChange={(e) => updatePerson(transaction.id, person.id, { hasPaid: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-500 break-words">
        Total amount is HKD {transaction.amount.toFixed(2)}. Equal share would be {(transaction.amount / (split.people.length + 1)).toFixed(2)}.
      </p>
    </div>
  );

  const renderActionButtons = (transaction: Transaction, isEditing: boolean, isSplitting: boolean, mobile = false) => {
    if (isEditing) {
      return (
        <div className={`grid gap-2 ${mobile ? 'grid-cols-2' : 'flex flex-col sm:flex-row justify-end'}`}>
          <button
            onClick={handleSave}
            className="text-xs font-semibold px-2 py-2 sm:py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setEditingDetailsId(null)}
            className="text-xs font-semibold px-2 py-2 sm:py-1 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className={mobile ? `grid gap-2 ${transaction.isCredit ? 'grid-cols-1' : 'grid-cols-2'}` : 'flex flex-col sm:flex-row justify-end gap-2'}>
        <button
          onClick={() => handleEdit(transaction)}
          className={`text-xs font-semibold px-2 ${mobile ? 'py-2 border border-gray-700 rounded-md text-gray-200 hover:border-gray-500' : 'py-1 text-gray-400 hover:text-gray-100'} transition-colors`}
        >
          Edit
        </button>
        {!transaction.isCredit && (
          <button
            onClick={() => isSplitting ? setEditingTransactionId(null) : startSplitting(transaction)}
            className={`text-xs font-semibold px-2 py-2 sm:py-1 sm:px-3 rounded-md transition-colors ${
              isSplitting
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white'
            }`}
          >
            {isSplitting ? 'Close' : mobile ? (splitExists(transaction.id) ? 'Manage Split' : 'Split Expense') : (getSplit(transaction.id) ? 'Manage Split' : 'Split Expense')}
          </button>
        )}
      </div>
    );
  };

  const splitExists = (transactionId: string) => Boolean(getSplit(transactionId));

  return (
    <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden mb-8">
      <div className="px-4 py-4 sm:px-6 border-b border-gray-800 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-200">Recent Transactions</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={isOpen ? 'block' : 'hidden'}>
        <div className="sm:hidden divide-y divide-gray-800">
          {transactions.map((t) => {
            const split = getSplit(t.id);
            const isSplitting = editingTransactionId === t.id;
            const isEditing = editingDetailsId === t.id;

            return (
              <div key={t.id} className={`p-4 space-y-4 ${split ? 'bg-blue-900/10' : ''} ${isEditing ? 'bg-red-900/10' : ''}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-red-600"
                      value={editFormValues.description ?? ''}
                      onChange={(e) => setEditFormValues({ ...editFormValues, description: e.target.value })}
                      placeholder="Description"
                    />
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-red-600"
                      value={editFormValues.category ?? ''}
                      onChange={(e) => setEditFormValues({ ...editFormValues, category: e.target.value })}
                      placeholder="Category"
                    />
                    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                      <input
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-red-600"
                        value={editFormValues.transDate ?? ''}
                        onChange={(e) => setEditFormValues({ ...editFormValues, transDate: e.target.value })}
                        placeholder="Transaction Date"
                      />
                      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500 shrink-0">HKD</span>
                        <input
                          type="number"
                          className="w-full bg-transparent text-sm text-right text-gray-100 focus:outline-none"
                          value={editFormValues.amount ?? ''}
                          onChange={(e) => setEditFormValues({ ...editFormValues, amount: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-100 break-words">{t.description}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                          {t.category && <span>{t.category}</span>}
                          <span>{t.transDate}</span>
                          {split && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-900 text-blue-200 border border-blue-800">Split</span>
                          )}
                        </div>
                      </div>
                      <div className={`shrink-0 text-sm font-bold text-right ${t.isCredit ? 'text-green-400' : 'text-gray-100'}`}>
                        {formatAmount(t)}
                      </div>
                    </div>
                    {!split && !t.isCredit && <div className="text-xs text-gray-600">No split applied</div>}
                  </div>
                )}

                {renderActionButtons(t, isEditing, isSplitting, true)}

                {isSplitting && split && (
                  <div className="pt-4 border-t border-gray-800 border-l-2 border-red-600 pl-3">
                    {renderSplitEditor(t, split)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-xs font-medium text-gray-400 uppercase">
            <tr>
              <th className="hidden sm:table-cell px-6 py-3">Date</th>
              <th className="px-3 py-3 sm:px-6">Description</th>
              <th className="px-3 py-3 sm:px-6 text-right">Amount</th>
              <th className="hidden sm:table-cell px-6 py-3 text-center">Status</th>
              <th className="px-3 py-3 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transactions.map((t) => {
              const split = getSplit(t.id);
              const isSplitting = editingTransactionId === t.id;
              const isEditing = editingDetailsId === t.id;
              
              return (
                <React.Fragment key={t.id}>
                  <tr className={`hover:bg-gray-800/50 transition-colors ${split ? 'bg-blue-900/10' : ''} ${isEditing ? 'bg-red-900/10' : ''}`}>
                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 w-20 focus:outline-none focus:border-red-600"
                          value={editFormValues.transDate}
                          onChange={(e) => setEditFormValues({ ...editFormValues, transDate: e.target.value })}
                        />
                      ) : t.transDate}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <input
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-red-600"
                            value={editFormValues.description}
                            onChange={(e) => setEditFormValues({ ...editFormValues, description: e.target.value })}
                            placeholder="Description"
                          />
                          <input
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-red-600"
                            value={editFormValues.category}
                            onChange={(e) => setEditFormValues({ ...editFormValues, category: e.target.value })}
                            placeholder="Category"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-gray-100">{t.description}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{t.category}</span>
                            <span className="sm:hidden text-xs text-gray-600">{t.transDate}</span>
                            {split && (
                              <span className="sm:hidden inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-900 text-blue-200 border border-blue-800">Split</span>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                    <td className={`px-3 py-3 sm:px-6 sm:py-4 text-sm font-bold text-right whitespace-nowrap ${t.isCredit ? 'text-green-400' : 'text-gray-100'}`}>
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-500 text-xs">HKD</span>
                          <input
                            type="number"
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 w-24 text-right focus:outline-none focus:border-red-600"
                            value={editFormValues.amount}
                            onChange={(e) => setEditFormValues({ ...editFormValues, amount: parseFloat(e.target.value) })}
                          />
                        </div>
                      ) : (
                        <>
                          {t.isCredit ? '+' : ''}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-center">
                      {split ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200 border border-blue-800">
                          Split
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">
                      {renderActionButtons(t, isEditing, isSplitting)}
                    </td>
                  </tr>
                  
                  {/* Inline Split Editor */}
                  {isSplitting && split && (
                    <tr className="bg-gray-800/30">
                      <td colSpan={5} className="px-3 py-4 sm:px-6 sm:py-6 border-l-2 border-red-600">
                        {renderSplitEditor(t, split)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
