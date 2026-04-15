import React, { useRef, useEffect } from 'react'
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import BottomSheet from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing, Shadows, Typography } from '../../theme'
import { AIAssistant } from './AIAssistant'

const TAB_ICONS: Record<string, string> = {
  index: '🏠',
  nutrition: '🥗',
  recipes: '🍳',
  groceries: '🛒',
}

const TAB_LABELS: Record<string, string> = {
  index: 'Inicio',
  nutrition: 'Nutrición',
  recipes: 'Recetas',
  groceries: 'Compra',
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const assistantRef = useRef<BottomSheet>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseOpacity = useRef(new Animated.Value(0.5)).current

  // Idle pulse animation on the AI button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const openAssistant = () => {
    assistantRef.current?.expand()
  }

  return (
    <>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.tabBar}>
          {/* Left two tabs */}
          {state.routes.slice(0, 2).map((route, index) => {
            const isFocused = state.index === index
            return (
              <TabButton
                key={route.key}
                icon={TAB_ICONS[route.name] ?? '•'}
                label={TAB_LABELS[route.name] ?? route.name}
                isFocused={isFocused}
                onPress={() => {
                  if (!isFocused) {
                    navigation.navigate(route.name)
                  }
                }}
              />
            )
          })}

          {/* Center AI button */}
          <View style={styles.centerContainer}>
            <Animated.View
              style={[
                styles.aiPulse,
                { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
              ]}
            />
            <TouchableOpacity
              style={styles.aiButton}
              onPress={openAssistant}
              activeOpacity={0.85}
            >
              <Text style={styles.aiIcon}>🤖</Text>
            </TouchableOpacity>
          </View>

          {/* Right two tabs */}
          {state.routes.slice(2).map((route, index) => {
            const actualIndex = index + 2
            const isFocused = state.index === actualIndex
            return (
              <TabButton
                key={route.key}
                icon={TAB_ICONS[route.name] ?? '•'}
                label={TAB_LABELS[route.name] ?? route.name}
                isFocused={isFocused}
                onPress={() => {
                  if (!isFocused) {
                    navigation.navigate(route.name)
                  }
                }}
              />
            )
          })}
        </View>
      </View>

      <AIAssistant
        ref={assistantRef}
        onClose={() => assistantRef.current?.close()}
      />
    </>
  )
}

function TabButton({
  icon,
  label,
  isFocused,
  onPress,
}: {
  icon: string
  label: string
  isFocused: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    ...Typography.caption,
    color: Colors.light.tabBarInactive,
  },
  tabLabelActive: {
    color: Colors.forestGreen,
    fontFamily: Typography.heading3.fontFamily,
  },
  centerContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.healthGreen,
  },
  aiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.healthGreen,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 12,
    ...Shadows.elevated,
  },
  aiIcon: {
    fontSize: 24,
  },
})
