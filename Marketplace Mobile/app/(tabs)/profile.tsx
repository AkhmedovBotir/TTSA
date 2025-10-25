import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { LocationPicker } from '../components/LocationPicker';
import { NotificationModal } from '../components/NotificationModal';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { UserLocation } from '../services/api';

export default function ProfileScreen() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const { userLocation, updateLocation } = useLocation();
  const { unreadCount } = useNotification();
  const router = useRouter();
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  const refreshProfile = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Tizimdan chiqishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleChangePassword = () => {
    router.push('/profile/change-password');
  };

  const handleViewOrders = () => {
    router.push('/(tabs)/orders');
  };

  const handleNotificationPress = () => {
    setNotificationModalVisible(true);
  };

  const handleLocationSelect = async (location: UserLocation) => {
    try {
      await updateLocation(location);
      setLocationPickerVisible(false);
      Alert.alert('Muvaffaqiyat', 'Hudud muvaffaqiyatli yangilandi');
    } catch (error) {
      console.error('Failed to update location:', error);
      Alert.alert('Xatolik', 'Hududni yangilashda xatolik yuz berdi');
    }
  };

  const formatLocationString = (location: UserLocation | null): string => {
    if (!location) return 'Hudud tanlanmagan';
    
    const parts = [];
    if (location.region) parts.push(location.region.name);
    if (location.district) parts.push(location.district.name);
    if (location.mfy) parts.push(location.mfy.name);
    
    return parts.join(', ');
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshProfile}
          colors={['#007AFF']}
          tintColor="#007AFF"
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>
                {user.firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.name}>{user.fullName}</Text>
              <Text style={styles.phone}>{user.phoneNumber}</Text>
              {user.username && (
                <Text style={styles.username}>@{user.username}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications" size={24} color="#007AFF" />
            {(unreadCount || 0) > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {(unreadCount || 0) > 99 ? '99+' : (unreadCount || 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hisob</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <View style={styles.menuItemContent}>
            <Ionicons name="create" size={24} color="#007AFF" style={styles.menuIcon} />
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Profilni tahrirlash</Text>
              <Text style={styles.menuSubtitle}>Shaxsiy ma'lumotlarni o'zgartirish</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
          <View style={styles.menuItemContent}>
            <Ionicons name="lock-closed" size={24} color="#007AFF" style={styles.menuIcon} />
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Parolni o'zgartirish</Text>
              <Text style={styles.menuSubtitle}>Yangi parol o'rnatish</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setLocationPickerVisible(true)}>
          <View style={styles.menuItemContent}>
            <Ionicons name="location" size={24} color="#007AFF" style={styles.menuIcon} />
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Hududni tanlash</Text>
              <Text style={styles.menuSubtitle} numberOfLines={1}>
                {formatLocationString(userLocation)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buyurtmalar</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleViewOrders}>
          <View style={styles.menuItemContent}>
            <Ionicons name="list" size={24} color="#007AFF" style={styles.menuIcon} />
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Buyurtmalar tarixi</Text>
              <Text style={styles.menuSubtitle}>Barcha buyurtmalaringizni ko'rish</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ilova haqida</Text>
        
        <View style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="information-circle" size={24} color="#007AFF" style={styles.menuIcon} />
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Versiya</Text>
              <Text style={styles.menuSubtitle}>1.0.0</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.logoutSection}>
        <Button
          title="Tizimdan chiqish"
          onPress={handleLogout}
          variant="danger"
          loading={isLoading}
          style={styles.logoutButton}
        />
      </View>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationSelect}
        currentLocation={userLocation || undefined}
      />

      {/* Notification Modal */}
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  menuArrow: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '300',
  },
  logoutSection: {
    padding: 20,
    marginTop: 20,
  },
  logoutButton: {
    marginBottom: 20,
  },
});
