import React, { useRef } from 'react'
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
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

const H_PADDING = Spacing.md  // 16 — padding on each side of the list
const GAP = Spacing.sm         // 8 — gap between pills
const VISIBLE_ITEMS = 4        // how many pills to show at once

const screenWidth = Dimensions.get('window').width
// Total space taken by gaps between the 4 visible pills
const totalGaps = (VISIBLE_ITEMS - 1) * GAP
const PILL_WIDTH = (screenWidth - H_PADDING * 2 - totalGaps) / VISIBLE_ITEMS

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
      snapToInterval={PILL_WIDTH + GAP}
      decelerationRate="fast"
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
    paddingHorizontal: H_PADDING,
    gap: GAP,
  },
  pill: {
    width: PILL_WIDTH,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.softMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: Colors.healthGreen,
  },
  label: {
    ...Typography.bodyLarge,
    color: Colors.warmCharcoal,
    fontFamily: Typography.heading3.fontFamily,
  },
  labelActive: {
    color: Colors.white,
  },
  sublabel: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    fontFamily: Typography.heading3.fontFamily,
  },
  sublabelActive: {
    color: `${Colors.white}CC`,
  },
})
