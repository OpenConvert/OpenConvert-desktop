import { useState, useEffect, useRef } from 'react'
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride'
import type { CallBackProps } from 'react-joyride'
import { useTour } from '@/contexts/TourContext'
import { getTour } from '@/lib/tours'

export default function AppTour() {
    const { activeTour, isRunning, stopTour, completeTour, currentStep, setCurrentStep } = useTour()
    const [run, setRun] = useState(isRunning)
    const lastStepChangeRef = useRef<number>(0)

    useEffect(() => {
        setRun(isRunning)
        if (!isRunning) {
            setCurrentStep(0)
        }
    }, [isRunning, setCurrentStep])

    if (!activeTour) return null

    const tour = getTour(activeTour)
    if (!tour) return null

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, action, index } = data
        
        console.log('[AppTour] Callback:', { status, type, action, index, currentStep })

        // Handle tour completion/skip
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            if (status === STATUS.FINISHED) {
                completeTour(activeTour)
            } else {
                stopTour()
            }
            return
        }

        // Handle back navigation - MUST be before NEXT handling
        if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
            const now = Date.now()
            console.log('[AppTour] Back button clicked, currentStep:', currentStep, 'index:', index)
            
            // Prevent double-clicks
            if (now - lastStepChangeRef.current < 200) {
                console.log('[AppTour] Ignoring Back - step changed recently')
                return
            }
            
            // In controlled mode, we manage the step index
            // When back is clicked, we need to go to previous step
            if (currentStep > 0) {
                lastStepChangeRef.current = now
                setCurrentStep(currentStep - 1)
            }
            return
        }

        // Handle step navigation
        if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
            const step = tour.steps[index]
            const now = Date.now()
            
            console.log('[AppTour] Next button clicked on step', index, 'spotlightClicks:', step.spotlightClicks)
            
            // Prevent double-advancement if step changed recently (within 200ms)
            if (now - lastStepChangeRef.current < 200) {
                console.log('[AppTour] Ignoring Next - step changed recently')
                return
            }
            
            // Always advance when Next is clicked, whether interactive or not
            // This allows users to skip interactive steps if they want
            // Interactive steps can ALSO be advanced by performing the action
            lastStepChangeRef.current = now
            setCurrentStep(index + 1)
        }

        // Handle target not found
        if (type === EVENTS.TARGET_NOT_FOUND) {
            console.error(`[Tour] Step ${index} target not found:`, tour.steps[index].target)
            console.error('[Tour] This is a critical bug - the tour is broken!')
            
            // For now, skip to next step but log detailed error
            console.error('[Tour] Auto-skipping to next step. Tour flow may be disrupted.')
            setCurrentStep(index + 1)
            
            // In production, you might want to stop the tour instead:
            // stopTour()
        }
    }

    return (
        <Joyride
            steps={tour.steps}
            run={run}
            stepIndex={currentStep}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            disableOverlayClose
            styles={{
                options: {
                    arrowColor: '#18181b',
                    backgroundColor: '#18181b',
                    overlayColor: 'rgba(0, 0, 0, 0.7)',
                    primaryColor: '#8b5cf6',
                    textColor: '#ffffff',
                    width: 380,
                    zIndex: 10000,
                },
                tooltip: {
                    borderRadius: '12px',
                    padding: '20px',
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                tooltipTitle: {
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: '#ffffff',
                },
                tooltipContent: {
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#d4d4d8',
                    padding: '0',
                },
                buttonNext: {
                    backgroundColor: '#8b5cf6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '10px 20px',
                    outline: 'none',
                },
                buttonBack: {
                    color: '#a1a1aa',
                    fontSize: '14px',
                    marginRight: '10px',
                },
                buttonSkip: {
                    color: '#71717a',
                    fontSize: '13px',
                },
                buttonClose: {
                    display: 'none',
                },
                spotlight: {
                    borderRadius: '8px',
                },
            }}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                open: 'Open',
                skip: 'Skip Tour',
            }}
        />
    )
}
