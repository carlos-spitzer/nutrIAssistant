export type RetailerKey =
  | 'amazon' | 'mercadona' | 'carrefour' | 'alcampo' | 'dia' | 'lidl' | 'custom'

export type RetailerAuthType = 'oauth2' | 'api_key' | 'basic_auth'

export type RetailerCapability =
  | 'price_check' | 'stock_check' | 'cart_export' | 'order_history'

export interface RetailerCredentials {
  username?: string
  password?: string
  apiKey?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: string
}

export interface RetailerConnection {
  id: string
  retailerKey: RetailerKey
  displayName: string
  logoUrl?: string
  apiBaseUrl: string
  authType: RetailerAuthType
  isConnected: boolean
  lastSyncAt?: string
  capabilities: RetailerCapability[]
  isComingSoon?: boolean
}

export interface HealthData {
  steps?: number
  activeCalories?: number
  restingHeartRate?: number
  hrv?: number
  spO2?: number
  weight?: number
  recordedAt: string
}
