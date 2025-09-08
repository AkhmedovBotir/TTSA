import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

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

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {user.firstName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.phone}>{user.phoneNumber}</Text>
        {user.username && (
          <Text style={styles.username}>@{user.username}</Text>
        )}
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
