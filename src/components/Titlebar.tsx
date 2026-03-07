import { useState, useEffect } from 'react'
import { Minus, Square, Copy, X, PanelLeft } from 'lucide-react'

interface TitlebarProps {
    isSidebarExpanded: boolean
    onToggleSidebar: () => void
}

export default function Titlebar({ isSidebarExpanded, onToggleSidebar }: TitlebarProps) {
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        const cleanup = window.electronAPI.onMaximizeChange((maximized) => {
            setIsMaximized(maximized)
        })
        return cleanup
    }, [])

    return (
        <div className="flex justify-between items-center bg-[#0a0a0b] h-10 w-full select-none text-white border-b border-white/5 flex-shrink-0"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* Left side: Sidebar toggle icon */}
            <div className="flex items-center pl-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    onClick={onToggleSidebar}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
                    aria-label={isSidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
                >
                    <PanelLeft size={16} />
                </button>
            </div>

            {/* Right side: Window controls */}
            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    onClick={() => window.electronAPI.minimize()}
                    className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors duration-150"
                    aria-label="Minimize"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={() => window.electronAPI.maximize()}
                    className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors duration-150"
                    aria-label={isMaximized ? 'Restore' : 'Maximize'}
                >
                    {isMaximized ? <Copy size={11} /> : <Square size={11} />}
                </button>
                <button
                    onClick={() => window.electronAPI.close()}
                    className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-red-600 hover:text-white transition-colors duration-150"
                    aria-label="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    )
}

