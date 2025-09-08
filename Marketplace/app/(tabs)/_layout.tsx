import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  if (!isAuthenticated) {
    return null; // Auth screens will handle this
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Mahsulotlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Savatcha',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="cart" size={size} color={color} />
              {itemCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#FF3B30',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: '600',
                    }}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Buyurtmalar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
