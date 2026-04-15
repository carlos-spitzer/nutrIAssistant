import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Colors, Typography, Spacing } from '../../theme'
import { NutritionalInfo } from '../../types/nutrition'

interface MacroBarProps {
  nutritionalInfo: NutritionalInfo
  showLabels?: boolean
  height?: number
  compact?: boolean
}

export function MacroBar({
  nutritionalInfo,
  showLabels = true,
  height = 8,
  compact = false,
}: MacroBarProps) {
  const { protein, carbs, fat } = nutritionalInfo
  const total = protein + carbs + fat
  if (total === 0) return null

  const proteinPct = (protein / total) * 100
  const carbsPct = (carbs / total) * 100
  const fatPct = (fat / total) * 100

  return (
    <View>
      <View style={[styles.bar, { height }]}>
        <View
          style={[
            styles.segment,
            { width: `${proteinPct}%`, backgroundColor: Colors.healthGreen },
          ]}
        />
        <View
          style={[
            styles.segment,
            { width: `${carbsPct}%`, backgroundColor: Colors.goldenAmber },
          ]}
        />
        <View
          style={[
            styles.segment,
            { width: `${fatPct}%`, backgroundColor: Colors.warningOrange },
          ]}
        />
      </View>
      {showLabels && !compact && (
        <View style={styles.labels}>
          <MacroLabel color={Colors.healthGreen} label="P" value={protein} />
          <MacroLabel color={Colors.goldenAmber} label="C" value={carbs} />
          <MacroLabel color={Colors.warningOrange} label="F" value={fat} />
        </View>
      )}
    </View>
  )
}

function MacroLabel({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.macroLabel}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.macroText}>
        {label} {Math.round(value)}g
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.softMint,
  },
  segment: {
    height: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  macroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroText: {
    ...Typography.caption,
    color: Colors.warmCharcoal,
  },
})
