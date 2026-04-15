import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  fetchAllCategories,
  fetchAllAreas,
  fetchByCategory,
  fetchById,
} from '../../services/themealdb'
import { lookupNutrition } from '../../services/usda'
import { computeNutriScore } from '../../services/nutriscore'
import { detectAllergensInIngredients } from '../profiles/allergenEngine'
import { batchUpsertRecipes, getRecipeCount } from './recipeDB'
import { getInfoodsData } from '../../seed/infoods-europe'
import { Recipe, RecipeIngredient } from '../../types/recipes'
import { NutritionalInfo } from '../../types/nutrition'

const KEY_RECIPES_SYNCED = 'recipes_synced'
const KEY_RECIPES_SYNC_DATE = 'recipes_sync_date'

export type SyncProgressCallback = (progress: number, message: string) => void

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function enrichIngredientNutrition(
  ingredient: RecipeIngredient
): Promise<NutritionalInfo | null> {
  // 1. INFOODS first (Mediterranean staples, no API call)
  const infoods = getInfoodsData(ingredient.name)
  if (infoods) return infoods

  // 2. USDA lookup (with rate limiting)
  try {
    const info = await lookupNutrition(ingredient.name)
    return info
  } catch {
    return null
  }
}

function aggregateNutrition(
  ingredients: RecipeIngredient[],
  servings: number
): NutritionalInfo {
  const total: NutritionalInfo = { calories: 0, protein: 0, carbs: 0, fat: 0 }

  for (const ing of ingredients) {
    const n = ing.nutritionalInfo
    if (!n) continue
    // Scale to recipe quantity / 100g base (simplified)
    const scale = (ing.quantity * 10) / servings
    total.calories += (n.calories * scale) / 100
    total.protein += (n.protein * scale) / 100
    total.carbs += (n.carbs * scale) / 100
    total.fat += (n.fat * scale) / 100
    if (n.fiber) total.fiber = (total.fiber ?? 0) + (n.fiber * scale) / 100
    if (n.sodium) total.sodium = (total.sodium ?? 0) + (n.sodium * scale) / 100
    if (n.calcium) total.calcium = (total.calcium ?? 0) + (n.calcium * scale) / 100
    if (n.iron) total.iron = (total.iron ?? 0) + (n.iron * scale) / 100
  }

  // Round values
  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
    fiber: total.fiber ? Math.round(total.fiber * 10) / 10 : undefined,
    sodium: total.sodium ? Math.round(total.sodium) : undefined,
    calcium: total.calcium ? Math.round(total.calcium) : undefined,
    iron: total.iron ? Math.round(total.iron * 10) / 10 : undefined,
  }
}

export async function isSynced(): Promise<boolean> {
  const synced = await AsyncStorage.getItem(KEY_RECIPES_SYNCED)
  if (synced !== 'true') return false
  const count = await getRecipeCount()
  return count > 0
}

export async function markSynced(): Promise<void> {
  await AsyncStorage.setItem(KEY_RECIPES_SYNCED, 'true')
  await AsyncStorage.setItem(KEY_RECIPES_SYNC_DATE, new Date().toISOString())
}

export async function syncRecipes(
  onProgress?: SyncProgressCallback
): Promise<void> {
  onProgress?.(0, 'Fetching recipe categories...')
  const categories = await fetchAllCategories()

  const total = categories.length
  let done = 0

  for (const category of categories) {
    onProgress?.(done / total, `Syncing ${category} recipes...`)

    const basicRecipes = await fetchByCategory(category)
    const enrichedRecipes: Recipe[] = []

    for (const recipe of basicRecipes.slice(0, 15)) {
      // Fetch full recipe with ingredients
      const full = await fetchById(recipe.sourceId ?? recipe.id)
      const base = full ?? recipe

      // Enrich ingredients with nutrition (INFOODS preferred, USDA fallback)
      const enrichedIngredients: RecipeIngredient[] = []
      for (const ing of base.ingredients) {
        const nutrition = await enrichIngredientNutrition(ing)
        enrichedIngredients.push({
          ...ing,
          nutritionalInfo: nutrition ?? undefined,
          isAllergen: false,
        })
        await sleep(50) // gentle rate limiting
      }

      // Detect allergens in ingredient names
      const ingredientNames = enrichedIngredients.map((i) => i.name)
      const detectedAllergens = detectAllergensInIngredients(ingredientNames)

      // Mark allergen ingredients
      const markedIngredients = enrichedIngredients.map((ing) => {
        const allergenType = Object.keys(
          {} // will be filled by allergenEngine
        ).find(() => false)
        return { ...ing, isAllergen: detectedAllergens.length > 0, allergenType }
      })

      // Aggregate nutritional info per serving
      const nutritionalInfo = aggregateNutrition(enrichedIngredients, base.servings)

      // Compute Nutri-Score
      const nutriscore = computeNutriScore(nutritionalInfo)

      enrichedRecipes.push({
        ...base,
        ingredients: enrichedIngredients,
        allergens: detectedAllergens,
        nutritionalInfo,
        nutriscore,
      })

      await sleep(100) // throttle USDA calls
    }

    await batchUpsertRecipes(enrichedRecipes)
    done++
    onProgress?.(done / total, `Synced ${category} (${enrichedRecipes.length} recipes)`)
    await sleep(200) // throttle TheMealDB calls between categories
  }

  await markSynced()
  onProgress?.(1, 'Recipe database ready!')
}
