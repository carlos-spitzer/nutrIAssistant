import React, { useEffect, useState } from 'react'
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const MEAL_CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.72)
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProfiles } from '../../src/modules/profiles/ProfilesContext'
import { useInventory } from '../../src/modules/inventory/useInventory'
import { usePlanner } from '../../src/modules/planner/PlannerContext'
import { useRecipeDB } from '../../src/modules/recipes/useRecipeDB'
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme'
import { ProgressRing } from '../../src/components/charts/ProgressRing'
import { MemberCard } from '../../src/components/cards/MemberCard'
import { MealCard } from '../../src/components/cards/MealCard'
import { RecipeCard } from '../../src/components/cards/RecipeCard'
import { Recipe } from '../../src/types/recipes'

const NEWS_ITEMS = [
  {
    id: '1',
    headline: 'La dieta mediterránea reduce el riesgo de demencia en un 25%, según nuevo estudio',
    source: 'Harvard Health',
    emoji: '🫒',
  },
  {
    id: '2',
    headline: 'Calcio y Vitamina D: por qué importan para la salud ósea en todas las edades',
    source: 'Mayo Clinic',
    emoji: '🦴',
  },
  {
    id: '3',
    headline: 'Cómo reducir el sodio en tu dieta sin sacrificar el sabor',
    source: 'American Heart Association',
    emoji: '🧂',
  },
]

