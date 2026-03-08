/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AppSettings, QualityPreset, OverwriteBehavior, ThemeOption } from '@/lib/settings'
import { DEFAULT_SETTINGS, deserializeSettings } from '@/lib/settings'

interface SettingsContextType {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  resetSettings: () => void
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return ctx
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from database on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const raw = await window.electronAPI.getSettings()
        const loaded = deserializeSettings(raw)
        setSettings(loaded)
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (settings.theme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      // system: follow OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
      root.classList.toggle('light', !prefersDark)
    }
  }, [settings.theme])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))

    // Persist to database
    window.electronAPI.updateSetting(key, JSON.stringify(value)).catch((err: unknown) => {
      console.error(`Failed to save setting ${key}:`, err)
    })
  }, [])

  const resetSettings = useCallback(async () => {
    try {
      await window.electronAPI.resetSettings()
      setSettings(DEFAULT_SETTINGS)
    } catch (err) {
      console.error('Failed to reset settings:', err)
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}

// Re-export types for convenience
export type { AppSettings, QualityPreset, OverwriteBehavior, ThemeOption }
