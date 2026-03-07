import { useState, useEffect } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'

export default function Titlebar() {
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        const cleanup = window.electronAPI.onMaximizeChange((maximized) => {
            setIsMaximized(maximized)
        })
        return cleanup
    }, [])

    return (
        <div className="flex justify-between items-center bg-[#0a0a0b] h-10 w-full select-none text-white border-b border-white/5"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* Left side: App icon + name */}
            <div className="flex items-center gap-2 pl-4">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">O</span>
                </div>
                <span className="text-sm font-medium text-zinc-400">
                    OpenConvert
                </span>
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
