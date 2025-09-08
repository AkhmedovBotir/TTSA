import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, KeyboardAvoidingView } from 'react-native';
import { storeAuthData } from '../utils/auth';

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  seller: {
    id: string;
    fullName: string;
    username: string;
    phone: string;
    status: string;
    shop: {
      id: string;
      name: string;
    };
    createdAt: string;
  };
}

export default function LoginForm() {
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Xato', 'Telefon raqam va parol kiritilishi shart');
      return;
    }

    // Phone number format validation
    const phoneRegex = /^\+998[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Xato', 'Noto\'g\'ri telefon raqam formati. Format: +998901234567');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.ttsa.uz/api/seller-mobile/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phone.trim(),
          password: password.trim()
        }),
      });

      const data: LoginResponse = await response.json();
      console.log('Login response:', data);
      
      if (response.ok && data.success && data.token && data.seller) {
        // Store the full response data to preserve all fields
        await storeAuthData(data.token, {
          seller: data.seller,
          token: data.token
        });
        
        console.log('Login successful. Seller:', data.seller.fullName);
        router.replace('/(tabs)/home');
      } else {
        throw new Error(data.message || 'Login failed: ' + response.status);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || '';
      
      // Handle specific error cases based on API documentation
      if (errorMessage.includes('Telefon raqam yoki parol noto\'g\'ri')) {
        Alert.alert('Xato', 'Telefon raqam yoki parol noto\'g\'ri');
      } else if (errorMessage.includes('Sizning hisobingiz faol emas')) {
        Alert.alert('Xato', 'Sizning hisobingiz faol emas. Iltimos, do\'kon egasi bilan bog\'laning.');
      } else if (errorMessage.includes('Do\'kon faol emas')) {
        Alert.alert('Xato', 'Do\'kon faol emas. Iltimos, do\'kon egasi bilan bog\'laning.');
      } else if (errorMessage.includes('Noto\'g\'ri telefon raqam formati')) {
        Alert.alert('Xato', 'Noto\'g\'ri telefon raqam formati. Format: +998901234567');
      } else {
        Alert.alert('Xato', 'Server xatosi yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Tizimga kirish</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="phone-portrait-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Telefon raqam"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={13}
            autoComplete="tel"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Parol"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Kirish...' : 'Kirish'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 