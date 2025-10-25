import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LocationProvider } from './contexts/LocationContext';
import { NotificationProvider } from './contexts/NotificationContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <NotificationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
                           <Stack.Screen name="product/[id]" />
                 <Stack.Screen name="checkout" />
              <Stack.Screen name="orders/[orderId]" />
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="profile/change-password" />
            </Stack>
          </NotificationProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
