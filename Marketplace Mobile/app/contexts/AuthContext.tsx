import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { apiService, AuthStatus, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  authStatus: AuthStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showLocationModal: boolean;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  loginWithSms: (phoneNumber: string, code: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    username?: string;
  }) => Promise<boolean>;
  registerWithSms: (userData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    username?: string;
    smsCode: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (phoneNumber: string, newPassword: string) => Promise<boolean>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
  }) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<boolean>;
  setShowLocationModal: (show: boolean) => void;
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
  const [showLocationModal, setShowLocationModal] = useState(false);

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

  const loginWithSms = async (phoneNumber: string, code: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.verifySms({ phoneNumber, code, purpose: 'login' });
      
      console.log('SMS verification response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.token && response.data?.user) {
        setUser(response.data.user);
        setAuthStatus({ isAuthenticated: true, userType: 'user' });
        // Show location modal for new users
        setShowLocationModal(true);
        return true;
      } else {
        console.log('SMS verification failed:', response);
        return false;
      }
    } catch (error: any) {
      console.error('SMS login failed:', error);
      // If it's a role-related error, try to handle it gracefully
      if (error.response?.status === 401) {
        Alert.alert('Xato', 'Autentifikatsiya xatoligi. Iltimos, qaytadan urinib ko\'ring.');
      }
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

  const registerWithSms = async (userData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    username?: string;
    smsCode: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.registerWithSms(userData);
      
      if (response.success && response.data?.token && response.data?.user) {
        setUser(response.data.user);
        setAuthStatus({ isAuthenticated: true, userType: 'user' });
        // Show location modal for new users
        setShowLocationModal(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('SMS registration failed:', error);
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

  const refreshUser = async (): Promise<boolean> => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        setAuthStatus(response.authStatus || { isAuthenticated: true, userType: 'user' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('User refresh failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    authStatus,
    isLoading,
    isAuthenticated,
    showLocationModal,
    login,
    loginWithSms,
    register,
    registerWithSms,
    logout,
    forgotPassword,
    updateProfile,
    changePassword,
    refreshUser,
    setShowLocationModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};







