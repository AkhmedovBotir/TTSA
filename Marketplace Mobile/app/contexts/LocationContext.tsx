import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, UserLocation } from '../services/api';

interface LocationContextType {
  userLocation: UserLocation | null;
  loading: boolean;
  error: string | null;
  updateLocation: (location: UserLocation) => Promise<void>;
  loadUserLocation: () => Promise<void>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LOCATION_STORAGE_KEY = 'userLocation';

  // Load location from storage on app start
  useEffect(() => {
    loadStoredLocation();
  }, []);

  const loadStoredLocation = async () => {
    try {
      const storedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (storedLocation) {
        setUserLocation(JSON.parse(storedLocation));
      }
    } catch (error) {
      console.error('Failed to load stored location:', error);
    }
  };

  const loadUserLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getUserLocation();
      if (response.success && response.data) {
        const location = response.data.location;
        setUserLocation(location);
        
        // Store in AsyncStorage
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      }
    } catch (error) {
      console.error('Failed to load user location:', error);
      setError('Hudud ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (location: UserLocation) => {
    try {
      setLoading(true);
      setError(null);

      // Update on server
      const response = await apiService.updateUserLocation({
        regionId: location.region._id,
        districtId: location.district._id,
        mfyId: location.mfy._id,
      });

      if (response.success && response.data) {
        const updatedLocation = response.data.location;
        setUserLocation(updatedLocation);
        
        // Store in AsyncStorage
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocation));
      }
    } catch (error) {
      console.error('Failed to update location:', error);
      setError('Hududni yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = async () => {
    setUserLocation(null);
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
  };

  const formatLocationString = (location: UserLocation | null): string => {
    if (!location) return 'Hudud tanlanmagan';
    
    const parts = [];
    if (location.region) parts.push(location.region.name);
    if (location.district) parts.push(location.district.name);
    if (location.mfy) parts.push(location.mfy.name);
    
    return parts.join(', ');
  };

  const value: LocationContextType = {
    userLocation,
    loading,
    error,
    updateLocation,
    loadUserLocation,
    clearLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};


