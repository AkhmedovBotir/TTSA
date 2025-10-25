import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

type Purpose = 'login' | 'register' | 'reset_password';

export default function SmsCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    phoneNumber: string; 
    purpose?: Purpose;
    firstName?: string;
    lastName?: string;
    username?: string;
  }>();
  const phoneNumber = (params.phoneNumber as string) || '';
  const purpose = ((params.purpose as Purpose) || 'login');
  const { loginWithSms, registerWithSms, isLoading } = useAuth();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  
  // Refs for focus management
  const codeInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setInterval(() => setCountdown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-focus the code input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      codeInputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Xato', 'SMS kodini to\'liq kiriting (6 xonali)');
      return;
    }
    
    if (purpose === 'login') {
      // Use the new SMS login method
      setIsVerifying(true);
      console.log('Starting SMS login with:', { phoneNumber, code });
      const success = await loginWithSms(phoneNumber, code);
      console.log('SMS login result:', success);
      if (success) {
        console.log('SMS login successful, redirecting to main app');
        // User is now logged in automatically, redirect to main app
        router.replace('/(tabs)');
      } else {
        console.log('SMS login failed');
        Alert.alert('Xato', 'SMS kodni tasdiqlashda xatolik');
      }
      setIsVerifying(false);
    } else if (purpose === 'register') {
      // Handle registration with SMS
      setIsVerifying(true);
      const success = await registerWithSms({
        firstName: params.firstName || '',
        lastName: params.lastName || '',
        phoneNumber: phoneNumber,
        username: params.username || '',
        smsCode: code
      });
      
      if (success) {
        console.log('SMS registration successful, redirecting to main app');
        router.replace('/(tabs)');
      } else {
        console.log('SMS registration failed');
        Alert.alert('Xato', 'Ro\'yxatdan o\'tishda xatolik');
      }
      setIsVerifying(false);
    } else {
      // Handle other purposes (reset_password)
      try {
        setIsVerifying(true);
        const res = await apiService.verifySms({ phoneNumber, code, purpose });
        if (res.success) {
          if (purpose === 'reset_password') {
            router.replace({ pathname: '/auth/reset-password', params: { phoneNumber } });
          }
        } else {
          Alert.alert('Xato', res.message || 'SMS kodni tasdiqlashda xatolik');
        }
      } catch (e) {
        Alert.alert('Xato', 'SMS kodni tasdiqlashda xatolik yuz berdi');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleResend = async () => {
    try {
      setIsVerifying(true);
      const res = await apiService.sendSms({ phoneNumber, purpose });
      if (res.success) {
        setCountdown(300);
        Alert.alert('Yuborildi', 'Yangi SMS kod yuborildi');
      } else {
        Alert.alert('Xato', res.message || 'SMS yuborishda xatolik');
      }
    } catch (e) {
      Alert.alert('Xato', 'SMS yuborishda xatolik yuz berdi');
    } finally {
      setIsVerifying(false);
    }
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
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubbles" size={36} color="#007AFF" />
              </View>
              <Text style={styles.title}>SMS kodni kiriting</Text>
              <Text style={styles.subtitle}>{phoneNumber} raqamiga yuborilgan 6 xonali kodni kiriting</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>SMS kod</Text>
              <TextInput
                ref={codeInputRef}
                style={styles.codeInput}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />

              <Button title="Tasdiqlash" onPress={handleVerify} loading={isLoading || isVerifying} style={{ marginTop: 16 }} />

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>
                  Qayta yuborish: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </Text>
                <Text
                  style={[styles.resendLink, countdown > 0 && { opacity: 0.4 }]}
                  onPress={countdown > 0 ? undefined : handleResend}
                >
                  Qayta yuborish
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16 },
  label: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  codeInput: {
    fontSize: 22, letterSpacing: 8, backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12,
    textAlign: 'center', color: '#1C1C1E',
  },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  resendText: { fontSize: 14, color: '#8E8E93' },
  resendLink: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
});




