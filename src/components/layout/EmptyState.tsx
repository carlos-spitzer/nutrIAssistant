import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors, Typography, Spacing } from '../../theme'

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  emoji = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    ...Typography.heading2,
    color: Colors.warmCharcoal,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.healthGreen,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 100,
    marginTop: Spacing.sm,
  },
  buttonText: {
    ...Typography.bodyLarge,
    color: Colors.white,
    fontFamily: Typography.heading3.fontFamily,
  },
})
