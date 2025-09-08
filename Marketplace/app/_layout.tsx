import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
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
      </CartProvider>
    </AuthProvider>
  );
}
