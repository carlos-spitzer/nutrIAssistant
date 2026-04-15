import React, { useState } from 'react'
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from 'react-native'
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  onClear?: () => void
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textMuted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.subtle,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.warmCharcoal,
    padding: 0,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  clearIcon: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
})
