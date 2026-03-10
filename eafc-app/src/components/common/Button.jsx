import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, className = '' }) {
  const base = 'rounded-xl py-3 px-6 items-center justify-center';
  const variants = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    outline: 'border border-primary bg-transparent',
    danger: 'bg-danger',
    ghost: 'bg-surface',
  };
  const textVariants = {
    primary: 'text-dark font-bold text-base',
    secondary: 'text-dark font-bold text-base',
    accent: 'text-white font-bold text-base',
    outline: 'text-primary font-bold text-base',
    danger: 'text-white font-bold text-base',
    ghost: 'text-white font-semibold text-base',
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? '#0F0F0F' : '#fff'} />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
