import { Transaction, TransactionCreate } from '@/types/transaction';
import { ApiError, ApiResponse, ApiErrorContext } from '@/types/api';
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = authService.getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const logError = (error: Error | ApiError, context: string): void => {
  const errorContext: ApiErrorContext = {
    message: error.message,
    url: API_URL,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined
  };
  console.error(`[${context}] Error:`, errorContext);
};

export const api = {
  async getTransactions(): Promise<Transaction[]> {
    try {
      console.log('[API] Fetching transactions from:', API_URL);
      const response = await fetch(`${API_URL}/transactions`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to fetch transactions',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<Transaction[]>;
      console.log('[API] Successfully fetched transactions:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'getTransactions');
      throw error;
    }
  },

  async createTransaction(transaction: TransactionCreate): Promise<Transaction> {
    try {
      console.log('[API] Creating transaction:', transaction);
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to create transaction',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<Transaction>;
      console.log('[API] Successfully created transaction:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'createTransaction');
      throw error;
    }
  }
};
