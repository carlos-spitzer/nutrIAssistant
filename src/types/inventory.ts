import { NutritionalInfo } from './nutrition'

export type InventoryCategory =
  | 'vegetable' | 'fruit' | 'protein' | 'dairy' | 'grain' | 'condiment' | 'other'

export type QuantityUnit = 'g' | 'kg' | 'ml' | 'l' | 'units'

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: QuantityUnit
  expiryDate?: string         // ISO date
  addedAt: string             // ISO date
  imageUrl?: string
  nutritionalInfo?: NutritionalInfo
  barcode?: string
  lowStockThreshold?: number
}
