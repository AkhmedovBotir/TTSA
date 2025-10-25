import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, District, Mfy, Region, UserLocation } from '../services/api';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: UserLocation) => void;
  currentLocation?: UserLocation;
}

interface LocationPickerState {
  step: 'region' | 'district' | 'mfy';
  selectedRegion?: Region;
  selectedDistrict?: District;
  selectedMfy?: Mfy;
  regions: Region[];
  districts: District[];
  mfys: Mfy[];
  loading: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentLocation,
}) => {
  const [state, setState] = useState<LocationPickerState>({
    step: 'region',
    regions: [],
    districts: [],
    mfys: [],
    loading: false,
  });

  useEffect(() => {
    if (visible) {
      loadRegions();
      // Set current location if provided
      if (currentLocation) {
        setState(prev => ({
          ...prev,
          selectedRegion: currentLocation.region,
          selectedDistrict: currentLocation.district,
          selectedMfy: currentLocation.mfy,
        }));
      }
    }
  }, [visible, currentLocation]);

  const loadRegions = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await apiService.getRegions();
      if (response.success && response.data) {
        setState(prev => ({ ...prev, regions: response.data || [], loading: false }));
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadDistricts = async (regionId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await apiService.getDistricts(regionId);
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          districts: response.data || [], 
          step: 'district',
          loading: false 
        }));
      }
    } catch (error) {
      console.error('Failed to load districts:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadMfys = async (districtId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await apiService.getMfys(districtId);
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          mfys: response.data || [], 
          step: 'mfy',
          loading: false 
        }));
      }
    } catch (error) {
      console.error('Failed to load mfys:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRegionSelect = (region: Region) => {
    setState(prev => ({ ...prev, selectedRegion: region }));
    loadDistricts(region._id);
  };

  const handleDistrictSelect = (district: District) => {
    setState(prev => ({ ...prev, selectedDistrict: district }));
    loadMfys(district._id);
  };

  const handleMfySelect = (mfy: Mfy) => {
    if (state.selectedRegion && state.selectedDistrict) {
      const location: UserLocation = {
        region: state.selectedRegion,
        district: state.selectedDistrict,
        mfy: mfy,
      };
      onSelect(location);
      onClose();
    }
  };

  const handleBack = () => {
    setState(prev => {
      switch (prev.step) {
        case 'district':
          return { ...prev, step: 'region', selectedDistrict: undefined };
        case 'mfy':
          return { ...prev, step: 'district', selectedMfy: undefined };
        default:
          return prev;
      }
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={state.step !== 'region' ? handleBack : onClose}>
        <Ionicons 
          name={state.step !== 'region' ? 'arrow-back' : 'close'} 
          size={24} 
          color="#1C1C1E" 
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {state.step === 'region' && 'Hududni tanlang'}
        {state.step === 'district' && 'Tumanni tanlang'}
        {state.step === 'mfy' && 'MFYni tanlang'}
      </Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderRegionItem = ({ item }: { item: Region }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        state.selectedRegion?._id === item._id && styles.selectedItem
      ]}
      onPress={() => handleRegionSelect(item)}
    >
      <Text style={[
        styles.listItemText,
        state.selectedRegion?._id === item._id && styles.selectedItemText
      ]}>
        {item.name}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

  const renderDistrictItem = ({ item }: { item: District }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        state.selectedDistrict?._id === item._id && styles.selectedItem
      ]}
      onPress={() => handleDistrictSelect(item)}
    >
      <Text style={[
        styles.listItemText,
        state.selectedDistrict?._id === item._id && styles.selectedItemText
      ]}>
        {item.name}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

  const renderMfyItem = ({ item }: { item: Mfy }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        state.selectedMfy?._id === item._id && styles.selectedItem
      ]}
      onPress={() => handleMfySelect(item)}
    >
      <Text style={[
        styles.listItemText,
        state.selectedMfy?._id === item._id && styles.selectedItemText
      ]}>
        {item.name}
      </Text>
      {state.selectedMfy?._id === item._id && (
        <Ionicons name="checkmark" size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (state.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
        </View>
      );
    }

    switch (state.step) {
      case 'region':
        return (
          <FlatList
            data={state.regions}
            renderItem={renderRegionItem}
            keyExtractor={(item) => item._id}
            style={styles.list}
          />
        );
      case 'district':
        return (
          <FlatList
            data={state.districts}
            renderItem={renderDistrictItem}
            keyExtractor={(item) => item._id}
            style={styles.list}
          />
        );
      case 'mfy':
        return (
          <FlatList
            data={state.mfys}
            renderItem={renderMfyItem}
            keyExtractor={(item) => item._id}
            style={styles.list}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedItem: {
    backgroundColor: '#F0F8FF',
  },
  listItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
  },
  selectedItemText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
