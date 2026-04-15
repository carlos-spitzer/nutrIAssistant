import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { NutriScore } from '../../types/nutrition'
import { NUTRISCORE_COLORS } from '../../services/nutriscore'
import { Typography } from '../../theme'

interface NutriScoreBadgeProps {
  score: NutriScore
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { width: 24, height: 24, fontSize: 11 },
  md: { width: 32, height: 32, fontSize: 14 },
  lg: { width: 48, height: 48, fontSize: 20 },
}

export function NutriScoreBadge({ score, size = 'md' }: NutriScoreBadgeProps) {
  const { width, height, fontSize } = SIZES[size]
  const color = NUTRISCORE_COLORS[score]

  return (
    <View
      style={[
        styles.badge,
        { width, height, borderRadius: width / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.letter, { fontSize }]}>{score}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: Typography.heading1.fontFamily,
    color: '#FFFFFF',
    lineHeight: undefined,
  },
})
