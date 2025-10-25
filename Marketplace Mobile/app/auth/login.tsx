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

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { isLoading } = useAuth();
  const router = useRouter();

  // Refs for focus management
  const passwordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      // Send SMS for login purpose then go to code screen
      const res = await apiService.sendSms({ phoneNumber: phoneNumber.trim(), purpose: 'login' });
      if (res.success) {
        router.push({ pathname: '/auth/sms-code', params: { phoneNumber: phoneNumber.trim(), purpose: 'login' } });
      } else {
        Alert.alert('Xato', res.message || 'SMS yuborishda xatolik');
      }
    } catch (error) {
      Alert.alert('Xato', 'SMS yuborishda xatolik yuz berdi');
    }
  };

  const handleRegisterPress = () => {
    router.push('/auth/register');
  };

  const handleForgotPasswordPress = () => {
    router.push('/auth/forgot-password');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handlePasswordFocus = () => {
    // Scroll to show password field when focused
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
                <Ionicons name="storefront" size={40} color="#007AFF" />
              </View>
              <Text style={styles.title}>Xush kelibsiz!</Text>
              <Text style={styles.subtitle}>
                Hisobingizga kirish uchun ma'lumotlaringizni kiriting
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Kirish</Text>
              <Text style={styles.formSubtitle}>Ma'lumotlaringizni kiriting</Text>
            </View>

            <View style={styles.form}>
              <PhoneInput
                label="Telefon raqami"
                placeholder="90 123 45 67"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                error={errors.phoneNumber}
              />

              <Input
                ref={passwordRef}
                label="Parol"
                placeholder="Parolingizni kiriting"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={handlePasswordFocus}
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
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#007AFF',
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
    color: '#E3F2FD',
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
  loginButton: {
    marginTop: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  registerContainer: {
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
  registerText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  registerLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '700',
    marginLeft: 4,
  },
});
