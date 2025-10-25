import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from 'react';
import { Admin, AuthResponse, AuthState, AuthContextType, LoginCredentials } from '../types/auth';
import { API_MOBILE_URL } from '../api';

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

    const response = await fetch(`${API_MOBILE_URL}${endpoint}`, {
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
      console.log('=== LOGIN REQUEST START ===');
      console.log('Attempting login to:', `${API_MOBILE_URL}/login`);
      console.log('Request payload:', JSON.stringify(credentials, null, 2));
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
      
      const response = await fetch(`${API_MOBILE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      console.log('=== LOGIN RESPONSE RECEIVED ===');
      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to parse response as JSON
      let data;
      try {
        data = await response.json();
        console.log('Response JSON parsed successfully');
        console.log('Full response data:', JSON.stringify(data, null, 2));
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        const textResponse = await response.text();
        console.log('Raw response text:', textResponse);
        throw new Error('Server returned invalid JSON response');
      }
      
      console.log('=== RESPONSE ANALYSIS ===');
      console.log('Response success field:', data.success);
      console.log('Response message:', data.message);
      console.log('Response has token:', !!data.token);
      console.log('Response has owner:', !!data.owner);
      console.log('Response has data field:', !!data.data);
      
      // Check if response has nested data structure
      if (data.data) {
        console.log('Nested data structure found:', JSON.stringify(data.data, null, 2));
        console.log('Nested data has token:', !!data.data.token);
        console.log('Nested data has admin:', !!data.data.admin);
      }
      
      if (!response.ok || !data.success) {
        console.error('Login failed - Response not OK or success false');
        console.error('Error message:', data.message);
        throw new Error(data.message || 'Login yoki parol noto\'g\'ri');
      }

      // Handle different response structures
      let token, owner;
      if (data.data && data.data.token) {
        // Nested structure: { success: true, data: { token: "...", admin: {...} } }
        token = data.data.token;
        owner = data.data.admin || data.data.owner;
        console.log('Using nested data structure');
      } else if (data.token) {
        // Direct structure: { success: true, token: "...", owner: {...} }
        token = data.token;
        owner = data.owner;
        console.log('Using direct data structure');
      } else {
        console.error('No token found in response');
        throw new Error('Invalid response from server: Missing token or user data');
      }

      if (!token || !owner) {
        console.error('Missing required data after parsing');
        console.error('Token exists:', !!token);
        console.error('Owner exists:', !!owner);
        throw new Error('Invalid response from server: Missing token or user data');
      }

      console.log('=== STORING AUTH DATA ===');
      console.log('Token to store:', token.substring(0, 20) + '...');
      console.log('Owner data to store:', JSON.stringify(owner, null, 2));

      // Store token and user data
      await storage.setItem('token', token);
      await storage.setItem('admin', JSON.stringify(owner));
      
      console.log('Token and user data stored successfully');

      // Update context state
      dispatch({
        type: 'SET_USER',
        payload: {
          token: token,
          admin: owner,
        },
      });

      console.log('=== LOGIN SUCCESS ===');
      console.log('Auth state updated, navigating to home screen...');
      router.replace('/');
      
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'Login yoki parol noto\'g\'ri';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      console.log('=== LOGIN REQUEST END ===');
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
    userId: state.admin?.id,
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