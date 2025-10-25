import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phoneNumber?: string }>();
  const phoneFromParams = (params.phoneNumber as string) || '';
  const { forgotPassword, isLoading } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState(phoneFromParams);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!phoneNumber || !/^\+998[0-9]{9}$/.test(phoneNumber)) {
      Alert.alert('Xato', 'Telefon raqamini +998XXXXXXXXX formatida kiriting');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Xato', 'Parol kamida 6 belgi bo‘lishi kerak');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Xato', 'Parollar mos kelmadi');
      return;
    }

    try {
      const ok = await forgotPassword(phoneNumber, newPassword);
      if (ok) {
        Alert.alert('Muvaffaqiyatli', 'Parol yangilandi', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
      } else {
        Alert.alert('Xato', 'Parolni yangilashda xatolik');
      }
    } catch (e) {
      Alert.alert('Xato', 'Parolni yangilashda xatolik yuz berdi');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={36} color="#FF9500" />
          </View>
          <Text style={styles.title}>Yangi parol o‘rnatish</Text>
          <Text style={styles.subtitle}>Telefon raqamingiz va yangi parolni kiriting</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Telefon raqami"
            placeholder="+998901234567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <Input
            label="Yangi parol"
            placeholder="Yangi parol"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Input
            label="Parolni tasdiqlash"
            placeholder="Parolni qayta kiriting"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button title="Parolni saqlash" onPress={handleSubmit} loading={isLoading} style={{ marginTop: 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 16 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8E8E93' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, margin: 16 },
});




