export type TransactionType = 'income' | 'expense';

export interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
