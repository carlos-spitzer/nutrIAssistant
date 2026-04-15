import NetInfo from '@react-native-community/netinfo'
import { AIContext, AIRoute } from '../types/ai'

// Check if network is available
async function isOffline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch()
    return !state.isConnected
  } catch {
    return false
  }
}

function isSimpleNutritionalQuery(query: string): boolean {
  const patterns = [
    /how many calori/i,
    /nutrition(al)? (info|value|content)/i,
    /how (much|many) (protein|carb|fat|fiber|calori)/i,
    /is .+ (healthy|good for me)/i,
    /what are .+ (benefits|nutrients)/i,
    /macros (in|of)/i,
  ]
  return patterns.some((p) => p.test(query))
}

function isAllergenCheck(query: string): boolean {
  return (
    /allergen|allerg|intoleran/i.test(query) ||
    /safe for .+ (to eat|who)/i.test(query) ||
    /can .+ eat/i.test(query)
  )
}

function isFoodIdentification(query: string): boolean {
  return (
    /what is this (food|dish|product)/i.test(query) ||
    /identify this/i.test(query) ||
    /what (food|dish) is/i.test(query)
  )
}

function isQuickRecipeSuggestion(query: string): boolean {
  return (
    /quick recipe/i.test(query) ||
    /what can i (make|cook) (with|for)/i.test(query) ||
    /suggest (a )?recipe/i.test(query) ||
    /something (to cook|to eat) with/i.test(query)
  )
}

function isInventoryQuery(query: string): boolean {
  return (
    /low in stock|running out|what.*pantry|pantry.*what|expir/i.test(query) ||
    /add .+ to (shopping|grocery|cart|list)/i.test(query)
  )
}

function requiresMealPlanGeneration(query: string): boolean {
  return (
    /plan .*(week|month|day|meal)/i.test(query) ||
    /generate.*meal plan/i.test(query) ||
    /(weekly|monthly) menu/i.test(query) ||
    /plan.*next week/i.test(query)
  )
}

function requiresMultiProfileReconciliation(query: string): boolean {
  return (
    /for (the )?(whole |entire )?family/i.test(query) ||
    /everyone/i.test(query) ||
    /all (of them|family members)/i.test(query)
  )
}

export function routeQuery(query: string, context: AIContext): AIRoute {
  // Always on-device if offline
  if (context.isOffline) return 'on_device'

  // Always cloud if PDF or image required
  if (context.requiresPDF) return 'cloud'
  if (context.requiresImage) return 'cloud'

  // On-device for simple queries
  if (isSimpleNutritionalQuery(query)) return 'on_device'
  if (isAllergenCheck(query)) return 'on_device'
  if (isFoodIdentification(query)) return 'on_device'
  if (isQuickRecipeSuggestion(query)) return 'on_device'
  if (isInventoryQuery(query)) return 'on_device'

  // Cloud for complex tasks
  if (requiresMealPlanGeneration(query)) return 'cloud'
  if (requiresMultiProfileReconciliation(query)) return 'cloud'

  // Default to on-device for privacy and speed
  return 'on_device'
}

export { isOffline }
