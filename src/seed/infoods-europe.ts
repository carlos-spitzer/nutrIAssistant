import { NutritionalInfo } from '../types/nutrition'

// Pre-mapped Mediterranean diet staples (per 100g)
export const INFOODS_EUROPE: Record<string, NutritionalInfo> = {
  'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, saturatedFat: 13.8, sodium: 2 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, vitaminC: 14, potassium: 237 },
  'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, vitaminC: 7.4 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, vitaminC: 31, calcium: 181 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, potassium: 421, vitaminC: 19.7 },
  'carrot': { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, vitaminA: 835 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, calcium: 99, iron: 2.7, vitaminC: 28, vitaminA: 469 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, vitaminC: 89, calcium: 47, vitaminK: 101 } as NutritionalInfo,
  'lentils (cooked)': { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, iron: 3.3, calcium: 19, folate: 181 } as NutritionalInfo,
  'chickpeas (cooked)': { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, iron: 2.9, calcium: 49 },
  'white rice (cooked)': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sodium: 1 },
  'pasta (cooked)': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sodium: 4 },
  'bread (white)': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sodium: 491, calcium: 107 },
  'bread (wholemeal)': { calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, sodium: 405, calcium: 54 },
  'chicken breast (cooked)': { calories: 165, protein: 31, carbs: 0, fat: 3.6, sodium: 74, potassium: 256 },
  'beef (lean, cooked)': { calories: 250, protein: 26, carbs: 0, fat: 15, iron: 2.6, zinc: 5.5 } as NutritionalInfo,
  'salmon (cooked)': { calories: 208, protein: 20, carbs: 0, fat: 13, sodium: 59, potassium: 363, vitaminD: 14.1 },
  'tuna (canned)': { calories: 132, protein: 28, carbs: 0, fat: 2.1, sodium: 354 },
  'egg (whole)': { calories: 155, protein: 13, carbs: 1.1, fat: 11, calcium: 56, iron: 1.8, vitaminD: 2 },
  'milk (whole)': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, calcium: 113, vitaminD: 0.1 },
  'yogurt (natural)': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, calcium: 183 },
  'cheese (cheddar)': { calories: 403, protein: 25, carbs: 1.3, fat: 33, calcium: 721, sodium: 621 },
  'mozzarella': { calories: 280, protein: 22, carbs: 2.2, fat: 22, calcium: 505, sodium: 373 },
  'parmesan': { calories: 431, protein: 38, carbs: 4.1, fat: 29, calcium: 1184, sodium: 1529 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, saturatedFat: 51, sodium: 11 },
  'almond': { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, calcium: 264, iron: 3.7, vitaminE: 25.6 } as NutritionalInfo,
  'walnut': { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, calcium: 98, iron: 2.9 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, potassium: 358, vitaminC: 8.7 },
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, vitaminC: 4.6 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9.4, vitaminC: 53.2, calcium: 40 },
  'lemon': { calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, vitaminC: 53 },
  'strawberry': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, vitaminC: 58.8 },
  'bell pepper': { calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, vitaminC: 127.7, vitaminA: 157 },
  'cucumber': { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, vitaminC: 2.8 },
  'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, vitaminC: 9.2, vitaminA: 166, vitaminK: 126 } as NutritionalInfo,
  'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, vitaminD: 0.2, potassium: 318 },
  'zucchini': { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, vitaminC: 17.9 },
  'eggplant': { calories: 25, protein: 1, carbs: 5.9, fat: 0.2, fiber: 3, potassium: 229 },
  'olive (green)': { calories: 145, protein: 1, carbs: 3.8, fat: 15, fiber: 3.3, sodium: 1556 },
  'tomato paste': { calories: 82, protein: 4.3, carbs: 19, fat: 0.5, fiber: 4.1, sodium: 59, vitaminC: 21.9 },
  'chicken broth': { calories: 15, protein: 1, carbs: 1.4, fat: 0.5, sodium: 924 },
  'vegetable broth': { calories: 12, protein: 0.2, carbs: 2.9, fat: 0.1, sodium: 720 },
  'honey': { calories: 304, protein: 0.3, carbs: 82, fat: 0, sugar: 82 },
  'soy sauce': { calories: 53, protein: 8.1, carbs: 4.9, fat: 0.6, sodium: 5493 },
  'paprika': { calories: 282, protein: 14, carbs: 54, fat: 13, fiber: 34, vitaminA: 2463, vitaminC: 0 },
  'cumin': { calories: 375, protein: 18, carbs: 44, fat: 22, fiber: 10.5, iron: 66.4, calcium: 931 },
  'turmeric': { calories: 312, protein: 9.7, carbs: 67, fat: 3.2, fiber: 21, iron: 41.4 },
}

export function getInfoodsData(ingredientName: string): NutritionalInfo | null {
  const normalized = ingredientName.toLowerCase().trim()
  if (INFOODS_EUROPE[normalized]) return INFOODS_EUROPE[normalized]
  // Partial match
  const key = Object.keys(INFOODS_EUROPE).find(
    (k) => normalized.includes(k) || k.includes(normalized)
  )
  return key ? INFOODS_EUROPE[key] : null
}
