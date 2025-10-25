import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PhoneInput } from '../components/PhoneInput';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

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

  // Refs for focus management
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Ism validatsiyasi - kamida 2 belgi
    if (!firstName.trim()) {
      newErrors.firstName = 'Ism majburiy';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'Ism kamida 2 belgi bo\'lishi kerak';
    }

    // Familiya validatsiyasi - kamida 2 belgi
    if (!lastName.trim()) {
      newErrors.lastName = 'Familiya majburiy';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Familiya kamida 2 belgi bo\'lishi kerak';
    }

    // Telefon raqam validatsiyasi - +998 formatida, 9 ta raqam
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon raqami majburiy';
    } else if (!/^\+998[0-9]{9}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak';
    }

    // Parol validatsiyasi - 6-50 belgi orasida
    if (!password.trim()) {
      newErrors.password = 'Parol majburiy';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 belgi bo\'lishi kerak';
    } else if (password.length > 50) {
      newErrors.password = 'Parol 50 belgidan ko\'p bo\'lmasligi kerak';
    }

    // Parol tasdiqlash
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Parolni tasdiqlash majburiy';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    // Username validatsiyasi - 3-20 belgi, faqat harflar, raqamlar va _
    if (username.trim()) {
      if (username.trim().length < 3) {
        newErrors.username = 'Foydalanuvchi nomi kamida 3 belgi bo\'lishi kerak';
      } else if (username.trim().length > 20) {
        newErrors.username = 'Foydalanuvchi nomi 20 belgidan ko\'p bo\'lmasligi kerak';
      } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        newErrors.username = 'Foydalanuvchi nomi faqat harflar, raqamlar va _ belgisini o\'z ichiga olishi mumkin';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      // Trigger SMS for register purpose, then go to code screen
      const res = await apiService.sendSms({ phoneNumber: phoneNumber.trim(), purpose: 'register' });
      if (res.success) {
        router.push({ 
          pathname: '/auth/sms-code', 
          params: { 
            phoneNumber: phoneNumber.trim(), 
            purpose: 'register',
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: username.trim() || ''
          } 
        });
      } else {
        Alert.alert('Xato', res.message || 'SMS yuborishda xatolik');
      }
    } catch (error) {
      Alert.alert('Xato', 'SMS yuborishda xatolik yuz berdi');
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handlePasswordSubmit = () => {
    // Small delay to ensure smooth transition
    setTimeout(() => {
      confirmPasswordRef.current?.focus();
      // Scroll to show confirm password field
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handlePasswordFocus = () => {
    // Scroll to show password field when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleConfirmPasswordFocus = () => {
    // Scroll to show confirm password field when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
          {/* Header with gradient background */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Ionicons name="person-add" size={40} color="#007AFF" />
              </View>
              <Text style={styles.title}>Ro'yxatdan o'tish</Text>
              <Text style={styles.subtitle}>
                Yangi hisob yarating va mahsulotlarni sotib olishni boshlang
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Shaxsiy ma'lumotlar</Text>
              <Text style={styles.formSubtitle}>Ma'lumotlaringizni to'liq kiriting</Text>
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

              <PhoneInput
                label="Telefon raqami"
                placeholder="90 123 45 67"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
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
                ref={passwordRef}
                label="Parol"
                placeholder="Parol yarating"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                returnKeyType="next"
                onSubmitEditing={handlePasswordSubmit}
                onFocus={handlePasswordFocus}
              />

              <Input
                ref={confirmPasswordRef}
                label="Parolni tasdiqlang"
                placeholder="Parolni qayta kiriting"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                onFocus={handleConfirmPasswordFocus}
              />

              <Button
                title="Ro'yxatdan o'tish"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.registerButton}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Hisobingiz bormi? </Text>
              <Text style={styles.loginLink} onPress={handleLoginPress}>
                Kirish
              </Text>
            </View>
          </View>
        </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  header: {
    backgroundColor: '#34C759',
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  formHeader: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  form: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  registerButton: {
    marginTop: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loginText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loginLink: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '700',
    marginLeft: 4,
  },
});
