import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { FamilyMember } from '../../types/profiles'
import {
  loadFamilyName,
  loadProfiles,
  markAppInitialized,
  saveFamilyName,
  saveProfiles,
  isAppInitialized,
} from './profileStorage'
import { SEED_FAMILY_PROFILES, FAMILY_NAME } from '../../seed/family-profiles'
import { computeDailyCalorieTarget, computeMacroTargets } from './calorieCalculator'

interface ProfilesContextValue {
  profiles: FamilyMember[]
  familyName: string
  isLoading: boolean
  addProfile: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProfile: (id: string, updates: Partial<FamilyMember>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  setFamilyName: (name: string) => Promise<void>
}

const ProfilesContext = createContext<ProfilesContextValue | null>(null)

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfilesState] = useState<FamilyMember[]>([])
  const [familyName, setFamilyNameState] = useState<string>('Your Family')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const initialized = await isAppInitialized()
      if (!initialized) {
        // Seed initial Potter family data
        const seeded = SEED_FAMILY_PROFILES.map((m) => {
          const calories = m.dailyCalorieTarget ?? computeDailyCalorieTarget(m)
          const macros = m.macroTargets ?? computeMacroTargets(calories, m.conditions)
          return { ...m, dailyCalorieTarget: calories, macroTargets: macros }
        })
        await saveProfiles(seeded)
        await saveFamilyName(FAMILY_NAME)
        await markAppInitialized()
        setProfilesState(seeded)
        setFamilyNameState(FAMILY_NAME)
      } else {
        const [p, fn] = await Promise.all([loadProfiles(), loadFamilyName()])
        setProfilesState(p)
        setFamilyNameState(fn)
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const addProfile = useCallback(
    async (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const newMember: FamilyMember = {
        ...member,
        id: `member-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      }
      const updated = [...profiles, newMember]
      await saveProfiles(updated)
      setProfilesState(updated)
    },
    [profiles]
  )

  const updateProfile = useCallback(
    async (id: string, updates: Partial<FamilyMember>) => {
      const updated = profiles.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
      await saveProfiles(updated)
      setProfilesState(updated)
    },
    [profiles]
  )

  const deleteProfile = useCallback(
    async (id: string) => {
      const updated = profiles.filter((p) => p.id !== id)
      await saveProfiles(updated)
      setProfilesState(updated)
    },
    [profiles]
  )

  const setFamilyName = useCallback(async (name: string) => {
    await saveFamilyName(name)
    setFamilyNameState(name)
  }, [])

  return (
    <ProfilesContext.Provider
      value={{
        profiles,
        familyName,
        isLoading,
        addProfile,
        updateProfile,
        deleteProfile,
        setFamilyName,
      }}
    >
      {children}
    </ProfilesContext.Provider>
  )
}

export function useProfiles(): ProfilesContextValue {
  const ctx = useContext(ProfilesContext)
  if (!ctx) throw new Error('useProfiles must be used within ProfilesProvider')
  return ctx
}
