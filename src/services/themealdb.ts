import { Recipe, RecipeIngredient, RecipeCategory } from '../types/recipes'
import { NutritionalInfo } from '../types/nutrition'

const API_KEY = process.env.EXPO_PUBLIC_THEMEALDB_API_KEY ?? '1'
const BASE_URL = `https://www.themealdb.com/api/json/v2/${API_KEY}`

interface MealDBMeal {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strIngredient1?: string; strMeasure1?: string
  strIngredient2?: string; strMeasure2?: string
  strIngredient3?: string; strMeasure3?: string
  strIngredient4?: string; strMeasure4?: string
  strIngredient5?: string; strMeasure5?: string
  strIngredient6?: string; strMeasure6?: string
  strIngredient7?: string; strMeasure7?: string
  strIngredient8?: string; strMeasure8?: string
  strIngredient9?: string; strMeasure9?: string
  strIngredient10?: string; strMeasure10?: string
  strIngredient11?: string; strMeasure11?: string
  strIngredient12?: string; strMeasure12?: string
  strIngredient13?: string; strMeasure13?: string
  strIngredient14?: string; strMeasure14?: string
  strIngredient15?: string; strMeasure15?: string
  strIngredient16?: string; strMeasure16?: string
  strIngredient17?: string; strMeasure17?: string
  strIngredient18?: string; strMeasure18?: string
  strIngredient19?: string; strMeasure19?: string
  strIngredient20?: string; strMeasure20?: string
  strTags?: string
  [key: string]: unknown
}

function inferCategory(strCategory: string | undefined | null): RecipeCategory {
  if (!strCategory) return 'dinner'
  const cat = strCategory.toLowerCase()
  if (cat.includes('breakfast') || cat.includes('starter')) return 'breakfast'
  if (cat.includes('dessert') || cat.includes('pastry')) return 'dessert'
  if (cat.includes('side') || cat.includes('miscellaneous')) return 'lunch'
  return 'dinner'
}

function parseIngredients(meal: MealDBMeal): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = []
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] as string | undefined)?.trim()
    const measure = (meal[`strMeasure${i}`] as string | undefined)?.trim()
    if (!name) continue

    // Parse quantity and unit from measure string (e.g., "2 cups", "1 tsp")
    const match = measure?.match(/^([\d./]+)\s*(.*)$/)
    let quantity = 1
    let unit = measure ?? 'to taste'
    if (match) {
      quantity = parseFloat(match[1]) || 1
      unit = match[2].trim() || 'units'
    }

    ingredients.push({
      name,
      quantity,
      unit,
      isAllergen: false, // enriched later by allergenEngine
    })
  }
  return ingredients
}

function parseInstructions(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 10)
}

const CUISINE_FLAGS: Record<string, string> = {
  Spanish: '🇪🇸', French: '🇫🇷', Greek: '🇬🇷', Italian: '🇮🇹',
  Japanese: '🇯🇵', Chinese: '🇨🇳', Indian: '🇮🇳', Thai: '🇹🇭',
  Peruvian: '🇵🇪', Colombian: '🇨🇴', Mexican: '🇲🇽', Argentinian: '🇦🇷',
  British: '🇬🇧', American: '🇺🇸', Canadian: '🇨🇦', Turkish: '🇹🇷',
  Moroccan: '🇲🇦', Egyptian: '🇪🇬', Filipino: '🇵🇭', Vietnamese: '🇻🇳',
  Jamaican: '🇯🇲', Kenyan: '🇰🇪', Polish: '🇵🇱', Russian: '🇷🇺',
  Dutch: '🇳🇱', Portuguese: '🇵🇹', Croatian: '🇭🇷', Malaysian: '🇲🇾',
}

export function mapMealToRecipe(meal: MealDBMeal): Recipe {
  const now = new Date().toISOString()
  const ingredients = parseIngredients(meal)
  const instructions = parseInstructions(meal.strInstructions)
  const tags = meal.strTags ? meal.strTags.split(',').map((t) => t.trim()).filter(Boolean) : []

  const emptyNutrition: NutritionalInfo = {
    calories: 0, protein: 0, carbs: 0, fat: 0,
  }

  return {
    id: `mdb-${meal.idMeal}`,
    name: meal.strMeal,
    category: inferCategory(meal.strCategory),
    cuisine: meal.strArea || 'International',
    cuisineFlag: CUISINE_FLAGS[meal.strArea] ?? '🌍',
    instructions,
    ingredients,
    prepTime: 15,   // TheMealDB doesn't provide; default estimate
    cookTime: 30,
    servings: 4,
    imageUrl: meal.strMealThumb,
    sourceApi: 'themealdb',
    sourceId: meal.idMeal,
    nutritionalInfo: emptyNutrition,
    allergens: [],
    tags,
    createdAt: now,
    updatedAt: now,
  }
}

async function fetchJSON<T>(url: string): Promise<T> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`TheMealDB ${resp.status}: ${url}`)
  return resp.json() as Promise<T>
}

export async function fetchAllCategories(): Promise<string[]> {
  const data = await fetchJSON<{ categories: Array<{ strCategory: string }> }>(
    `${BASE_URL}/categories.php`
  )
  return data.categories.map((c) => c.strCategory)
}

export async function fetchAllAreas(): Promise<string[]> {
  const data = await fetchJSON<{ meals: Array<{ strArea: string }> }>(
    `${BASE_URL}/list.php?a=list`
  )
  return data.meals.map((m) => m.strArea)
}

export async function fetchByCategory(category: string): Promise<Recipe[]> {
  const data = await fetchJSON<{ meals: MealDBMeal[] | null }>(
    `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`
  )
  if (!data.meals) return []
  return data.meals.map(mapMealToRecipe)
}

export async function fetchByArea(area: string): Promise<Recipe[]> {
  const data = await fetchJSON<{ meals: MealDBMeal[] | null }>(
    `${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`
  )
  if (!data.meals) return []
  return data.meals.map(mapMealToRecipe)
}

export async function fetchById(id: string): Promise<Recipe | null> {
  const mealId = id.startsWith('mdb-') ? id.slice(4) : id
  const data = await fetchJSON<{ meals: MealDBMeal[] | null }>(
    `${BASE_URL}/lookup.php?i=${mealId}`
  )
  if (!data.meals?.[0]) return null
  return mapMealToRecipe(data.meals[0])
}

export async function fetchFullById(sourceId: string): Promise<Recipe | null> {
  const data = await fetchJSON<{ meals: MealDBMeal[] | null }>(
    `${BASE_URL}/lookup.php?i=${sourceId}`
  )
  if (!data.meals?.[0]) return null
  return mapMealToRecipe(data.meals[0])
}

export async function searchByName(query: string): Promise<Recipe[]> {
  const data = await fetchJSON<{ meals: MealDBMeal[] | null }>(
    `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`
  )
  if (!data.meals) return []
  return data.meals.map(mapMealToRecipe)
}

export async function fetchLatest(): Promise<Recipe[]> {
  const data = await fetchJSON<{ meals: MealDBMeal[] | null }>(
    `${BASE_URL}/latest.php`
  )
  if (!data.meals) return []
  return data.meals.map(mapMealToRecipe)
}

export async function fetchRandom(): Promise<Recipe | null> {
  const data = await fetchJSON<{ meals: MealDBMeal[] | null }>(
    `${BASE_URL}/random.php`
  )
  if (!data.meals?.[0]) return null
  return mapMealToRecipe(data.meals[0])
}
