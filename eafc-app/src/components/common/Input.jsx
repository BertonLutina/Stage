import React from 'react';
import { View, TextInput, Text } from 'react-native';

export default function Input({ label, error, className = '', ...props }) {
  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="text-white text-sm font-semibold mb-1">{label}</Text> : null}
      <TextInput
        className={`bg-card border rounded-xl px-4 py-3 text-white text-base ${error ? 'border-danger' : 'border-border'}`}
        placeholderTextColor="#6B7280"
        {...props}
      />
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
