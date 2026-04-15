import { NutritionalInfo, NutriScore } from './nutrition'
import { CompatibilityResult } from './recipes'

export type ScanType = 'barcode' | 'photo'

export interface ScanResult {
  id: string
  scanType: ScanType
  timestamp: string           // ISO date
  barcode?: string
  productName?: string
  brand?: string
  imageUri: string
  nutritionalInfo?: NutritionalInfo
  nutriscore?: NutriScore
  allergens: string[]
  ingredients?: string[]
  familyCompatibility: Record<string, CompatibilityResult>
  addedToInventory: boolean
  addedToCart: boolean
}
