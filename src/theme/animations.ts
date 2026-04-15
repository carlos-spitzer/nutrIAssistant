export const SpringPresets = {
  card: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  snappy: {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
  },
  gentle: {
    damping: 25,
    stiffness: 100,
    mass: 1,
  },
} as const

export const TimingPresets = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const
