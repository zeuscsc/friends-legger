import React from 'react';
import { AccountBalance } from '@/types';

interface AccountSummaryProps {
  accounts: AccountBalance[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      {accounts.map((account) => (
        <div key={account.id} className="bg-gray-900 p-4 md:p-6 rounded-xl shadow-sm border border-gray-800">
          <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
            {account.type}
          </h3>
          <p className="text-[11px] md:text-xs text-gray-500 mb-3 md:mb-4">{account.accountNumber}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-bold text-gray-100">
              {account.currency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountSummary;
