import { User, UserLogin, UserRegister } from '@/types/user';
import { ApiError, ApiResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'finances_auth_token';

const logError = (error: Error | ApiError, context: string): void => {
  console.error(`[Auth Service] [${context}] Error:`, error);
};

export const authService = {
  async register(userData: UserRegister): Promise<User> {
    try {
      console.log('[Auth] Registering user:', userData.email);
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to register user',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<User>;
      console.log('[Auth] Successfully registered user:', data);
      
      // Save token to localStorage
      if (data.data.token) {
        localStorage.setItem(TOKEN_KEY, data.data.token);
      }
      
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'register');
      throw error;
    }
  },

  async login(loginData: UserLogin): Promise<User> {
    try {
      console.log('[Auth] Logging in user:', loginData.email);
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to login',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<User>;
      console.log('[Auth] Successfully logged in user:', data);
      
      // Save token to localStorage
      if (data.data.token) {
        localStorage.setItem(TOKEN_KEY, data.data.token);
      }
      
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'login');
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        return null;
      }

      console.log('[Auth] Fetching current user');
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If unauthorized, clear token
        if (response.status === 401) {
          this.logout();
          return null;
        }

        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: 'Failed to fetch current user',
          status: response.status,
          statusText: response.statusText,
          details: errorData
        };
        throw apiError;
      }

      const data = await response.json() as ApiResponse<User>;
      console.log('[Auth] Successfully fetched current user:', data);
      
      return data.data;
    } catch (error) {
      logError(error instanceof Error ? error : { message: String(error) }, 'getCurrentUser');
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
