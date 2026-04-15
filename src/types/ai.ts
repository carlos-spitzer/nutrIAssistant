import { FamilyMember } from './profiles'
import { InventoryItem } from './inventory'
import { MealPlan } from './planner'
import { SchoolMenuEntry } from './profiles'

export type AIRoute = 'on_device' | 'cloud'
export type QueryComplexity = 'simple' | 'moderate' | 'complex'

export interface AIContext {
  familyProfiles: FamilyMember[]
  inventory: InventoryItem[]
  currentMealPlan?: MealPlan[]
  schoolMenuEntries?: SchoolMenuEntry[]
  activeMemberId?: string
  isOffline: boolean
  requiresPDF?: boolean
  requiresImage?: boolean
  imageBase64?: string
  pdfBase64?: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  imageUri?: string
  isStreaming?: boolean
  route?: AIRoute
}

export interface OnDeviceLLMStatus {
  isDownloaded: boolean
  isDownloading: boolean
  isLoaded: boolean
  downloadProgress: number    // 0–1
  modelSizeBytes?: number
  downloadError?: string
}
