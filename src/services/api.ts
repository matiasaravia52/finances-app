import { Transaction, TransactionCreate, PaginatedTransactions } from '@/types/transaction';
import { CreditCardExpense, CreditCardExpenseCreate, CreditCardFund, CreditCardFundCreate, CreditCardFundUpdate, SimulationResult, InstallmentStatus } from '@/types/credit-card';
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
  // Usar un enfoque condicional para evitar errores de linting con console.error
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(`[${context}] Error:`, errorContext);
  }
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
  },

  // Credit Card API
  async getCreditCardFund(): Promise<CreditCardFund> {
    try {
      console.log('[API] Fetching credit card fund');
      const response = await fetch(`${API_URL}/credit-card/fund`, {
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to fetch credit card fund',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardFund>;
      console.log('[API] Successfully fetched credit card fund:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'getCreditCardFund');
      throw error;
    }
  },

  async updateCreditCardAccumulatedAmount(): Promise<CreditCardFund> {
    try {
      console.log('[API] Updating credit card accumulated amount');
      const response = await fetch(`${API_URL}/credit-card/fund/update-accumulated`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to update credit card accumulated amount',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardFund>;
      console.log('[API] Successfully updated credit card accumulated amount:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'updateCreditCardAccumulatedAmount');
      throw error;
    }
  },

  async createOrUpdateCreditCardFund(fundData: CreditCardFundCreate | CreditCardFundUpdate): Promise<CreditCardFund> {
    try {
      console.log('[API] Creating/updating credit card fund:', fundData);
      const response = await fetch(`${API_URL}/credit-card/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(fundData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to create/update credit card fund',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardFund>;
      console.log('[API] Successfully created/updated credit card fund:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'createOrUpdateCreditCardFund');
      throw error;
    }
  },

  async getCreditCardExpenses(includeSimulations: boolean = false): Promise<CreditCardExpense[]> {
    try {
      console.log('[API] Fetching credit card expenses', includeSimulations ? '(including simulations)' : '');
      
      const queryParams = new URLSearchParams();
      if (includeSimulations) queryParams.append('includeSimulations', 'true');
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/credit-card/expenses${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to fetch credit card expenses',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardExpense[]>;
      console.log('[API] Successfully fetched credit card expenses:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'getCreditCardExpenses');
      throw error;
    }
  },

  async getCreditCardExpenseById(expenseId: string): Promise<CreditCardExpense> {
    try {
      console.log('[API] Fetching credit card expense by ID:', expenseId);
      const response = await fetch(`${API_URL}/credit-card/expenses/${expenseId}`, {
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to fetch credit card expense',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardExpense>;
      console.log('[API] Successfully fetched credit card expense:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'getCreditCardExpenseById');
      throw error;
    }
  },

  async createCreditCardExpense(expense: CreditCardExpenseCreate): Promise<CreditCardExpense> {
    try {
      console.log('[API] Creating credit card expense:', expense);
      const response = await fetch(`${API_URL}/credit-card/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to create credit card expense',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardExpense>;
      console.log('[API] Successfully created credit card expense:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'createCreditCardExpense');
      throw error;
    }
  },

  async executeCreditCardExpense(expenseId: string): Promise<CreditCardExpense> {
    try {
      console.log('[API] Executing credit card expense:', expenseId);
      const response = await fetch(`${API_URL}/credit-card/expenses/${expenseId}/execute`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to execute credit card expense',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardExpense>;
      console.log('[API] Successfully executed credit card expense:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'executeCreditCardExpense');
      throw error;
    }
  },

  async updateInstallmentStatus(expenseId: string, installmentNumber: number, status: InstallmentStatus): Promise<CreditCardExpense> {
    try {
      console.log('[API] Updating installment status:', { expenseId, installmentNumber, status });
      const response = await fetch(`${API_URL}/credit-card/expenses/${expenseId}/installment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ installmentNumber, status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to update installment status',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardExpense>;
      console.log('[API] Successfully updated installment status:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'updateInstallmentStatus');
      throw error;
    }
  },

  async updateExpensePurchaseDate(expenseId: string, purchaseDate: Date): Promise<CreditCardExpense> {
    try {
      console.log('[API] Updating expense purchase date:', { expenseId, purchaseDate });
      const response = await fetch(`${API_URL}/credit-card/expenses/${expenseId}/purchase-date`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ purchaseDate }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to update expense purchase date',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<CreditCardExpense>;
      console.log('[API] Successfully updated expense purchase date:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'updateExpensePurchaseDate');
      throw error;
    }
  },

  async deleteCreditCardExpense(expenseId: string): Promise<boolean> {
    try {
      console.log('[API] Deleting credit card expense:', expenseId);
      const response = await fetch(`${API_URL}/credit-card/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to delete credit card expense',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json();
      console.log('[API] Successfully deleted credit card expense:', data);
      return true;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'deleteCreditCardExpense');
      throw error;
    }
  },

  async simulateCreditCardExpense(amount: number, totalInstallments: number, startDate?: Date): Promise<SimulationResult> {
    try {
      console.log('[API] Simulating credit card expense:', { amount, totalInstallments, startDate });
      const response = await fetch(`${API_URL}/credit-card/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ amount, totalInstallments, startDate }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to simulate credit card expense',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<SimulationResult>;
      console.log('[API] Successfully simulated credit card expense:', data);
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'simulateCreditCardExpense');
      throw error;
    }
  }
};
