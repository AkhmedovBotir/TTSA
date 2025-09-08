import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, AuthStatus, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  authStatus: AuthStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    username?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (phoneNumber: string, newPassword: string) => Promise<boolean>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
  }) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = authStatus?.isAuthenticated || false;

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await apiService.getProfile();
        if (response.success && response.user) {
          setUser(response.user);
          setAuthStatus(response.authStatus || { isAuthenticated: true, userType: 'user' });
        } else {
          await logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ phoneNumber, password });
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setAuthStatus(response.authStatus || { isAuthenticated: true, userType: 'user' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    username?: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setAuthStatus(response.authStatus || { isAuthenticated: true, userType: 'user' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      setAuthStatus(null);
      await AsyncStorage.removeItem('authToken');
    }
  };

  const forgotPassword = async (phoneNumber: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.forgotPassword({ phoneNumber, newPassword });
      return response.success;
    } catch (error) {
      console.error('Forgot password failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.updateProfile(data);
      
      if (response.success && response.user) {
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.changePassword({ newPassword });
      return response.success;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    authStatus,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



