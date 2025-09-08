import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { forgotPassword, isLoading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon raqami majburiy';
    } else if (!/^\+998[0-9]{9}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Telefon raqami noto\'g\'ri formatda';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Yangi parol majburiy';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Parol kamida 6 belgi bo\'lishi kerak';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Parolni tasdiqlash majburiy';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      const success = await forgotPassword({
        phoneNumber: phoneNumber.trim(),
        newPassword: newPassword.trim(),
      });

      if (success) {
        Alert.alert(
          'Muvaffaqiyatli',
          'Parolingiz muvaffaqiyatli o\'zgartirildi! Endi yangi parol bilan kirishingiz mumkin.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/auth/login'),
            },
          ]
        );
      } else {
        Alert.alert('Xato', 'Parolni o\'zgartirishda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Parolni o\'zgartirishda xatolik yuz berdi');
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Parolni tiklash</Text>
          <Text style={styles.subtitle}>
            Telefon raqamingizni kiriting va yangi parol o'rnating
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Telefon raqami"
            placeholder="+998901234567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
          />

          <Input
            label="Yangi parol"
            placeholder="Yangi parol yarating"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={errors.newPassword}
          />

          <Input
            label="Yangi parolni tasdiqlang"
            placeholder="Yangi parolni qayta kiriting"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title="Parolni o'zgartirish"
            onPress={handleResetPassword}
            loading={isLoading}
            style={styles.resetButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Parolingizni eslaysizmi? </Text>
            <Text style={styles.loginLink} onPress={handleBackToLogin}>
              Kirish
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  form: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  resetButton: {
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  loginText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
