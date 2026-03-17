import { useEffect, useState } from 'react'
import { useTour } from '@/contexts/TourContext'
import {
    AlertDialogRoot,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog'

export default function WelcomeDialog() {
    const { isFirstLaunch, setIsFirstLaunch, startTour } = useTour()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (isFirstLaunch) {
            // Small delay to let the app render first
            const timer = setTimeout(() => {
                setOpen(true)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isFirstLaunch])

    const handleStartTour = () => {
        setOpen(false)
        startTour('welcome')
    }

    const handleSkip = async () => {
        setOpen(false)
        // Mark as launched without completing tour
        await window.electronAPI.updateSetting('app_has_launched', 'true')
        setIsFirstLaunch(false)
    }

    return (
        <AlertDialogRoot open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Welcome to OpenConvert! 🎉</AlertDialogTitle>
                    <AlertDialogDescription>
                        OpenConvert is a powerful, privacy-focused file converter that works entirely offline.
                        Convert images, documents, videos, and audio files - all on your computer with no internet required.
                        {'\n\n'}
                        Would you like a quick tour to get started?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleSkip}>
                        Skip for now
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartTour}>
                        Show me around
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialogRoot>
    )
}
