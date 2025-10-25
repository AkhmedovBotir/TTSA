import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface PhoneInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = "+998 90 123 45 67",
  error,
  keyboardType = 'phone-pad',
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format phone number for display
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // If it starts with 998, remove it as we'll add +998 prefix
    let digits = cleaned;
    if (cleaned.startsWith('998')) {
      digits = cleaned.substring(3);
    }
    
    // Limit to 9 digits (Uzbek mobile numbers)
    if (digits.length > 9) {
      digits = digits.substring(0, 9);
    }
    
    // Format with spaces: 90 123 45 67
    if (digits.length === 0) {
      return '';
    } else if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.substring(0, 2)} ${digits.substring(2)}`;
    } else if (digits.length <= 7) {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    } else {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7)}`;
    }
  };

  // Convert display value back to API format
  const getApiValue = (displayText: string) => {
    const cleaned = displayText.replace(/\D/g, '');
    return cleaned.length === 9 ? `+998${cleaned}` : '';
  };

  useEffect(() => {
    // Initialize display value from prop value
    if (value && value.startsWith('+998')) {
      const digits = value.substring(4);
      setDisplayValue(formatPhoneNumber(digits));
    } else if (value) {
      setDisplayValue(formatPhoneNumber(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setDisplayValue(formatted);
    
    // Send the API format to parent
    const apiValue = getApiValue(formatted);
    onChangeText(apiValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>+998</Text>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          keyboardType={keyboardType}
          maxLength={13} // 2 3 2 2 + 3 spaces = 13 characters
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  prefix: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    padding: 0,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
});



