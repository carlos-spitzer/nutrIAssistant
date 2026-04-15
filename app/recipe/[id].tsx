import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useRecipeDB } from '../../src/modules/recipes/useRecipeDB'
import { useInventory } from '../../src/modules/inventory/useInventory'
import { useGroceries } from '../../src/modules/groceries/useGroceries'
import { usePlanner } from '../../src/modules/planner/usePlanner'
import { useProfiles } from '../../src/modules/profiles/ProfilesContext'
import { Recipe, RecipeIngredient } from '../../src/types/recipes'
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme'
import { NutriScoreBadge } from '../../src/components/charts/NutriScoreBadge'
import { MacroBar } from '../../src/components/charts/MacroBar'
import { FamilyCompatibilityRow } from '../../src/components/badges/CompatibilityBadge'

const PARALLAX_HEIGHT = 280
const HEADER_HEIGHT = 64

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getById, favorite } = useRecipeDB()
  const { items: inventory, decrementIngredients } = useInventory()
  const { addItem: addToGroceries } = useGroceries()
  const { weekPlans, loadWeek } = usePlanner()
  const { profiles } = useProfiles()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [servings, setServings] = useState(1)
  const [instructionsExpanded, setInstructionsExpanded] = useState(false)
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set())
  const [isFavorite, setIsFavorite] = useState(false)

  const scrollY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!id) return
    getById(id).then((r) => {
      if (r) {
        setRecipe(r)
        setServings(r.servings)
        setIsFavorite(r.isFavorite ?? false)
      }
      setIsLoading(false)
    })
  }, [id])

  const scaledNutrition = useCallback(
    (value: number) => {
      if (!recipe) return value
      const ratio = servings / Math.max(recipe.servings, 1)
      return Math.round(value * ratio)
    },
    [servings, recipe]
  )

  const scaledIngredientQty = useCallback(
    (qty: number) => {
      if (!recipe) return qty
      const ratio = servings / Math.max(recipe.servings, 1)
      return Math.round(qty * ratio * 10) / 10
    },
    [servings, recipe]
  )

  const ingredientInPantry = useCallback(
    (ingredient: RecipeIngredient): boolean => {
      return inventory.some(
        (item) =>
          item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
          ingredient.name.toLowerCase().includes(item.name.toLowerCase())
      )
    },
    [inventory]
  )

  const handleFavorite = async () => {
    if (!recipe) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await favorite(recipe.id)
    setIsFavorite((prev) => !prev)
  }

  const handleAddIngredientToCart = async (ingredient: RecipeIngredient) => {
    await addToGroceries(ingredient.name, scaledIngredientQty(ingredient.quantity), ingredient.unit)
    setAddedToCart((prev) => new Set(prev).add(ingredient.name))
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleAddAllMissingToCart = async () => {
    if (!recipe) return
    const missing = recipe.ingredients.filter((i) => !ingredientInPantry(i))
    if (missing.length === 0) {
      Alert.alert('¡Todo en despensa!', 'Ya tienes todos los ingredientes.')
      return
    }
    for (const ing of missing) {
      await addToGroceries(ing.name, scaledIngredientQty(ing.quantity), ing.unit)
    }
    setAddedToCart(new Set(missing.map((i) => i.name)))
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('¡Añadido!', `${missing.length} ingrediente${missing.length > 1 ? 's' : ''} añadido${missing.length > 1 ? 's' : ''} a tu lista de la compra.`)
  }

  const handleAddToPlan = async () => {
    if (!recipe) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      'Añadir al plan',
      '¿En qué comida quieres añadir esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desayuno',
          onPress: () => Alert.alert('¡Añadido!', `${recipe.name} añadida al desayuno de hoy.`),
        },
        {
          text: 'Comida',
          onPress: () => Alert.alert('¡Añadido!', `${recipe.name} añadida a la comida de hoy.`),
        },
        {
          text: 'Cena',
          onPress: () => Alert.alert('¡Añadido!', `${recipe.name} añadida a la cena de hoy.`),
        },
      ]
    )
  }

  const handleCookNow = async () => {
    if (!recipe) return
    Alert.alert(
      'Cocinar ahora',
      `Se usarán ingredientes de tu despensa para "${recipe.name}". ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '¡Cocinar!',
          onPress: async () => {
            await decrementIngredients(recipe)
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            Alert.alert('¡Buen provecho!', 'La despensa ha sido actualizada.')
          },
        },
      ]
    )
  }

  // Parallax image animation
  const imageTranslate = scrollY.interpolate({
    inputRange: [-100, 0, PARALLAX_HEIGHT],
    outputRange: [-30, 0, PARALLAX_HEIGHT * 0.4],
    extrapolate: 'clamp',
  })
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  })
  const headerOpacity = scrollY.interpolate({
    inputRange: [PARALLAX_HEIGHT - 80, PARALLAX_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.healthGreen} size="large" />
      </View>
    )
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Text style={styles.errorText}>Receta no encontrada.</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnFallbackText}>← Atrás</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const totalTime = recipe.prepTime + recipe.cookTime
  const missingCount = recipe.ingredients.filter((i) => !ingredientInPantry(i)).length
  const pantryCount = recipe.ingredients.length - missingCount

  return (
    <View style={styles.container}>
      {/* Sticky header (fades in on scroll) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']} style={styles.stickyHeaderInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackBtn}>
            <Text style={styles.stickyBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.stickyTitle} numberOfLines={1}>{recipe.name}</Text>
          <TouchableOpacity onPress={handleFavorite} style={styles.stickyFavBtn}>
            <Text style={styles.stickyFavText}>{isFavorite ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Parallax Image */}
        <View style={styles.imageWrapper}>
          <Animated.View
            style={[
              styles.imageContainer,
              { transform: [{ translateY: imageTranslate }, { scale: imageScale }] },
            ]}
          >
            {recipe.imageUrl ? (
              <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, styles.imagePlaceholder]}>
                <Text style={styles.imagePlaceholderText}>🍽️</Text>
              </View>
            )}
          </Animated.View>

          {/* Overlay back + fav buttons */}
          <SafeAreaView edges={['top']} style={styles.imageOverlay} pointerEvents="box-none">
            <View style={styles.imageTopBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.overlayBtn}>
                <Text style={styles.overlayBtnText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFavorite} style={styles.overlayBtn}>
                <Text style={[styles.overlayBtnText, isFavorite && styles.favActiveText]}>
                  {isFavorite ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Title + meta */}
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              {recipe.cuisine !== 'Unknown' && (
                <Text style={styles.recipeCuisine}>
                  {recipe.cuisineFlag ?? ''} {recipe.cuisine}
                </Text>
              )}
            </View>
            {recipe.nutriscore && (
              <NutriScoreBadge score={recipe.nutriscore} size="lg" />
            )}
          </View>

          {/* Quick stats strip */}
          <View style={styles.statsStrip}>
            <StatChip icon="⏱" label={`${totalTime} min`} sub="Tiempo total" />
            <View style={styles.statDivider} />
            <StatChip icon="👥" label={`${servings}`} sub="Raciones" />
            <View style={styles.statDivider} />
            <StatChip icon="🔥" label={`${scaledNutrition(recipe.nutritionalInfo.calories)}`} sub="kcal" />
            {recipe.tags.length > 0 && (
              <>
                <View style={styles.statDivider} />
                <StatChip icon="🏷️" label={recipe.tags[0]} sub="Etiqueta" />
              </>
            )}
          </View>

          {/* Serving size selector */}
          <View style={styles.servingSelector}>
            <Text style={styles.sectionLabel}>Tamaño de ración</Text>
            <View style={styles.servingControl}>
              <TouchableOpacity
                style={styles.servingBtn}
                onPress={() => setServings((s) => Math.max(1, s - 1))}
              >
                <Text style={styles.servingBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.servingCount}>{servings}</Text>
              <TouchableOpacity
                style={styles.servingBtn}
                onPress={() => setServings((s) => s + 1)}
              >
                <Text style={styles.servingBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Macro Bar */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Info nutricional (por ración)</Text>
            <MacroBar nutritionalInfo={recipe.nutritionalInfo} height={10} showLabels />
            <View style={styles.nutritionGrid}>
              <NutritionCell label="Calorías" value={`${scaledNutrition(recipe.nutritionalInfo.calories)}`} unit="kcal" color={Colors.goldenAmber} />
              <NutritionCell label="Proteínas" value={`${scaledNutrition(recipe.nutritionalInfo.protein)}`} unit="g" color={Colors.healthGreen} />
              <NutritionCell label="Carbohid." value={`${scaledNutrition(recipe.nutritionalInfo.carbs)}`} unit="g" color={Colors.goldenAmber} />
              <NutritionCell label="Grasas" value={`${scaledNutrition(recipe.nutritionalInfo.fat)}`} unit="g" color="#FF8C42" />
            </View>
            {(recipe.nutritionalInfo.fiber !== undefined || recipe.nutritionalInfo.sodium !== undefined) && (
              <View style={styles.extraNutrition}>
                {recipe.nutritionalInfo.fiber !== undefined && (
                  <View style={styles.extraNutritionItem}>
                    <Text style={styles.extraNutritionLabel}>Fibra</Text>
                    <Text style={styles.extraNutritionValue}>{scaledNutrition(recipe.nutritionalInfo.fiber)}g</Text>
                  </View>
                )}
                {recipe.nutritionalInfo.sodium !== undefined && (
                  <View style={styles.extraNutritionItem}>
                    <Text style={styles.extraNutritionLabel}>Sodio</Text>
                    <Text style={styles.extraNutritionValue}>{scaledNutrition(recipe.nutritionalInfo.sodium)}mg</Text>
                  </View>
                )}
                {recipe.nutritionalInfo.sugar !== undefined && (
                  <View style={styles.extraNutritionItem}>
                    <Text style={styles.extraNutritionLabel}>Azúcar</Text>
                    <Text style={styles.extraNutritionValue}>{scaledNutrition(recipe.nutritionalInfo.sugar)}g</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Family Compatibility */}
          {profiles.length > 0 && recipe.familyCompatibility && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Compatibilidad familiar</Text>
              <FamilyCompatibilityRow
                compatibility={recipe.familyCompatibility}
                members={profiles}
                compact={false}
              />
            </View>
          )}

          {/* Allergen Badges */}
          {recipe.allergens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Contiene alérgenos</Text>
              <View style={styles.allergenRow}>
                {recipe.allergens.map((a) => (
                  <View key={a} style={styles.allergenBadge}>
                    <Text style={styles.allergenText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>
                Ingredientes ({recipe.ingredients.length})
              </Text>
              <Text style={styles.pantryStatus}>
                {pantryCount}/{recipe.ingredients.length} en despensa
              </Text>
            </View>

            {recipe.ingredients.map((ingredient) => {
              const inPantry = ingredientInPantry(ingredient)
              const inCart = addedToCart.has(ingredient.name)
              return (
                <View key={ingredient.name} style={styles.ingredientRow}>
                  <View style={[styles.ingredientDot, inPantry && styles.ingredientDotPantry, ingredient.isAllergen && styles.ingredientDotAllergen]} />
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientQty}>
                      {scaledIngredientQty(ingredient.quantity)} {ingredient.unit}
                    </Text>
                  </View>
                  <View style={styles.ingredientBadges}>
                    {inPantry && (
                      <View style={styles.pantryBadge}>
                        <Text style={styles.pantryBadgeText}>✓ Despensa</Text>
                      </View>
                    )}
                    {ingredient.isAllergen && (
                      <View style={styles.allergenSmallBadge}>
                        <Text style={styles.allergenSmallText}>⚠</Text>
                      </View>
                    )}
                    {!inPantry && !inCart && (
                      <TouchableOpacity
                        style={styles.addCartBtn}
                        onPress={() => handleAddIngredientToCart(ingredient)}
                      >
                        <Text style={styles.addCartBtnText}>+ Compra</Text>
                      </TouchableOpacity>
                    )}
                    {inCart && (
                      <View style={styles.inCartBadge}>
                        <Text style={styles.inCartText}>🛒</Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}

            {missingCount > 0 && (
              <TouchableOpacity style={styles.addAllMissingBtn} onPress={handleAddAllMissingToCart}>
                <Text style={styles.addAllMissingText}>
                  + Añadir {missingCount} ingrediente{missingCount > 1 ? 's' : ''} que falta{missingCount > 1 ? 'n' : ''} a la compra
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          {recipe.instructions.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => setInstructionsExpanded((prev) => !prev)}
              >
                <Text style={styles.sectionLabel}>Instrucciones ({recipe.instructions.length} pasos)</Text>
                <Text style={styles.expandToggle}>{instructionsExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {instructionsExpanded &&
                recipe.instructions.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}

              {!instructionsExpanded && (
                <Text style={styles.instructionsPreview} numberOfLines={2}>
                  {recipe.instructions[0]}
                </Text>
              )}
            </View>
          )}

          {/* Bottom spacer for action bar */}
          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Sticky Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleAddToPlan}>
          <Text style={styles.actionBtnSecondaryText}>📅 Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleAddAllMissingToCart}>
          <Text style={styles.actionBtnSecondaryText}>🛒 Compra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleCookNow}>
          <Text style={styles.actionBtnPrimaryText}>👨‍🍳 Cocinar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function StatChip({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  )
}

function NutritionCell({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={[styles.nutritionCell, { borderTopColor: color }]}>
      <Text style={styles.nutritionValue}>{value}</Text>
      <Text style={styles.nutritionUnit}>{unit}</Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  errorText: { ...Typography.heading2, color: Colors.warmCharcoal, marginBottom: Spacing.md },
  backBtnFallback: { padding: Spacing.sm },
  backBtnFallbackText: { ...Typography.bodyLarge, color: Colors.healthGreen },

  // Sticky header
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: Colors.cream, borderBottomWidth: 1, borderBottomColor: Colors.light.border,
    ...Shadows.subtle,
  },
  stickyHeaderInner: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    height: HEADER_HEIGHT, gap: Spacing.sm,
  },
  stickyBackBtn: { padding: Spacing.sm },
  stickyBackText: { fontSize: 22, color: Colors.warmCharcoal },
  stickyTitle: { flex: 1, ...Typography.heading3, color: Colors.warmCharcoal },
  stickyFavBtn: { padding: Spacing.sm },
  stickyFavText: { fontSize: 22, color: Colors.healthGreen },

  // Parallax image
  imageWrapper: { height: PARALLAX_HEIGHT, overflow: 'hidden' },
  imageContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: PARALLAX_HEIGHT + 40 },
  heroImage: { width: '100%', height: PARALLAX_HEIGHT + 40, resizeMode: 'cover' },
  imagePlaceholder: { backgroundColor: Colors.softMint, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 80 },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  imageTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
  },
  overlayBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayBtnText: { color: Colors.white, fontSize: 18 },
  favActiveText: { color: '#FF6B6B' },

  // Content Card
  contentCard: {
    backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -24, paddingHorizontal: Spacing.md, paddingTop: Spacing.lg,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  titleBlock: { flex: 1 },
  recipeName: { ...Typography.heading1, color: Colors.warmCharcoal, flexWrap: 'wrap' },
  recipeCuisine: { ...Typography.body, color: Colors.light.textSecondary, marginTop: 2 },

  // Stats
  statsStrip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.sm, marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  statChip: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.light.border },
  statIcon: { fontSize: 18 },
  statLabel: { ...Typography.heading3, color: Colors.warmCharcoal, fontSize: 14 },
  statSub: { ...Typography.caption, color: Colors.light.textSecondary },

  // Serving selector
  servingSelector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  servingControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  servingBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.healthGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  servingBtnText: { color: Colors.white, fontSize: 18, lineHeight: 20 },
  servingCount: { ...Typography.heading2, color: Colors.warmCharcoal, minWidth: 28, textAlign: 'center' },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.heading3, color: Colors.warmCharcoal, marginBottom: Spacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pantryStatus: { ...Typography.caption, color: Colors.healthGreen },
  expandToggle: { ...Typography.body, color: Colors.light.textSecondary },

  // Nutrition grid
  nutritionGrid: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  nutritionCell: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', borderTopWidth: 3, ...Shadows.subtle,
  },
  nutritionValue: { ...Typography.heading2, color: Colors.warmCharcoal, fontSize: 18 },
  nutritionUnit: { ...Typography.caption, color: Colors.light.textSecondary, fontSize: 10 },
  nutritionLabel: { ...Typography.caption, color: Colors.light.textSecondary, marginTop: 2 },

  extraNutrition: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm,
    backgroundColor: Colors.softMint, borderRadius: BorderRadius.md, padding: Spacing.sm,
  },
  extraNutritionItem: { flex: 1, alignItems: 'center' },
  extraNutritionLabel: { ...Typography.caption, color: Colors.light.textSecondary },
  extraNutritionValue: { ...Typography.bodyLarge, color: Colors.warmCharcoal, fontFamily: Typography.heading3.fontFamily },

  // Allergens
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  allergenBadge: {
    backgroundColor: `${Colors.errorRed}15`, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: `${Colors.errorRed}40`,
  },
  allergenText: { ...Typography.caption, color: Colors.errorRed },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.xs, ...Shadows.subtle,
  },
  ingredientDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.border,
  },
  ingredientDotPantry: { backgroundColor: Colors.healthGreen },
  ingredientDotAllergen: { backgroundColor: Colors.errorRed },
  ingredientInfo: { flex: 1 },
  ingredientName: { ...Typography.bodyLarge, color: Colors.warmCharcoal },
  ingredientQty: { ...Typography.caption, color: Colors.light.textSecondary },
  ingredientBadges: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  pantryBadge: {
    backgroundColor: `${Colors.healthGreen}20`, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.xs, paddingVertical: 2,
  },
  pantryBadgeText: { ...Typography.overline, color: Colors.healthGreen, fontSize: 9 },
  allergenSmallBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: `${Colors.errorRed}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  allergenSmallText: { fontSize: 12, color: Colors.errorRed },
  addCartBtn: {
    backgroundColor: Colors.softMint, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.xs, paddingVertical: 3,
  },
  addCartBtnText: { ...Typography.overline, color: Colors.healthGreen, fontSize: 9 },
  inCartBadge: { padding: 2 },
  inCartText: { fontSize: 14 },
  addAllMissingBtn: {
    backgroundColor: Colors.healthGreen, borderRadius: BorderRadius.pill,
    padding: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm,
  },
  addAllMissingText: { ...Typography.body, color: Colors.white, fontFamily: Typography.heading3.fontFamily },

  // Instructions
  instructionsPreview: { ...Typography.body, color: Colors.light.textSecondary, fontStyle: 'italic' },
  stepRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.healthGreen,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  stepNumberText: { ...Typography.caption, color: Colors.white, fontFamily: Typography.heading3.fontFamily },
  stepText: { ...Typography.body, color: Colors.warmCharcoal, flex: 1, lineHeight: 22 },

  // Action bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.cream, borderTopWidth: 1, borderTopColor: Colors.light.border,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, paddingTop: Spacing.sm,
    flexDirection: 'row', gap: Spacing.sm, ...Shadows.elevated,
  },
  actionBtnSecondary: {
    flex: 1, backgroundColor: Colors.softMint, borderRadius: BorderRadius.pill,
    padding: Spacing.sm, alignItems: 'center',
  },
  actionBtnSecondaryText: { ...Typography.body, color: Colors.warmCharcoal, fontFamily: Typography.heading3.fontFamily },
  actionBtnPrimary: {
    flex: 2, backgroundColor: Colors.healthGreen, borderRadius: BorderRadius.pill,
    padding: Spacing.sm, alignItems: 'center',
  },
  actionBtnPrimaryText: { ...Typography.bodyLarge, color: Colors.white, fontFamily: Typography.heading3.fontFamily },
})
