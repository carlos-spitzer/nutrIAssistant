import { NutritionalInfo } from '../types/nutrition'

const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY ?? ''
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

// USDA nutrient IDs
const NUTRIENT_MAP: Record<number, keyof NutritionalInfo> = {
  1008: 'calories',
  1003: 'protein',
  1005: 'carbs',
  1004: 'fat',
  1079: 'fiber',
  2000: 'sugar',
  1093: 'sodium',
  1087: 'calcium',
  1089: 'iron',
  1106: 'vitaminA',
  1162: 'vitaminC',
  1114: 'vitaminD',
  1092: 'potassium',
  1258: 'saturatedFat',
}

interface USDANutrient {
  nutrientId: number
  value: number
  unitName: string
}

interface USDAFood {
  fdcId: number
  description: string
  foodNutrients: USDANutrient[]
}

interface USDASearchResult {
  foods: USDAFood[]
}

export function mapUSDAToNutritionalInfo(food: USDAFood): NutritionalInfo {
  const info: Partial<NutritionalInfo> = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  }

  for (const nutrient of food.foodNutrients) {
    const key = NUTRIENT_MAP[nutrient.nutrientId]
    if (key) {
      ;(info as Record<string, number>)[key] = nutrient.value
    }
  }

  return info as NutritionalInfo
}

export async function searchFood(name: string): Promise<Array<{ fdcId: string; name: string }>> {
  const url = `${BASE_URL}/foods/search?query=${encodeURIComponent(name)}&api_key=${API_KEY}&pageSize=5`
  const resp = await fetch(url)
  if (!resp.ok) return []
  const data: USDASearchResult = await resp.json()
  return (data.foods ?? []).map((f) => ({ fdcId: String(f.fdcId), name: f.description }))
}

export async function getFoodDetails(fdcId: string): Promise<NutritionalInfo | null> {
  const url = `${BASE_URL}/food/${fdcId}?api_key=${API_KEY}`
  const resp = await fetch(url)
  if (!resp.ok) return null
  const food: USDAFood = await resp.json()
  return mapUSDAToNutritionalInfo(food)
}

// Cached lookup: tries INFOODS first, then USDA, then AI estimation
export async function lookupNutrition(
  ingredientName: string,
  fdcId?: string
): Promise<NutritionalInfo | null> {
  // If we have a known fdcId, go straight to USDA
  if (fdcId) return getFoodDetails(fdcId)

  // Search USDA
  const results = await searchFood(ingredientName)
  if (results.length > 0) {
    return getFoodDetails(results[0].fdcId)
  }

  return null
}
