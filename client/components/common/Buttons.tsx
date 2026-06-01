import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ 
  value, 
  onChangeText, 
  placeholder = '搜索食物...',
  onFocus,
  onBlur,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#9CA3AF" style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function PrimaryButton({ 
  title, 
  onPress, 
  disabled = false,
  loading = false,
  icon,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        ) : (
          <View style={styles.buttonText}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <View style={{ width: 8 }} />
            <Text style={styles.primaryButtonText}>{title}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export function SecondaryButton({ 
  title, 
  onPress, 
  disabled = false,
  icon,
  variant = 'default',
}: SecondaryButtonProps) {
  const textColor = variant === 'danger' ? '#EF4444' : '#10B981';
  
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {icon}
        {icon && <View style={{ width: 6 }} />}
        <Text style={[styles.secondaryButtonText, { color: textColor }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function TabButton({ label, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={active ? styles.tabButtonTextActive : styles.tabButtonText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // SearchBar styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },

  // PrimaryButton styles
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },

  // SecondaryButton styles
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // TabButton styles
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#10B981',
  },
  tabButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
