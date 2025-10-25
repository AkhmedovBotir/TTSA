import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearAuthData } from "../utils/auth";
import NotificationBadge from "../components/NotificationBadge";
import Notifications from "../components/Notifications";

interface Shop {
  id: string;
  name: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  status: string;
  shop: Shop;
  createdAt: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      const [userStr, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token')
      ]);

      console.log('Token:', token);
      console.log('User data from AsyncStorage:', userStr);

      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        console.log('Parsed user data:', parsedUser);

        // If we have storeOwnerInfo as a string, try to parse it
        if (parsedUser.storeOwnerInfo && typeof parsedUser.storeOwnerInfo === 'string') {
          try {
            parsedUser.storeOwnerInfo = JSON.parse(parsedUser.storeOwnerInfo);
          } catch (e) {
            console.warn('Could not parse storeOwnerInfo:', e);
          }
        }

        setUser(parsedUser);
      } else {
        console.log('No user data found in AsyncStorage');
        // If no user data but we have a token, try to fetch user data
        if (token) {
          console.log('Token exists but no user data, redirecting to home to refresh...');
          router.replace('/(tabs)/home');
        } else {
          // If no token, go to login
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Xatolik', 'Foydalanuvchi ma\'lumotlarini yuklashda xatolik yuz berdi');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all auth-related data using our utility
      await clearAuthData();
      console.log('Logged out successfully');
      // Navigate to login screen
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Xatolik', 'Chiqishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={80} color="#007AFF" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.name}>{user.fullName}</Text>
                <Text style={styles.username}>@{user.username}</Text>
                <Text style={styles.phone}>{user.phone}</Text>
              </View>
            </View>
            <NotificationBadge onPress={() => setShowNotifications(true)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shaxsiy ma'lumotlar</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>F.I.SH</Text>
              <Text style={styles.infoValue}>{user.fullName || 'Mavjud emas'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Foydalanuvchi nomi</Text>
              <Text style={styles.infoValue}>@{user.username || 'Mavjud emas'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefon raqam</Text>
              <Text style={styles.infoValue}>{user.phone || 'Mavjud emas'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Holati</Text>
              <View style={[styles.statusBadge, user.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>
                  {user.status === 'active' ? 'Faol' : 'Nofaol'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ro'yxatdan o'tgan sana</Text>
              <Text style={styles.infoValue}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : 'Mavjud emas'}
              </Text>
            </View>
          </View>
        </View>



        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.buttonText, styles.dangerButtonText]}>Chiqish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Notifications 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  avatarContainer: {
    marginBottom: 0,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  username: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  phone: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
  },
  statusInactive: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  dangerButtonText: {
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
}); 