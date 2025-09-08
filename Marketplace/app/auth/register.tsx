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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Ism majburiy';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Familiya majburiy';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon raqami majburiy';
    } else if (!/^\+998[0-9]{9}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Telefon raqami noto\'g\'ri formatda';
    }

    if (!password.trim()) {
      newErrors.password = 'Parol majburiy';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 belgi bo\'lishi kerak';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Parolni tasdiqlash majburiy';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    if (username.trim() && username.length < 3) {
      newErrors.username = 'Foydalanuvchi nomi kamida 3 belgi bo\'lishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const success = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
        username: username.trim() || undefined,
      });

      if (success) {
        Alert.alert(
          'Muvaffaqiyatli',
          'Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        Alert.alert('Xato', 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ro'yxatdan o'tish</Text>
          <Text style={styles.subtitle}>
            Yangi hisob yarating va mahsulotlarni sotib olishni boshlang
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Ism"
            placeholder="Ismingizni kiriting"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            error={errors.firstName}
          />

          <Input
            label="Familiya"
            placeholder="Familiyangizni kiriting"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            error={errors.lastName}
          />

          <Input
            label="Telefon raqami"
            placeholder="+998901234567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
          />

          <Input
            label="Foydalanuvchi nomi (ixtiyoriy)"
            placeholder="Foydalanuvchi nomi"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            error={errors.username}
          />

          <Input
            label="Parol"
            placeholder="Parol yarating"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Parolni tasdiqlang"
            placeholder="Parolni qayta kiriting"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title="Ro'yxatdan o'tish"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Hisobingiz bormi? </Text>
            <Text style={styles.loginLink} onPress={handleLoginPress}>
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
  registerButton: {
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
