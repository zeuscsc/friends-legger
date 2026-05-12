export interface Transaction {
  id: string;
  postDate: string;
  transDate: string;
  description: string;
  amount: number;
  currency: string;
  isCredit: boolean;
  category?: string;
}

export interface AccountBalance {
  id: string;
  type: 'FPS' | 'PayMe' | 'Credit Card';
  accountNumber: string;
  balance: number;
  currency: string;
}

export interface UserProfile {
  name: string;
  accounts: AccountBalance[];
  transactions: Transaction[];
  splits?: ExpenseSplit[];
}

export interface DiscretionarySpending {
  id: string;
  description: string;
  category: string;
  amount: number;
  reason: string;
  insightType: 'discretionary' | 'recurring';
}

export interface CardRecommendation {
  id: string;
  cardName: string;
  rewardType: string;
  benefit: string;
  recommendedFor: string;
  imagePlaceholder?: string;
}

export interface AiAnalysis {
  summary: string;
  totalDiscretionaryAmount: number;
  discretionarySpending: DiscretionarySpending[];
  recommendations: CardRecommendation[];
}

export interface SplitPerson {
  id: string;
  name: string;
  amountOwed: number;
  hasPaid: boolean;
}

export interface ExpenseSplit {
  transactionId: string;
  totalAmount: number;
  people: SplitPerson[];
}

export interface AiAction {
  type: 'organize_splits' | 'split_this' | string;
  splits?: ExpenseSplit[];
  match?: string;
  peopleCount?: number;
}
