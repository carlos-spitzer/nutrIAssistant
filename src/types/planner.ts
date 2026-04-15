import { Recipe } from './recipes'
import { NutritionalTarget } from './nutrition'
import { SchoolMenuEntry } from './profiles'

export type MealType = 'breakfast' | 'lunch' | 'dinner'

export interface DayMeals {
  breakfast?: Recipe
  lunch?: Recipe
  dinner?: Recipe
}

export interface MealPlan {
  id: string
  date: string          // ISO date YYYY-MM-DD
  meals: DayMeals
  memberTargets: Record<string, NutritionalTarget>
  schoolMenuContext?: SchoolMenuEntry[]
  isLocked: boolean
  generatedAt: string
  updatedAt: string
}
