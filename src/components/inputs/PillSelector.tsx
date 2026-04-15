import React, { useRef } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Colors, Typography, Spacing, BorderRadius } from '../../theme'

export interface PillOption {
  id: string
  label: string
  sublabel?: string
}

interface PillSelectorProps {
  options: PillOption[]
  selectedId: string
  onSelect: (id: string) => void
  style?: object
}

export function PillSelector({ options, selectedId, onSelect, style }: PillSelectorProps) {
  const ref = useRef<FlatList>(null)

  return (
    <FlatList
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      data={options}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.container, style]}
      renderItem={({ item }) => {
        const isActive = item.id === selectedId
        return (
          <TouchableOpacity
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
            {item.sublabel && (
              <Text style={[styles.sublabel, isActive && styles.sublabelActive]}>
                {item.sublabel}
              </Text>
            )}
          </TouchableOpacity>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.softMint,
    alignItems: 'center',
    minWidth: 56,
  },
  pillActive: {
    backgroundColor: Colors.healthGreen,
  },
  label: {
    ...Typography.body,
    color: Colors.warmCharcoal,
    fontFamily: Typography.body.fontFamily,
  },
  labelActive: {
    color: Colors.white,
    fontFamily: Typography.heading3.fontFamily,
  },
  sublabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  sublabelActive: {
    color: `${Colors.white}CC`,
  },
})
