export interface NutritionalInfo {
  calories: number        // kcal per serving
  protein: number         // g
  carbs: number           // g
  fat: number             // g
  fiber?: number          // g
  sugar?: number          // g
  sodium?: number         // mg
  calcium?: number        // mg
  iron?: number           // mg
  vitaminA?: number       // µg
  vitaminC?: number       // mg
  vitaminD?: number       // µg
  potassium?: number      // mg
  saturatedFat?: number   // g
}

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E'

export interface NutritionalTarget {
  memberId: string
  calories: number
  protein: number
  carbs: number
  fat: number
}
