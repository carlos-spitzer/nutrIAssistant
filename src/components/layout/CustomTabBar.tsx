import React, { useRef } from 'react'
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import BottomSheet from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Shadows } from '../../theme'
import { AIAssistant } from './AIAssistant'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const TAB_ICONS: Record<string, { default: IoniconsName; active: IoniconsName }> = {
  index:      { default: 'home-outline',       active: 'home' },
  nutrition:  { default: 'calendar-outline',   active: 'calendar' },
  recipes:    { default: 'book-outline',       active: 'book' },
  groceries:  { default: 'cart-outline',       active: 'cart' },
}

const ICON_COLOR_DEFAULT = Colors.warmCharcoal
const ICON_COLOR_ACTIVE  = Colors.forestGreen

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const assistantRef = useRef<BottomSheet>(null)

  const openAssistant = () => assistantRef.current?.expand()

  const renderTab = (route: typeof state.routes[0], index: number) => {
    const isFocused = state.index === index
    const icons = TAB_ICONS[route.name]
    return (
      <TabButton
        key={route.key}
        iconName={isFocused ? icons?.active ?? 'ellipse' : icons?.default ?? 'ellipse-outline'}
        isFocused={isFocused}
        onPress={() => { if (!isFocused) navigation.navigate(route.name) }}
      />
    )
  }

  return (
    <>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.tabBar}>
          {state.routes.slice(0, 2).map((route, index) => renderTab(route, index))}

          {/* Center AI button */}
          <View style={styles.centerContainer}>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={openAssistant}
              activeOpacity={0.85}
            >
              <Image
                source={require('../../../assets/images/icon.png')}
                style={styles.aiLogo}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>

          {state.routes.slice(2).map((route, index) => renderTab(route, index + 2))}
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
  iconName,
  isFocused,
  onPress,
}: {
  iconName: IoniconsName
  isFocused: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={iconName}
        size={26}
        color={isFocused ? ICON_COLOR_ACTIVE : ICON_COLOR_DEFAULT}
        style={isFocused ? undefined : styles.iconInactive}
      />
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
      android: { elevation: 8 },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInactive: {
    opacity: 0.45,
  },
  centerContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.healthGreen,
    overflow: 'hidden',
    ...Shadows.elevated,
  },
  aiLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
})
