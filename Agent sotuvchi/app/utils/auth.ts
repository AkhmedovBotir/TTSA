import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export interface AgentData {
  _id: string;
  phone: string;
  fullname: string;
  status: string;
  passport?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SellerData {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  status: string;
  shop: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface TokenPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

interface StoredAuthData {
  agent?: AgentData;
  seller?: SellerData;
  token: string;
}

export const clearAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem('user'),
      AsyncStorage.removeItem('userId')
    ]);
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

export const storeAuthData = async (token: string, userData: StoredAuthData): Promise<void> => {
  try {
    console.log('Storing auth data...');
    
    if (!token) {
      console.error('No token provided');
      throw new Error('Token is required');
    }

    // First, store the token immediately
    await AsyncStorage.setItem('token', token);
    console.log('Token stored');

    // Then decode and validate the token
    let decoded: TokenPayload | null = null;
    try {
      decoded = jwtDecode<TokenPayload>(token);
      console.log('Token decoded successfully');
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      // Don't clear auth data immediately, just log the error
      console.warn('Token decode failed, but continuing with storage');
      // Set a default expiration (24 hours from now)
      const defaultExp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      await AsyncStorage.setItem('tokenExpiresAt', defaultExp.toString());
    }

    // Store the expiration time if we have it
    if (decoded) {
      const expiresAt = decoded.exp.toString();
      await AsyncStorage.setItem('tokenExpiresAt', expiresAt);
      console.log('Token expiration stored:', new Date(decoded.exp * 1000).toISOString());
    }

    // Store user data - support both agent and seller
    const agentData = userData.agent;
    const sellerData = userData.seller;
    
    if (agentData) {
      if (!agentData._id) {
        console.error('Invalid agent data:', agentData);
        await clearAuthData();
        throw new Error('Invalid agent data: Missing required fields');
      }

      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(agentData)),
        AsyncStorage.setItem('userId', agentData._id),
        AsyncStorage.setItem('userType', 'agent'),
        AsyncStorage.setItem('lastLogin', new Date().toISOString())
      ]);
    } else if (sellerData) {
      if (!sellerData.id) {
        console.error('Invalid seller data:', sellerData);
        await clearAuthData();
        throw new Error('Invalid seller data: Missing required fields');
      }

      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(sellerData)),
        AsyncStorage.setItem('userId', sellerData.id),
        AsyncStorage.setItem('userType', 'seller'),
        AsyncStorage.setItem('lastLogin', new Date().toISOString())
      ]);
    } else {
      console.error('No user data provided');
      await clearAuthData();
      throw new Error('No user data provided');
    }
    
    console.log('Auth data stored successfully');
  } catch (error) {
    console.error('Error storing auth data:', error);
    await clearAuthData();
    throw error;
  }
};

export const getValidToken = async (): Promise<string | null> => {
  try {
    console.log('Getting valid token...');
    
    // First, get the token
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('No token found in storage');
      return null;
    }

    // Check expiration from storage first (faster than decoding)
    const expiresAt = await AsyncStorage.getItem('tokenExpiresAt');
    const currentTime = Date.now() / 1000;
    
    if (expiresAt) {
      const expiresAtNum = parseFloat(expiresAt);
      if (expiresAtNum <= currentTime) {
        console.log('Token expired (from storage)');
        await clearAuthData();
        return null;
      }
    }

    // Then decode and validate the token
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      console.log('Token decoded successfully');
      
      // Basic validation
      if (!decoded.id || !decoded.role) {
        console.error('Invalid token payload - missing required fields');
        await clearAuthData();
        return null;
      }

      // Check expiration from token
      if (decoded.exp <= currentTime) {
        console.log('Token expired (from token)');
        await clearAuthData();
        return null;
      }

      // Update stored expiration if needed
      if (!expiresAt || expiresAt !== decoded.exp.toString()) {
        await AsyncStorage.setItem('tokenExpiresAt', decoded.exp.toString());
      }

      return token;
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      await clearAuthData();
      return null;
    }
  } catch (error) {
    console.error('Error in getValidToken:', error);
    // Don't clear auth data here to prevent infinite logout loops
    return null;
  }
};
