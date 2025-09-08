import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : '#007AFF'}
          size="small"
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Variants
  primary: {
    backgroundColor: '#007AFF',
  },
  primaryText: {
    color: '#ffffff',
  },
  
  secondary: {
    backgroundColor: '#F2F2F7',
  },
  secondaryText: {
    color: '#007AFF',
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  outlineText: {
    color: '#007AFF',
  },
  
  danger: {
    backgroundColor: '#FF3B30',
  },
  dangerText: {
    color: '#ffffff',
  },
  
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallText: {
    fontSize: 14,
  },
  
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});



