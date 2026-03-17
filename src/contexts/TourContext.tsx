import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { TourType } from '@/lib/tours'

interface TourContextType {
    activeTour: TourType | null
    isRunning: boolean
    currentStep: number
    startTour: (tourId: TourType) => void
    stopTour: () => void
    completeTour: (tourId: TourType) => Promise<void>
    isTourCompleted: (tourId: TourType) => boolean
    isFirstLaunch: boolean
    setIsFirstLaunch: (value: boolean) => void
    nextStep: () => void
    setCurrentStep: (step: number) => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
    const [activeTour, setActiveTour] = useState<TourType | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [completedTours, setCompletedTours] = useState<Set<TourType>>(new Set())
    const [isFirstLaunch, setIsFirstLaunch] = useState(false)
    const nextStepTimeoutRef = useRef<number | null>(null)

    // Load completed tours from database on mount
    useEffect(() => {
        loadCompletedTours()
        checkFirstLaunch()
    }, [])

    const loadCompletedTours = async () => {
        try {
            const welcomeCompleted = await window.electronAPI.getSetting('tour_welcome_completed')
            const advancedCompleted = await window.electronAPI.getSetting('tour_advanced_completed')
            const settingsCompleted = await window.electronAPI.getSetting('tour_settings_completed')
            const demoCompleted = await window.electronAPI.getSetting('tour_demo_completed')

            const completed = new Set<TourType>()
            if (welcomeCompleted === 'true') completed.add('welcome')
            if (advancedCompleted === 'true') completed.add('advanced')
            if (settingsCompleted === 'true') completed.add('settings')
            if (demoCompleted === 'true') completed.add('demo')

            setCompletedTours(completed)
        } catch (error) {
            console.error('Failed to load completed tours:', error)
        }
    }

    const checkFirstLaunch = async () => {
        try {
            const hasLaunched = await window.electronAPI.getSetting('app_has_launched')
            if (!hasLaunched || hasLaunched === 'false') {
                setIsFirstLaunch(true)
            }
        } catch (error) {
            console.error('Failed to check first launch:', error)
        }
    }

    const startTour = useCallback((tourId: TourType) => {
        setActiveTour(tourId)
        setCurrentStep(0)
        setIsRunning(true)
    }, [])

    const stopTour = useCallback(() => {
        setIsRunning(false)
        setCurrentStep(0)
        // Delay clearing activeTour to allow animation to complete
        setTimeout(() => setActiveTour(null), 300)
    }, [])

    const nextStep = useCallback(() => {
        // Clear any pending nextStep calls to prevent double advancement
        if (nextStepTimeoutRef.current) {
            clearTimeout(nextStepTimeoutRef.current)
        }
        
        // Debounce the step advancement
        nextStepTimeoutRef.current = setTimeout(() => {
            setCurrentStep(prev => {
                console.log(`[Tour] Advancing from step ${prev} to ${prev + 1}`)
                return prev + 1
            })
            nextStepTimeoutRef.current = null
        }, 50) // Small debounce to prevent rapid double-calls
    }, [])

    const completeTour = useCallback(async (tourId: TourType) => {
        try {
            // Save to database
            await window.electronAPI.updateSetting(`tour_${tourId}_completed`, 'true')
            
            // Update local state
            setCompletedTours(prev => new Set(prev).add(tourId))
            
            // Mark app as launched if this was the first tour
            if (isFirstLaunch) {
                await window.electronAPI.updateSetting('app_has_launched', 'true')
                setIsFirstLaunch(false)
            }

            stopTour()
        } catch (error) {
            console.error('Failed to save tour completion:', error)
        }
    }, [isFirstLaunch, stopTour])

    const isTourCompleted = useCallback((tourId: TourType) => {
        return completedTours.has(tourId)
    }, [completedTours])

    return (
        <TourContext.Provider
            value={{
                activeTour,
                isRunning,
                currentStep,
                startTour,
                stopTour,
                completeTour,
                isTourCompleted,
                isFirstLaunch,
                setIsFirstLaunch,
                nextStep,
                setCurrentStep,
            }}
        >
            {children}
        </TourContext.Provider>
    )
}

export function useTour() {
    const context = useContext(TourContext)
    if (!context) {
        throw new Error('useTour must be used within TourProvider')
    }
    return context
}
