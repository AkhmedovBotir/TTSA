import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface CustomerData {
  fullName: string;
  birthDate: string;
  passportSeries: string;
  primaryPhone: string;
  secondaryPhone: string;
  image?: string;
}

interface PaymentScheduleItem {
  month: number;
  amount: number;
  dueDate: string;
}

interface AnketaSelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (customerData: CustomerData, installmentDuration: number) => void;
  loading?: boolean;
  totalSum?: number;
}

const INSTALLMENT_DURATIONS = [2, 3, 4, 5, 6, 10, 12];

export default function AnketaSelector({ 
  visible, 
  onClose, 
  onConfirm, 
  loading = false,
  totalSum = 0 
}: AnketaSelectorProps) {
  const [customerData, setCustomerData] = useState<CustomerData>({
    fullName: '',
    birthDate: '',
    passportSeries: '',
    primaryPhone: '+998',
    secondaryPhone: '+998',
    image: ''
  });

  // Modal ochilganda oldingi ma'lumotlarni tozalaymiz
  React.useEffect(() => {
    if (visible) {
      setCustomerData({
        fullName: '',
        birthDate: '',
        passportSeries: '',
        primaryPhone: '+998',
        secondaryPhone: '+998',
        image: ''
      });
      setSelectedDuration(6);
      setErrors({});
      setImageLoading(false);
      setShowDatePicker(false);
      setBirthDateValue(null);
      setShowPaymentSchedule(false);
    }
  }, [visible]);

  const [selectedDuration, setSelectedDuration] = useState<number>(6);
  const [errors, setErrors] = useState<Partial<CustomerData>>({});
  const [imageLoading, setImageLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDateValue, setBirthDateValue] = useState<Date | null>(null);
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);

  // To'lov jadvalini hisoblash
  const generatePaymentSchedule = (): PaymentScheduleItem[] => {
    const schedule: PaymentScheduleItem[] = [];
    const monthlyPayment = calculateMonthlyPayment();
    const currentDate = new Date();
    
    for (let month = 1; month <= selectedDuration; month++) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(currentDate.getMonth() + month);
      
      // Oxirgi oyda qolgan summani hisoblash
      let amount = monthlyPayment;
      if (month === selectedDuration) {
        const totalPaid = monthlyPayment * (selectedDuration - 1);
        amount = totalSum - totalPaid;
      }
      
      schedule.push({
        month,
        amount,
        dueDate: dueDate.toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    }
    
    return schedule;
  };

  // Rasmni Base64 ga o'tkazish funksiyasi
  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      console.log('=== CONVERT TO BASE64 DEBUG ===');
      console.log('Converting image URI to Base64:', imageUri);
      
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // MIME type ni aniqlash
      const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      console.log('Base64 conversion successful, length:', dataUrl.length);
      return dataUrl;
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw error;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerData> = {};

    if (!customerData.fullName.trim()) {
      newErrors.fullName = 'Mijoz ismi kiritilishi shart';
    }

    if (!customerData.birthDate.trim()) {
      newErrors.birthDate = 'Tug\'ilgan sana kiritilishi shart';
    } else {
      // Sana formatini tekshirish
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(customerData.birthDate)) {
        newErrors.birthDate = 'Sana noto\'g\'ri format. Masalan: 1990-01-01';
      }
    }

    if (!customerData.passportSeries.trim()) {
      newErrors.passportSeries = 'Passport seriyasi kiritilishi shart';
    } else if (!/^[A-Z]{2}\d{7}$/.test(customerData.passportSeries)) {
      newErrors.passportSeries = 'Passport seriyasi noto\'g\'ri format. Masalan: AA1234567';
    }

    if (!customerData.primaryPhone.trim()) {
      newErrors.primaryPhone = 'Asosiy telefon raqam kiritilishi shart';
    } else if (!/^\+998\d{9}$/.test(customerData.primaryPhone)) {
      newErrors.primaryPhone = 'Telefon raqam noto\'g\'ri format. Masalan: +998901234567';
    }

    if (customerData.secondaryPhone && customerData.secondaryPhone !== '+998' && !/^\+998\d{9}$/.test(customerData.secondaryPhone)) {
      newErrors.secondaryPhone = 'Ikkinchi telefon raqam noto\'g\'ri format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    console.log('=== HANDLE CONFIRM DEBUG ===');
    console.log('Customer data before confirm:', customerData);
    console.log('Selected duration:', selectedDuration);
    
    if (validateForm()) {
      console.log('Form validation passed, calling onConfirm');
      onConfirm(customerData, selectedDuration);
    } else {
      console.log('Form validation failed');
    }
  };

  const handleClose = () => {
    setCustomerData({
      fullName: '',
      birthDate: '',
      passportSeries: '',
      primaryPhone: '+998',
      secondaryPhone: '+998',
      image: ''
    });
    setSelectedDuration(6);
    setErrors({});
    setImageLoading(false);
    setShowDatePicker(false);
    setBirthDateValue(null);
    setShowPaymentSchedule(false);
    onClose();
  };

  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const onChangeBirthDate = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDateValue(selectedDate);
      const formatted = formatDate(selectedDate);
      setCustomerData(prev => ({ ...prev, birthDate: formatted }));
      if (errors.birthDate) setErrors(prev => ({ ...prev, birthDate: undefined }));
    }
  };

  const pickImage = async () => {
    try {
      setImageLoading(true);
      console.log('=== PICK IMAGE DEBUG ===');
      
      // Ruxsat so'rash
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);
      if (!permissionResult.granted) {
        Alert.alert('Ruxsat kerak', 'Rasm tanlash uchun galereya ruxsati kerak');
        return;
      }

      // Rasm tanlash
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);
      if (!result.canceled && result.assets[0]) {
        console.log('Selected image URI:', result.assets[0].uri);
        console.log('Image asset:', result.assets[0]);
        
        // Rasmni Base64 ga o'tkazish
        try {
          const base64Image = await convertImageToBase64(result.assets[0].uri);
          setCustomerData(prev => ({ ...prev, image: base64Image }));
          console.log('Customer data updated with Base64 image');
        } catch (error) {
          console.error('Failed to convert image to Base64:', error);
          Alert.alert('Xato', 'Rasmni o\'qishda xatolik yuz berdi');
        }
      } else {
        console.log('Image selection cancelled or failed');
      }
    } catch (error) {
      console.error('Rasm tanlashda xatolik:', error);
      Alert.alert('Xato', 'Rasm tanlashda xatolik yuz berdi');
    } finally {
      setImageLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setImageLoading(true);
      console.log('=== TAKE PHOTO DEBUG ===');
      
      // Ruxsat so'rash
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission result:', permissionResult);
      if (!permissionResult.granted) {
        Alert.alert('Ruxsat kerak', 'Kamera ruxsati kerak');
        return;
      }

      // Rasm olish
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Camera result:', result);
      if (!result.canceled && result.assets[0]) {
        console.log('Taken photo URI:', result.assets[0].uri);
        console.log('Photo asset:', result.assets[0]);
        
        // Rasmni Base64 ga o'tkazish
        try {
          const base64Image = await convertImageToBase64(result.assets[0].uri);
          setCustomerData(prev => ({ ...prev, image: base64Image }));
          console.log('Customer data updated with Base64 photo');
        } catch (error) {
          console.error('Failed to convert photo to Base64:', error);
          Alert.alert('Xato', 'Rasmni o\'qishda xatolik yuz berdi');
        }
      } else {
        console.log('Photo taking cancelled or failed');
      }
    } catch (error) {
      console.error('Rasm olishda xatolik:', error);
      Alert.alert('Xato', 'Rasm olishda xatolik yuz berdi');
    } finally {
      setImageLoading(false);
    }
  };

  const calculateMonthlyPayment = () => {
    const sum = totalSum || 0;
    if (sum <= 0) return 0;
    // Foizsiz muddatli to'lov - umumiy summani oylar soniga bo'lamiz
    return Math.ceil(sum / selectedDuration);
  };

  const calculateTotalPayment = () => {
    const sum = totalSum || 0;
    if (sum <= 0) return 0;
    // Foizsiz muddatli to'lov - umumiy summa o'zgarmaydi
    return sum;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalPayment = calculateTotalPayment();
  const paymentSchedule = generatePaymentSchedule();

  // Debug totalSum
  console.log('AnketaSelector render:', {
    totalSum,
    selectedDuration,
    monthlyPayment,
    totalPayment
  });

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          enabled={true}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Muddatli to'lov ma'lumotlari</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            <Text style={styles.description}>
              Muddatli to'lov uchun mijoz ma'lumotlarini va muddatni kiriting
            </Text>

            {/* Muddatli to'lov davri */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Muddatli to'lov davri</Text>
              <View style={styles.durationContainer}>
                {INSTALLMENT_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      selectedDuration === duration && styles.durationButtonSelected
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      selectedDuration === duration && styles.durationButtonTextSelected
                    ]}>
                      {duration} oy
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* To'lov ma'lumotlari */}
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentInfoTitle}>To'lov ma'lumotlari:</Text>
                {totalSum > 0 ? (
                  <>
                    <Text style={styles.paymentInfoText}>Boshlang'ich summa: {(totalSum || 0).toLocaleString()} so'm</Text>
                    <Text style={styles.paymentInfoText}>Umumiy to'lov: {totalPayment.toLocaleString()} so'm</Text>
                    <Text style={styles.paymentInfoText}>Oylik to'lov: {monthlyPayment.toLocaleString()} so'm</Text>
                    <Text style={styles.paymentInfoText}>Davr: {selectedDuration} oy</Text>
                    <Text style={[styles.paymentInfoText, styles.noInterestText]}>Foiz: 0% (foizsiz)</Text>
                    
                    {/* To'lov jadvali tugmasi */}
                    <TouchableOpacity 
                      style={styles.scheduleButton}
                      onPress={() => setShowPaymentSchedule(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                      <Text style={styles.scheduleButtonText}>To'lov jadvalini ko'rish</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.paymentInfoText, { color: '#FF3B30', fontStyle: 'italic' }]}>
                    Savatchada mahsulot yo'q. Iltimos, avval mahsulot qo'shing.
                  </Text>
                )}
              </View>
            </View>

            {/* Mijoz ma'lumotlari */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Mijoz ismi va familiyasi"
                  value={customerData.fullName}
                  onChangeText={(text) => {
                    setCustomerData(prev => ({ ...prev, fullName: text }));
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                  editable={!loading}
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                <TouchableOpacity
                  style={[styles.input, { justifyContent: 'center', paddingVertical: 15 }]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16, color: customerData.birthDate ? '#333' : '#999' }}>
                    {customerData.birthDate || "Tug'ilgan sana (YYYY-MM-DD)"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}

              {showDatePicker && (
                <DateTimePicker
                  value={birthDateValue || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeBirthDate}
                  maximumDate={new Date()}
                />
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.passportSeries && styles.inputError]}
                  placeholder="Passport seriyasi (AA1234567)"
                  value={customerData.passportSeries}
                  onChangeText={(text) => {
                    setCustomerData(prev => ({ ...prev, passportSeries: text.toUpperCase() }));
                    if (errors.passportSeries) setErrors(prev => ({ ...prev, passportSeries: undefined }));
                  }}
                  editable={!loading}
                  maxLength={9}
                />
              </View>
              {errors.passportSeries && <Text style={styles.errorText}>{errors.passportSeries}</Text>}

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.primaryPhone && styles.inputError]}
                  placeholder="Asosiy telefon raqam"
                  value={customerData.primaryPhone}
                  onChangeText={(text) => {
                    setCustomerData(prev => ({ ...prev, primaryPhone: text }));
                    if (errors.primaryPhone) setErrors(prev => ({ ...prev, primaryPhone: undefined }));
                  }}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
              {errors.primaryPhone && <Text style={styles.errorText}>{errors.primaryPhone}</Text>}

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.secondaryPhone && styles.inputError]}
                  placeholder="Ikkinchi telefon raqam (ixtiyoriy)"
                  value={customerData.secondaryPhone}
                  onChangeText={(text) => {
                    setCustomerData(prev => ({ ...prev, secondaryPhone: text }));
                    if (errors.secondaryPhone) setErrors(prev => ({ ...prev, secondaryPhone: undefined }));
                  }}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
              {errors.secondaryPhone && <Text style={styles.errorText}>{errors.secondaryPhone}</Text>}

              {/* Rasm tanlash qismi */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mijoz rasmi (ixtiyoriy)</Text>
                
                {customerData.image ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ 
                        uri: customerData.image.startsWith('data:') ? customerData.image : customerData.image 
                      }} 
                      style={styles.customerImage} 
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setCustomerData(prev => ({ ...prev, image: '' }))}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={pickImage}
                      disabled={imageLoading}
                    >
                      <Ionicons name="images-outline" size={20} color="#007AFF" />
                      <Text style={styles.imageButtonText}>Galereyadan tanlash</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={takePhoto}
                      disabled={imageLoading}
                    >
                      <Ionicons name="camera-outline" size={20} color="#007AFF" />
                      <Text style={styles.imageButtonText}>Kamera bilan olish</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {imageLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Rasm yuklanmoqda...</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.confirmButton, loading && styles.buttonDisabled]} 
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Muddatli to'lov yaratish</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* To'lov jadvali modali */}
      <Modal
        visible={showPaymentSchedule}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPaymentSchedule(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>To'lov jadvali</Text>
            <TouchableOpacity onPress={() => setShowPaymentSchedule(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.scheduleSummary}>
              <Text style={styles.scheduleSummaryTitle}>Jami ma'lumotlar:</Text>
              <Text style={styles.scheduleSummaryText}>Umumiy summa: {totalPayment.toLocaleString()} so'm</Text>
              <Text style={styles.scheduleSummaryText}>Davr: {selectedDuration} oy</Text>
              <Text style={styles.scheduleSummaryText}>Oylik to'lov: {monthlyPayment.toLocaleString()} so'm</Text>
            </View>

            <View style={styles.scheduleContainer}>
              <Text style={styles.sectionTitle}>Oylik to'lovlar:</Text>
              {paymentSchedule.map((item, index) => (
                <View key={index} style={styles.scheduleItem}>
                  <View style={styles.scheduleItemHeader}>
                    <Text style={styles.scheduleItemMonth}>{item.month}-oy</Text>
                    <Text style={styles.scheduleItemAmount}>{item.amount.toLocaleString()} so'm</Text>
                  </View>
                  <Text style={styles.scheduleItemDate}>To'lov sanasi: {item.dueDate}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40, // Tugma uchun qo'shimcha joy
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  durationButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  durationButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  durationButtonTextSelected: {
    color: 'white',
  },
  paymentInfo: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  noInterestText: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 15,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
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
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 15,
    marginLeft: 5,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 15,
  },
  customerImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  imageButtonsContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 15,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 10,
  },
  imageButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  // To'lov jadvali stillari
  scheduleSummary: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  scheduleSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scheduleSummaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  scheduleItem: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  scheduleItemMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scheduleItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scheduleItemDate: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
