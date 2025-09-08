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

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon raqami majburiy';
    } else if (!/^\+998[0-9]{9}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Telefon raqami noto\'g\'ri formatda';
    }

    if (!password.trim()) {
      newErrors.password = 'Parol majburiy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const success = await login({
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
      });

      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Xato', 'Telefon raqami yoki parol noto\'g\'ri');
      }
    } catch (error) {
      Alert.alert('Xato', 'Kirishda xatolik yuz berdi');
    }
  };

  const handleRegisterPress = () => {
    router.push('/auth/register');
  };

  const handleForgotPasswordPress = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Kirish</Text>
          <Text style={styles.subtitle}>
            Hisobingizga kirish uchun ma'lumotlaringizni kiriting
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
            label="Parol"
            placeholder="Parolingizni kiriting"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Kirish"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText} onPress={handleForgotPasswordPress}>
              Parolni unutdingizmi?
            </Text>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Hisobingiz yo'qmi? </Text>
            <Text style={styles.registerLink} onPress={handleRegisterPress}>
              Ro'yxatdan o'tish
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
  loginButton: {
    marginTop: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  registerText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  registerLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
