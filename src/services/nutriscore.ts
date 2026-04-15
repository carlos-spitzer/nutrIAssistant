import { NutritionalInfo, NutriScore } from '../types/nutrition'

// Official Nutri-Score algorithm (simplified, per 100g)
// Negative points (0–40): energy, saturated fat, sugars, sodium
// Positive points (0–15): fiber, protein
// Score = negative − positive → A (≤−1), B (0–2), C (3–10), D (11–18), E (≥19)

function energyPoints(kcal: number): number {
  if (kcal <= 335) return 0
  if (kcal <= 670) return 1
  if (kcal <= 1005) return 2
  if (kcal <= 1340) return 3
  if (kcal <= 1675) return 4
  if (kcal <= 2010) return 5
  if (kcal <= 2345) return 6
  if (kcal <= 2680) return 7
  if (kcal <= 3015) return 8
  if (kcal <= 3350) return 9
  return 10
}

function satFatPoints(g: number): number {
  if (g <= 1) return 0
  if (g <= 2) return 1
  if (g <= 3) return 2
  if (g <= 4) return 3
  if (g <= 5) return 4
  if (g <= 6) return 5
  if (g <= 7) return 6
  if (g <= 8) return 7
  if (g <= 9) return 8
  if (g <= 10) return 9
  return 10
}

function sugarPoints(g: number): number {
  if (g <= 4.5) return 0
  if (g <= 9) return 1
  if (g <= 13.5) return 2
  if (g <= 18) return 3
  if (g <= 22.5) return 4
  if (g <= 27) return 5
  if (g <= 31) return 6
  if (g <= 36) return 7
  if (g <= 40) return 8
  if (g <= 45) return 9
  return 10
}

function sodiumPoints(mg: number): number {
  if (mg <= 90) return 0
  if (mg <= 180) return 1
  if (mg <= 270) return 2
  if (mg <= 360) return 3
  if (mg <= 450) return 4
  if (mg <= 540) return 5
  if (mg <= 630) return 6
  if (mg <= 720) return 7
  if (mg <= 810) return 8
  if (mg <= 900) return 9
  return 10
}

function fiberPoints(g: number): number {
  if (g <= 0.9) return 0
  if (g <= 1.9) return 1
  if (g <= 2.8) return 2
  if (g <= 3.7) return 3
  if (g <= 4.7) return 4
  return 5
}

function proteinPoints(g: number): number {
  if (g <= 1.6) return 0
  if (g <= 3.2) return 1
  if (g <= 4.8) return 2
  if (g <= 6.4) return 3
  if (g <= 8) return 4
  return 5
}

export function computeNutriScore(nutrition: NutritionalInfo): NutriScore {
  const negative =
    energyPoints(nutrition.calories) +
    satFatPoints(nutrition.saturatedFat ?? nutrition.fat * 0.3) +
    sugarPoints(nutrition.sugar ?? 0) +
    sodiumPoints(nutrition.sodium ?? 0)

  const positive =
    fiberPoints(nutrition.fiber ?? 0) +
    proteinPoints(nutrition.protein)

  const score = negative - positive

  if (score <= -1) return 'A'
  if (score <= 2) return 'B'
  if (score <= 10) return 'C'
  if (score <= 18) return 'D'
  return 'E'
}

export const NUTRISCORE_COLORS: Record<NutriScore, string> = {
  A: '#038141',
  B: '#85BB2F',
  C: '#FECB02',
  D: '#EE8100',
  E: '#E63312',
}
