import { Transaction, TransactionCreate, PaginatedTransactions } from '@/types/transaction';
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
  async getTransactions(filters: { period?: string; type?: string; category?: string; page?: number; limit?: number } = {}): Promise<PaginatedTransactions> {
    try {
      // Construir los parámetros de consulta
      const queryParams = new URLSearchParams();
      if (filters.period) queryParams.append('period', filters.period);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/transactions${queryString ? `?${queryString}` : ''}`;
      
      console.log(`[API] Fetching transactions from: ${url}`, filters);
      
      const response = await fetch(url, {
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

      const data = await response.json() as ApiResponse<PaginatedTransactions>;
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
  },

  async updateTransaction(transactionId: string, transaction: TransactionCreate): Promise<Transaction> {
    try {
      console.log('[API] Updating transaction:', { id: transactionId, ...transaction });
      const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to update transaction',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<Transaction>;
      console.log('[API] Successfully updated transaction:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'updateTransaction');
      throw error;
    }
  },

  async deleteTransaction(transactionId: string): Promise<boolean> {
    try {
      console.log('[API] Deleting transaction:', transactionId);
      const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to delete transaction',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json();
      console.log('[API] Successfully deleted transaction:', data);
      return true;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'deleteTransaction');
      throw error;
    }
  },
  
  async getTransactionCategories(type?: string): Promise<string[]> {
    try {
      console.log('[API] Fetching transaction categories', type ? `for type: ${type}` : '');
      
      // Construir los parámetros de consulta si se proporciona un tipo
      const queryParams = new URLSearchParams();
      if (type) queryParams.append('type', type);
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/transactions/categories${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to fetch transaction categories',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<string[]>;
      console.log('[API] Successfully fetched transaction categories:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'getTransactionCategories');
      throw error;
    }
  },
  
  async getTransactionsSummary(): Promise<{ total: number, currentMonth: number, currentYear: number }> {
    try {
      console.log('[API] Fetching transactions summary');
      const response = await fetch(`${API_URL}/transactions/summary`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to fetch transactions summary',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<{ total: number, currentMonth: number, currentYear: number }>;
      console.log('[API] Successfully fetched transactions summary:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'getTransactionsSummary');
      throw error;
    }
  }
};
