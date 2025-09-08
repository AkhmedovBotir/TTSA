import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from 'react';
import { Admin, AuthResponse, AuthState, LoginCredentials } from '../types/auth';

const API_URL = 'https://api.ttsa.uz/api/shop-owner-mobile';

// Storage abstraction that works on both web and native
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem(key);
  },
};

// Helper function to make authenticated API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = await storage.getItem('token');
    
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    });

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include'
    });

    const responseData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      await storage.removeItem('token');
      await storage.removeItem('admin');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  api: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  token: null,
  admin: null,
  isLoading: true,
  error: null,
};

type AuthAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_USER'; payload: { token: string; admin: Admin } }
  | { type: 'LOGOUT' }
  | { type: 'FINISH_LOADING' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_USER':
      return {
        ...state,
        token: action.payload.token,
        admin: action.payload.admin,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'FINISH_LOADING':
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  const loadStoredAuth = useCallback(async () => {
    try {
      console.log('Loading stored auth data...');
      const [storedToken, storedAdmin] = await Promise.all([
        storage.getItem('token'),
        storage.getItem('admin')
      ]);

      console.log('Stored token exists:', !!storedToken);
      console.log('Stored admin exists:', !!storedAdmin);

      if (!storedToken || !storedAdmin) {
        console.log('No stored auth data found, logging out...');
        dispatch({ type: 'LOGOUT' });
        return;
      }

      try {
        console.log('Parsing stored admin data...');
        const adminData = JSON.parse(storedAdmin);
        console.log('Parsed admin data:', adminData);
        
        dispatch({
          type: 'SET_USER',
          payload: {
            token: storedToken,
            admin: adminData,
          },
        });
        console.log('Auth state updated with stored data');
      } catch (error) {
        console.error('Failed to parse stored admin data:', error);
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      console.log('Attempting login to:', `${API_URL}/login`);
      console.log('Request payload:', JSON.stringify(credentials));
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login yoki parol noto\'g\'ri');
      }

      if (!data.token || !data.owner) {
        throw new Error('Invalid response from server: Missing token or user data');
      }

      // Store token and user data
      await storage.setItem('token', data.token);
      await storage.setItem('admin', JSON.stringify(data.owner));
      
      console.log('Token and user data stored successfully');

      // Update context state
      dispatch({
        type: 'SET_USER',
        payload: {
          token: data.token,
          admin: data.owner,
        },
      });

      // Navigate to home screen
      console.log('Navigating to home screen...');
      router.replace('/');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login yoki parol noto\'g\'ri';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  }, [router]);
  
  // Add effect to log auth state changes
  useEffect(() => {
    console.log('Auth state updated:', {
      token: !!state.token,
      admin: state.admin,
      isLoading: state.isLoading,
      error: state.error
    });
  }, [state]);

  const logout = useCallback(async () => {
    try {
      await storage.removeItem('token');
      await storage.removeItem('admin');
      dispatch({ type: 'LOGOUT' });
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  const api = useCallback(async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
      const response = await apiRequest(endpoint, options);
      return response as T;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    api,
  }), [state, login, logout, api]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 