import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  fetchAllCategories,
  fetchByCategory,
  fetchById,
  searchByName,
} from '../../services/themealdb'
import { computeNutriScore } from '../../services/nutriscore'
import { detectAllergensInIngredients } from '../profiles/allergenEngine'
import { batchUpsertRecipes, getRecipeCount, updateRecipeImageUrl, getSeedRecipesWithoutImage } from './recipeDB'
import { getInfoodsData } from '../../seed/infoods-europe'
import { Recipe, RecipeIngredient } from '../../types/recipes'
import { NutritionalInfo } from '../../types/nutrition'

// Bump this string whenever the sync logic changes to force a re-download.
const SYNC_VERSION = '3'

const KEY_RECIPES_SYNCED = 'recipes_synced'
const KEY_SYNC_VERSION = 'recipes_sync_version'
const KEY_RECIPES_SYNC_DATE = 'recipes_sync_date'

// How many recipes to fetch per TheMealDB category.
// 14 categories × 18 = 252 MealDB recipes + ~50 seed recipes = 300+ total.
const PER_CATEGORY = 18
// Minimum count to consider the DB "ready". Seed alone gives ~50, so anything
// below this means a full sync hasn't completed yet.
const MIN_SYNCED_COUNT = 100

export type SyncProgressCallback = (progress: number, message: string) => void

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Nutrition helpers ────────────────────────────────────────────────────────

function aggregateNutrition(
  ingredients: RecipeIngredient[],
  servings: number
): NutritionalInfo {
  const total: NutritionalInfo = { calories: 0, protein: 0, carbs: 0, fat: 0 }

  for (const ing of ingredients) {
    const n = ing.nutritionalInfo
    if (!n) continue
    const scale = (ing.quantity * 10) / Math.max(servings, 1)
    total.calories += (n.calories * scale) / 100
    total.protein += (n.protein * scale) / 100
    total.carbs += (n.carbs * scale) / 100
    total.fat += (n.fat * scale) / 100
    if (n.fiber) total.fiber = (total.fiber ?? 0) + (n.fiber * scale) / 100
    if (n.sodium) total.sodium = (total.sodium ?? 0) + (n.sodium * scale) / 100
    if (n.calcium) total.calcium = (total.calcium ?? 0) + (n.calcium * scale) / 100
    if (n.iron) total.iron = (total.iron ?? 0) + (n.iron * scale) / 100
  }

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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function isSynced(): Promise<boolean> {
  const version = await AsyncStorage.getItem(KEY_SYNC_VERSION)
  if (version !== SYNC_VERSION) return false
  const synced = await AsyncStorage.getItem(KEY_RECIPES_SYNCED)
  if (synced !== 'true') return false
  const count = await getRecipeCount()
  return count >= MIN_SYNCED_COUNT
}

export async function markSynced(): Promise<void> {
  await AsyncStorage.setItem(KEY_RECIPES_SYNCED, 'true')
  await AsyncStorage.setItem(KEY_SYNC_VERSION, SYNC_VERSION)
  await AsyncStorage.setItem(KEY_RECIPES_SYNC_DATE, new Date().toISOString())
}

/**
 * Downloads recipes from TheMealDB for every category, enriches them with
 * INFOODS-based nutrition (local lookup, no external API), detects allergens,
 * and stores them in the local SQLite DB.
 *
 * Target: ≥ 240 verified recipes (14 categories × 18 per category = 252).
 * No USDA API calls — only INFOODS local data — so the sync completes quickly
 * even on a slow connection.
 */
export async function syncRecipes(
  onProgress?: SyncProgressCallback
): Promise<void> {
  onProgress?.(0, 'Obteniendo categorías de TheMealDB...')

  const categories = await fetchAllCategories()
  const total = categories.length
  let totalSynced = 0

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    onProgress?.(
      i / total,
      `Descargando ${category}... (${totalSynced} recetas)`
    )

    let basicList: Recipe[]
    try {
      basicList = await fetchByCategory(category)
    } catch {
      // If a category fetch fails, skip it and continue
      continue
    }

    const toFetch = basicList.slice(0, PER_CATEGORY)
    const batch: Recipe[] = []

    for (const basic of toFetch) {
      const sourceId = basic.sourceId ?? basic.id
      try {
        const full = await fetchById(sourceId)
        if (!full) continue

        // Enrich ingredients using INFOODS (local lookup — no API calls)
        const enrichedIngredients: RecipeIngredient[] = full.ingredients.map(
          (ing) => ({
            ...ing,
            nutritionalInfo: getInfoodsData(ing.name) ?? undefined,
            isAllergen: false, // will be set below after allergen detection
          })
        )

        // Detect allergens from ingredient names
        const ingredientNames = enrichedIngredients.map((i) => i.name)
        const allergens = detectAllergensInIngredients(ingredientNames)

        // Mark each ingredient as allergen if any allergen matches its name
        const markedIngredients = enrichedIngredients.map((ing) => ({
          ...ing,
          isAllergen: allergens.some((a) =>
            ing.name.toLowerCase().includes(a.toLowerCase())
          ),
        }))

        // Aggregate nutrition per serving (only where INFOODS data exists)
        const hasNutrition = markedIngredients.some((i) => i.nutritionalInfo)
        const nutritionalInfo = hasNutrition
          ? aggregateNutrition(markedIngredients, full.servings)
          : full.nutritionalInfo

        const nutriscore = computeNutriScore(nutritionalInfo)

        batch.push({
          ...full,
          ingredients: markedIngredients,
          allergens,
          nutritionalInfo,
          nutriscore,
        })

        await sleep(80) // gentle rate limit between lookups
      } catch {
        // Skip individual recipe failures silently
      }
    }

    if (batch.length > 0) {
      await batchUpsertRecipes(batch)
      totalSynced += batch.length
    }

    await sleep(150) // brief pause between categories
    onProgress?.(
      (i + 1) / total,
      `${category} completado — ${totalSynced} recetas descargadas`
    )
  }

  await markSynced()
  onProgress?.(1, `¡${totalSynced} recetas descargadas de TheMealDB!`)
}

/**
 * For each seed (user_created) recipe without an image, tries to find a
 * matching TheMealDB photo and stores it.  Runs silently in the background —
 * failures are ignored and the recipe simply stays without a photo.
 */
export async function enrichSeedRecipeImages(): Promise<void> {
  let recipes
  try {
    recipes = await getSeedRecipesWithoutImage()
  } catch {
    return
  }
  if (recipes.length === 0) return

  for (const recipe of recipes) {
    try {
      // First: try the full name
      let results = await searchByName(recipe.name)

      // Second: try the first keyword with more than 3 characters
      if (results.length === 0) {
        const keyword = recipe.name.split(/\s+/).find((w) => w.length > 3)
        if (keyword) results = await searchByName(keyword)
      }

      if (results.length === 0) continue

      // Pick the best match — prefer an exact (case-insensitive) name match,
      // otherwise take the first result
      const exact = results.find(
        (r) => r.name.toLowerCase() === recipe.name.toLowerCase()
      )
      const match = exact ?? results[0]
      if (!match.imageUrl) continue

      await updateRecipeImageUrl(recipe.id, match.imageUrl)
      await sleep(200) // gentle rate limit
    } catch {
      // Skip silently — a missing image is fine; a wrong one is not
    }
  }
}
