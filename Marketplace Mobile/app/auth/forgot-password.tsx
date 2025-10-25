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
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export default function ForgotPasswordScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { forgotPassword, isLoading } = useAuth();
  const router = useRouter();
  
  // Refs for focus management
  const scrollViewRef = useRef<ScrollView>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Telefon raqam validatsiyasi - +998 formatida, 9 ta raqam
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon raqami majburiy';
    } else if (!/^\+998[0-9]{9}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak';
    }

    // Yangi parol validatsiyasi - 6-50 belgi orasida
    if (!newPassword.trim()) {
      newErrors.newPassword = 'Yangi parol majburiy';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Parol kamida 6 belgi bo\'lishi kerak';
    } else if (newPassword.length > 50) {
      newErrors.newPassword = 'Parol 50 belgidan ko\'p bo\'lmasligi kerak';
    }

    // Parol tasdiqlash
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Parolni tasdiqlash majburiy';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!phoneNumber.trim() || !/^\+998[0-9]{9}$/.test(phoneNumber.trim())) {
      Alert.alert('Xato', 'Telefon raqamini to\'g\'ri kiriting');
      return;
    }
    try {
      const res = await apiService.sendSms({ phoneNumber: phoneNumber.trim(), purpose: 'reset_password' });
      if (res.success) {
        router.push({ pathname: '/auth/sms-code', params: { phoneNumber: phoneNumber.trim(), purpose: 'reset_password' } });
      } else {
        Alert.alert('Xato', res.message || 'SMS yuborishda xatolik');
      }
    } catch (e) {
      Alert.alert('Xato', 'SMS yuborishda xatolik yuz berdi');
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
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
              <Ionicons name="lock-closed" size={40} color="#FF9500" />
            </View>
            <Text style={styles.title}>Parolni tiklash</Text>
            <Text style={styles.subtitle}>
              Telefon raqamingizni kiriting va yangi parol o'rnating
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Xavfsizlik</Text>
            <Text style={styles.formSubtitle}>Yangi parol yarating</Text>
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

            {/* SMS tasdiqlashdan keyin parolni o'zgartirish sahifasiga o'tamiz */}

            <Button
              title="Parolni o'zgartirish"
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.resetButton}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Parolingizni eslaysizmi? </Text>
            <Text style={styles.loginLink} onPress={handleBackToLogin}>
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
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FF9500',
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
    color: '#FFF4E6',
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
  resetButton: {
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
    color: '#FF9500',
    fontWeight: '700',
    marginLeft: 4,
  },
});
