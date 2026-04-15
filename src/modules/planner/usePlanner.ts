import { useCallback, useEffect, useState } from 'react'
import { MealPlan, DayMeals } from '../../types/planner'
import { Recipe } from '../../types/recipes'
import {
  upsertMealPlan,
  getMealPlansForRange,
  toggleLockPlan,
  saveSchoolMenuEntry,
  getSchoolMenuEntries,
} from './plannerDB'
import { complete } from '../../services/claude'
import { analyzePDF } from '../../services/claude'
import { buildMealPlanGenerationPrompt } from '../../services/prompts/cloud'
import { SCHOOL_MENU_EXTRACTION_PROMPT } from '../../services/prompts/schoolMenuExtraction'
import { useProfiles } from '../profiles/ProfilesContext'
import { getRandomRecipes } from '../recipes/recipeDB'
import { buildCloudSystemPrompt } from '../../services/prompts/cloud'

function getWeekDates(startDate?: string): string[] {
  const start = startDate ? new Date(startDate) : new Date()
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export function usePlanner() {
  const { profiles } = useProfiles()
  const [weekPlans, setWeekPlans] = useState<MealPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const loadWeek = useCallback(async (startDate?: string) => {
    setIsLoading(true)
    const dates = getWeekDates(startDate)
    const plans = await getMealPlansForRange(dates[0], dates[6])
    setWeekPlans(plans)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadWeek()
  }, [loadWeek])

  const generateWeekPlan = useCallback(
    async (
      inventory: { name: string; quantity: number; unit: string; category: string }[],
      startDate?: string
    ) => {
      setIsGenerating(true)
      try {
        const dates = getWeekDates(startDate)
        const systemPrompt = buildCloudSystemPrompt(profiles, inventory as never)
        const userPrompt = buildMealPlanGenerationPrompt(profiles, inventory as never, undefined, startDate)

        const response = await complete(
          [{ id: 'req', role: 'user', content: userPrompt, timestamp: new Date().toISOString() }],
          systemPrompt
        )

        // Extract and parse JSON — attempt repair if truncated
        const jsonStart = response.indexOf('[')
        if (jsonStart === -1) throw new Error('No JSON array in response')
        let jsonStr = response.slice(jsonStart)
        // Trim trailing prose after the closing bracket
        const jsonEnd = jsonStr.lastIndexOf(']')
        if (jsonEnd !== -1) jsonStr = jsonStr.slice(0, jsonEnd + 1)

        let dayPlans: Array<{
          date: string
          breakfast: { name: string; calories: number; protein: number; carbs: number; fat: number }
          lunch: { name: string; calories: number; protein: number; carbs: number; fat: number }
          dinner: { name: string; calories: number; protein: number; carbs: number; fat: number }
        }>
        try {
          dayPlans = JSON.parse(jsonStr)
        } catch {
          // Last-ditch: extract however many complete objects we can
          const partial = jsonStr.replace(/,?\s*\{[^{}]*$/, '') + ']'
          dayPlans = JSON.parse(partial.startsWith('[') ? partial : '[' + partial)
        }

        const now = new Date().toISOString()
        const newPlans: MealPlan[] = []

        for (const dayPlan of dayPlans) {
          // Check if this day is already locked
          const existing = weekPlans.find((p) => p.date === dayPlan.date)
          if (existing?.isLocked) {
            newPlans.push(existing)
            continue
          }

          // Build mock recipe objects from AI-generated data
          const makeAiRecipe = (
            meal: { name: string; description?: string; calories: number; protein: number; carbs: number; fat: number },
            category: Recipe['category']
          ): Recipe => ({
            id: `ai-${Date.now()}-${Math.random()}`,
            name: meal.name,
            category,
            cuisine: 'Mediterranean',
            instructions: [],
            ingredients: [],
            prepTime: 20,
            cookTime: 30,
            servings: 4,
            sourceApi: 'ai_generated',
            nutritionalInfo: {
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
            },
            allergens: [],
            tags: [],
            createdAt: now,
            updatedAt: now,
          })

          const plan: MealPlan = {
            id: `plan-${dayPlan.date}`,
            date: dayPlan.date,
            meals: {
              breakfast: makeAiRecipe(dayPlan.breakfast, 'breakfast'),
              lunch: makeAiRecipe(dayPlan.lunch, 'lunch'),
              dinner: makeAiRecipe(dayPlan.dinner, 'dinner'),
            },
            memberTargets: {},
            isLocked: false,
            generatedAt: now,
            updatedAt: now,
          }

          await upsertMealPlan(plan)
          newPlans.push(plan)
        }

        setWeekPlans(newPlans)
      } catch (error) {
        console.error('[Planner] Generation failed:', error)
        // Fallback: populate with random recipes from DB
        await generateFallbackPlan(startDate)
      } finally {
        setIsGenerating(false)
      }
    },
    [profiles, weekPlans]
  )

  const generateFallbackPlan = useCallback(async (startDate?: string) => {
    const dates = getWeekDates(startDate)
    const now = new Date().toISOString()
    const newPlans: MealPlan[] = []

    for (const date of dates) {
      const existing = weekPlans.find((p) => p.date === date)
      if (existing?.isLocked) {
        newPlans.push(existing)
        continue
      }

      const [breakfastRecs, lunchRecs, dinnerRecs] = await Promise.all([
        getRandomRecipes(1, 'breakfast'),
        getRandomRecipes(1, 'lunch'),
        getRandomRecipes(1, 'dinner'),
      ])

      const plan: MealPlan = {
        id: `plan-${date}`,
        date,
        meals: {
          breakfast: breakfastRecs[0],
          lunch: lunchRecs[0],
          dinner: dinnerRecs[0],
        },
        memberTargets: {},
        isLocked: false,
        generatedAt: now,
        updatedAt: now,
      }
      await upsertMealPlan(plan)
      newPlans.push(plan)
    }
    setWeekPlans(newPlans)
  }, [weekPlans])

  const lockDay = useCallback(async (date: string) => {
    await toggleLockPlan(date)
    await loadWeek()
  }, [loadWeek])

  const uploadSchoolMenu = useCallback(
    async (pdfBase64: string, childId: string): Promise<void> => {
      const response = await analyzePDF(pdfBase64, SCHOOL_MENU_EXTRACTION_PROMPT)

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Could not extract school menu data')

      const entries: Array<{
        date: string; description: string; extractedIngredients: string[];
        extractedAllergens: string[]; nutritionalEstimate?: { calories: number; protein: number; carbs: number; fat: number }
      }> = JSON.parse(jsonMatch[0])

      for (const entry of entries) {
        await saveSchoolMenuEntry({
          id: `school-${entry.date}-${childId}`,
          date: entry.date,
          childId,
          description: entry.description,
          extractedIngredients: entry.extractedIngredients,
          extractedAllergens: entry.extractedAllergens,
          nutritionalEstimate: entry.nutritionalEstimate,
        })
      }
    },
    []
  )

  return {
    weekPlans,
    isLoading,
    isGenerating,
    loadWeek,
    generateWeekPlan,
    lockDay,
    uploadSchoolMenu,
    getSchoolMenuEntries,
  }
}
