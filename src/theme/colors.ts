export const Colors = {
  // Brand tokens
  healthGreen: '#1D9E75',
  forestGreen: '#0F6E56',
  goldenAmber: '#D4A853',
  softMint: '#E1F5EE',
  warmCharcoal: '#2C2C2A',
  cream: '#F1EFE8',
  errorRed: '#E53E3E',
  warningOrange: '#ED8936',
  infoBlue: '#3182CE',
  white: '#FFFFFF',
  black: '#000000',

  // Semantic light mode
  light: {
    background: '#F1EFE8',
    surface: '#FFFFFF',
    cardBackground: '#FFFFFF',
    text: '#2C2C2A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    divider: '#E5E7EB',
    tabBar: 'rgba(241,239,232,0.95)',
    tabBarInactive: '#9CA3AF',
    statusBar: '#0F6E56',
  },

  // Semantic dark mode
  dark: {
    background: '#2C2C2A',
    surface: '#3A3A38',
    cardBackground: '#3A3A38',
    text: '#F1EFE8',
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    border: '#4A4A48',
    divider: '#4A4A48',
    tabBar: 'rgba(44,44,42,0.95)',
    tabBarInactive: '#6B7280',
    statusBar: '#1D9E75',
  },
} as const

export type ColorScheme = 'light' | 'dark'
