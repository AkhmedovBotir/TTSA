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

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { changePassword, isLoading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Joriy parol majburiy';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Yangi parol majburiy';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Yangi parol kamida 6 belgi bo\'lishi kerak';
    } else if (newPassword.length > 50) {
      newErrors.newPassword = 'Parol 50 belgidan ko\'p bo\'lmasligi kerak';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Parolni tasdiqlash majburiy';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'Yangi parol joriy paroldan farq qilishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      const success = await changePassword(newPassword);
      
      if (success) {
        Alert.alert(
          'Muvaffaqiyatli',
          'Parolingiz muvaffaqiyatli o\'zgartirildi',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setErrors({});
                router.back();
              },
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

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Parolni o'zgartirish</Text>
          <Text style={styles.subtitle}>
            Xavfsizlik uchun yangi parol o'rnating
          </Text>
        </View>

        {/* Password Form */}
        <View style={styles.form}>
          <Input
            label="Joriy parol"
            placeholder="Joriy parolingizni kiriting"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            error={errors.currentPassword}
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

          {/* Password Requirements */}
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Parol talablari:</Text>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementText}>• Kamida 6 belgi</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementText}>• Joriy paroldan farq qilishi</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementText}>• Xavfsizlik uchun kuchli parol tanlang</Text>
            </View>
          </View>

          {/* Security Tips */}
          <View style={styles.securityTips}>
            <Text style={styles.securityTipsTitle}>Xavfsizlik maslahatlari:</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>• Parolingizni hech kimga bermang</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>• Har xil ilovalar uchun boshqa parollar ishlatish</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>• Muntazam ravishda parolni o'zgartiring</Text>
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
          title="Parolni o'zgartirish"
          onPress={handleChangePassword}
          loading={isLoading}
          style={styles.changeButton}
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
  requirements: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  requirementItem: {
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  securityTips: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  securityTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
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
  changeButton: {
    flex: 1,
  },
});






