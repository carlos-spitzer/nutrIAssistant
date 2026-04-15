import { Tabs } from 'expo-router'
import React from 'react'
import { CustomTabBar } from '../../src/components/layout/CustomTabBar'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrición' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recetas' }} />
      <Tabs.Screen name="groceries" options={{ title: 'Compra' }} />
    </Tabs>
  )
}
