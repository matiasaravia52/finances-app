import { Transaction, TransactionCreate } from '@/types/transaction';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${API_URL}/transactions`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    const data = await response.json();
    return data.data;
  },

  async createTransaction(transaction: TransactionCreate): Promise<Transaction> {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error('Failed to create transaction');
    }

    const data = await response.json();
    return data.data;
  }
};