export default function HomeScreen() {
  const { profiles, familyName } = useProfiles()
  const { expiryAlerts, getLowStockAlerts } = useInventory()
  const { weekPlans } = usePlanner()
  const { getRandom } = useRecipeDB()
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayPlan = weekPlans.find((p) => p.date === todayStr)
  const todayDisplay = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  useEffect(() => {
    getRandom(5).then(setFeaturedRecipes).catch((e) => {
      console.warn('[Home] Error cargando recetas:', e)
    })
  }, [])

  const lowStockAlerts = getLowStockAlerts()
  const allAlerts = [...expiryAlerts, ...lowStockAlerts].slice(0, 5)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{todayDisplay}</Text>
            <Text style={styles.greeting}>¡Hola, familia {familyName}! 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/scanner')} style={styles.iconBtn}>
              <Ionicons name="camera-outline" size={24} color={Colors.warmCharcoal} style={styles.iconInactive} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={24} color={Colors.warmCharcoal} style={styles.iconInactive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Puntuación nutricional diaria */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreCard}>
            <ProgressRing
              value={42}
              max={100}
              size={120}
              strokeWidth={12}
              color={Colors.healthGreen}
              label="42"
              sublabel="Puntuación hoy"
              animate
            />
            <View style={styles.macroRings}>
              {[
                { label: 'Proteínas', color: Colors.healthGreen, value: 65, max: 100 },
                { label: 'Carbohid.', color: Colors.goldenAmber, value: 40, max: 100 },
                { label: 'Grasas', color: Colors.warningOrange, value: 30, max: 100 },
              ].map((m) => (
                <View key={m.label} style={styles.miniRing}>
                  <ProgressRing
                    value={m.value}
                    max={m.max}
                    size={52}
                    strokeWidth={6}
                    color={m.color}
                    showPercent
                    animate
                  />
                  <Text style={styles.miniLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Progreso familiar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progreso familiar</Text>
          {profiles.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={profiles}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.stripContent}
              renderItem={({ item }) => (
                <MemberCard member={item} caloriesConsumed={0} />
              )}
            />
          ) : (
            <Text style={styles.emptyText}>Cargando perfiles...</Text>
          )}
        </View>

        {/* Menú de hoy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menú de hoy</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/nutrition')}>
              <Text style={styles.seeAll}>Ver todo →</Text>
            </TouchableOpacity>
          </View>
          {todayPlan ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={(['breakfast', 'lunch', 'dinner'] as const)}
              keyExtractor={(m) => m}
              contentContainerStyle={styles.stripContent}
              renderItem={({ item: mealType }) => (
                <View style={{ width: MEAL_CARD_WIDTH }}>
                  <MealCard
                    mealType={mealType}
                    recipe={todayPlan.meals[mealType]}
                    members={profiles}
                    onPress={() => {
                      const recipe = todayPlan.meals[mealType]
                      if (recipe) router.push(`/recipe/${recipe.id}`)
                    }}
                  />
                </View>
              )}
            />
          ) : (
            <View style={styles.noMealCard}>
              <Text style={styles.noMealText}>Sin plan de comidas para hoy.</Text>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => router.push('/(tabs)/nutrition')}
              >
                <Text style={styles.ctaBtnText}>Generar plan →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recetas recomendadas */}
        {featuredRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recetas para ti</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}>
                <Text style={styles.seeAll}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredRecipes}
              keyExtractor={(r) => r.id}
              contentContainerStyle={styles.stripContent}
              renderItem={({ item }) => (
                <RecipeCard
                  recipe={item}
                  compact
                  onPress={() => router.push(`/recipe/${item.id}`)}
                />
              )}
            />
          </View>
        )}

        {/* Alertas de despensa */}
        {allAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Alertas de despensa</Text>
            <View style={styles.alertsCard}>
              {allAlerts.map((item) => {
                const isExpiring = expiryAlerts.some((a) => a.id === item.id)
                return (
                  <View key={item.id} style={styles.alertRow}>
                    <View style={[styles.alertDot, { backgroundColor: isExpiring ? Colors.errorRed : Colors.warningOrange }]} />
                    <Text style={styles.alertText}>
                      {item.name} — {isExpiring ? `caduca ${item.expiryDate}` : 'bajo en stock'}
                    </Text>
                    <TouchableOpacity
                      style={styles.alertCTA}
                      onPress={() => router.push('/(tabs)/groceries')}
                    >
                      <Text style={styles.alertCTAText}>+ Compra</Text>
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Noticias de salud */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Noticias de salud</Text>
          {NEWS_ITEMS.map((item) => (
            <View key={item.id} style={styles.newsCard}>
              <Text style={styles.newsEmoji}>{item.emoji}</Text>
              <View style={styles.newsContent}>
                <Text style={styles.newsHeadline}>{item.headline}</Text>
                <Text style={styles.newsSource}>{item.source}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: {},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  date: { ...Typography.caption, color: Colors.light.textSecondary, textTransform: 'uppercase' },
  greeting: { ...Typography.heading2, color: Colors.warmCharcoal },
  headerIcons: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { padding: Spacing.xs },
  iconInactive: { opacity: 0.55 },
  scoreSection: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  scoreCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', ...Shadows.card,
  },
  macroRings: { flexDirection: 'row', gap: Spacing.md },
  miniRing: { alignItems: 'center', gap: 2 },
  miniLabel: { ...Typography.caption, color: Colors.light.textSecondary },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.heading2, color: Colors.warmCharcoal, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  seeAll: { ...Typography.body, color: Colors.healthGreen },
  stripContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.light.textMuted, paddingHorizontal: Spacing.md },
  noMealCard: {
    marginHorizontal: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, alignItems: 'center', gap: Spacing.md, ...Shadows.card,
  },
  noMealText: { ...Typography.body, color: Colors.light.textSecondary },
  ctaBtn: { backgroundColor: Colors.healthGreen, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.pill },
  ctaBtnText: { ...Typography.body, color: Colors.white, fontFamily: Typography.heading3.fontFamily },
  alertsCard: { marginHorizontal: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, ...Shadows.card },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { ...Typography.body, color: Colors.warmCharcoal, flex: 1 },
  alertCTA: { backgroundColor: Colors.softMint, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  alertCTAText: { ...Typography.caption, color: Colors.healthGreen, fontFamily: Typography.body.fontFamily },
  newsCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginHorizontal: Spacing.md, backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.subtle,
  },
  newsEmoji: { fontSize: 28 },
  newsContent: { flex: 1, gap: Spacing.xs },
  newsHeadline: { ...Typography.body, color: Colors.warmCharcoal, fontFamily: Typography.heading3.fontFamily },
  newsSource: { ...Typography.caption, color: Colors.light.textSecondary },
})
