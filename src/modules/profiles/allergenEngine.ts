import { FamilyMember, AllergenType } from '../../types/profiles'
import { CompatibilityResult, Recipe } from '../../types/recipes'
import { ALLERGEN_KEYWORDS, CROSS_REACTIVITY } from '../../seed/allergen-rules'

function ingredientContainsAllergen(ingredient: string, allergen: AllergenType): boolean {
  const lower = ingredient.toLowerCase()
  const keywords = ALLERGEN_KEYWORDS[allergen] ?? []
  return keywords.some((kw) => lower.includes(kw))
}

export function checkMemberCompatibility(
  ingredients: string[],
  member: FamilyMember
): CompatibilityResult {
  if (member.allergies.length === 0) {
    return {
      memberId: member.id,
      memberName: member.name,
      isCompatible: true,
      riskLevel: 'safe',
    }
  }

  for (const allergen of member.allergies) {
    for (const ingredient of ingredients) {
      if (ingredientContainsAllergen(ingredient, allergen)) {
        return {
          memberId: member.id,
          memberName: member.name,
          isCompatible: false,
          reason: `Contains ${allergen} — ${member.name} is allergic`,
          riskLevel: 'danger',
        }
      }
    }

    // Cross-reactivity warnings
    const crossReactive = CROSS_REACTIVITY[allergen] ?? []
    for (const cr of crossReactive) {
      for (const ingredient of ingredients) {
        if (ingredient.toLowerCase().includes(cr.toLowerCase())) {
          return {
            memberId: member.id,
            memberName: member.name,
            isCompatible: false,
            reason: `May contain ${cr} (cross-reactive with ${allergen}) — ${member.name} is allergic`,
            riskLevel: 'warning',
          }
        }
      }
    }
  }

  // Condition-based soft warnings
  if (member.conditions.includes('hypertension')) {
    const highSodiumKeywords = ['salt', 'soy sauce', 'processed', 'canned', 'smoked', 'pickle']
    const hasHighSodium = ingredients.some((ing) =>
      highSodiumKeywords.some((kw) => ing.toLowerCase().includes(kw))
    )
    if (hasHighSodium) {
      return {
        memberId: member.id,
        memberName: member.name,
        isCompatible: true,
        reason: `High sodium ingredients — moderate for ${member.name} (hypertension)`,
        riskLevel: 'warning',
      }
    }
  }

  return {
    memberId: member.id,
    memberName: member.name,
    isCompatible: true,
    riskLevel: 'safe',
  }
}

export function checkFamilyCompatibility(
  recipe: Pick<Recipe, 'ingredients' | 'allergens'>,
  profiles: FamilyMember[]
): Record<string, CompatibilityResult> {
  const ingredientNames = recipe.ingredients.map((i) => i.name)
  const allIngredients = [...ingredientNames, ...recipe.allergens]

  const result: Record<string, CompatibilityResult> = {}
  for (const member of profiles) {
    result[member.id] = checkMemberCompatibility(allIngredients, member)
  }
  return result
}

export function detectAllergensInIngredients(ingredientNames: string[]): AllergenType[] {
  const found: Set<AllergenType> = new Set()
  for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    for (const ingredient of ingredientNames) {
      const lower = ingredient.toLowerCase()
      if (keywords.some((kw) => lower.includes(kw))) {
        found.add(allergen as AllergenType)
        break
      }
    }
  }
  return Array.from(found)
}
