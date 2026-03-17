import { useState, useEffect } from 'react'
import { Minus, Square, Copy, X, PanelLeft, HelpCircle, BookOpen, Download, LifeBuoy } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { APP_CONFIG } from '@/config/app'
import { useTour } from '@/contexts/TourContext'

interface TitlebarProps {
    isSidebarExpanded: boolean
    onToggleSidebar: () => void
}

export default function Titlebar({ isSidebarExpanded, onToggleSidebar }: TitlebarProps) {
    const [isMaximized, setIsMaximized] = useState(false)
    const [appVersion, setAppVersion] = useState<string>('')
    const [updateDialog, setUpdateDialog] = useState<{ 
        open: boolean
        title: string
        description: string
        confirmText?: string
        onConfirm?: () => void
    } | null>(null)
    const { startTour } = useTour()

    useEffect(() => {
        const cleanup = window.electronAPI.onMaximizeChange((maximized) => {
            setIsMaximized(maximized)
        })
        return cleanup
    }, [])

    useEffect(() => {
        window.electronAPI.getAppVersion().then(setAppVersion).catch(() => setAppVersion('Unknown'))
    }, [])

    const handleCheckUpdates = async () => {
        try {
            const currentVersion = appVersion
            
            // Try to fetch latest version from configured repository
            try {
                const response = await fetch(APP_CONFIG.links.releasesApi)
                if (response.ok) {
                    const data = await response.json()
                    const latestVersion = data.tag_name?.replace('v', '')
                    
                    if (latestVersion && latestVersion !== currentVersion) {
                        setUpdateDialog({
                            open: true,
                            title: 'Update Available',
                            description: `A new version (${latestVersion}) is available! You are currently running version ${currentVersion}.`,
                            confirmText: 'View Releases',
                            onConfirm: () => {
                                window.electronAPI.openExternal(APP_CONFIG.links.releasesPage)
                            },
                        })
                        return
                    }
                }
            } catch (fetchError) {
                console.warn('Could not fetch latest version:', fetchError)
            }
            
            // If we couldn't check or there's no update, show current version
            setUpdateDialog({
                open: true,
                title: 'You\'re up to date!',
                description: `You are running the latest version (${currentVersion}).`,
            })
        } catch (error) {
            console.error('Failed to check for updates:', error)
            setUpdateDialog({
                open: true,
                title: 'Update Check Failed',
                description: 'Could not check for updates. Please try again later.',
            })
        }
    }

    const handleOpenSupport = async () => {
        await window.electronAPI.openExternal(APP_CONFIG.links.support)
    }

    const handleAppGuideTour = () => {
        // Start the welcome tour immediately
        startTour('welcome')
    }

    return (
        <div className="flex justify-between items-center bg-[#0a0a0b] h-10 w-full select-none text-white border-b border-white/5 flex-shrink-0"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* Left side: Logo and Sidebar toggle */}
            <div className="flex items-center gap-2 pl-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {/* Logo */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 px-1">
                                <img
                                    src="/logo.png"
                                    alt="OpenConvert"
                                    className="w-7 h-7"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            OpenConvert
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Sidebar toggle */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={onToggleSidebar}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
                                aria-label={isSidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
                            >
                                <PanelLeft size={16} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            {isSidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Right side: Help menu and Window controls */}
            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {/* Help Menu */}
                <DropdownMenu>
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors duration-150"
                                        aria-label="Help"
                                    >
                                        <HelpCircle size={16} />
                                    </button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                Help
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent
                        className="bg-zinc-900 border-zinc-800 text-zinc-200 min-w-[200px]"
                        align="end"
                        sideOffset={8}
                    >
                        <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                            onClick={handleAppGuideTour}
                        >
                            <BookOpen size={14} />
                            <span className="text-sm">App Guide Tours</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                            onClick={handleCheckUpdates}
                        >
                            <Download size={14} />
                            <span className="text-sm">Check for Updates</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                            onClick={handleOpenSupport}
                        >
                            <LifeBuoy size={14} />
                            <span className="text-sm">Help & Support</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => window.electronAPI.minimize()}
                                className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors duration-150"
                                aria-label="Minimize"
                            >
                                <Minus size={14} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            Minimize
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => window.electronAPI.maximize()}
                                className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors duration-150"
                                aria-label={isMaximized ? 'Restore' : 'Maximize'}
                            >
                                {isMaximized ? <Copy size={11} /> : <Square size={11} />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            {isMaximized ? 'Restore' : 'Maximize'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => window.electronAPI.close()}
                                className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-red-600 hover:text-white transition-colors duration-150"
                                aria-label="Close"
                            >
                                <X size={14} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            Close
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Update/Info Dialog */}
            {updateDialog && (
                <AlertDialog
                    open={updateDialog.open}
                    onOpenChange={(open) => !open && setUpdateDialog(null)}
                    title={updateDialog.title}
                    description={updateDialog.description}
                    confirmText={updateDialog.confirmText}
                    onConfirm={updateDialog.onConfirm}
                />
            )}
        </div>
    )
}

