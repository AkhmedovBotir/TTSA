import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

export default function EditProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user, updateProfile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setUsername(user.username || '');
    }
  }, [user]);

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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const success = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim() || undefined,
      });

      if (success) {
        Alert.alert(
          'Muvaffaqiyatli',
          'Profil ma\'lumotlari yangilandi',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Xato', 'Profilni yangilashda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Profilni yangilashda xatolik yuz berdi');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profilni tahrirlash</Text>
          <Text style={styles.subtitle}>
            Shaxsiy ma'lumotlaringizni o'zgartiring
          </Text>
        </View>

        {/* Profile Form */}
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
            label="Foydalanuvchi nomi (ixtiyoriy)"
            placeholder="Foydalanuvchi nomi"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            error={errors.username}
          />

          {/* Current Info Display */}
          <View style={styles.currentInfo}>
            <Text style={styles.currentInfoTitle}>Joriy ma'lumotlar</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefon raqami:</Text>
              <Text style={styles.infoValue}>{user.phoneNumber}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>To'liq ism:</Text>
              <Text style={styles.infoValue}>{user.fullName}</Text>
            </View>
            
            {user.username && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Foydalanuvchi nomi:</Text>
                <Text style={styles.infoValue}>@{user.username}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Holati:</Text>
              <Text style={[styles.infoValue, { color: user.isVerified ? '#34C759' : '#FF9500' }]}>
                {user.isVerified ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <Button
          title="Bekor qilish"
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
        />
        
        <Button
          title="Saqlash"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
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
    fontSize: 24,
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
  currentInfo: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  currentInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});






