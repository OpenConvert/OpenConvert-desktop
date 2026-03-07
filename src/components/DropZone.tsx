import { Upload, FolderOpen } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface DropZoneProps {
    onFilesAdded: (files: FileInfo[]) => void
}

export default function DropZone({ onFilesAdded }: DropZoneProps) {
    const [isDragActive, setIsDragActive] = useState(false)
    const dragCounter = useRef(0)

    const handleBrowse = useCallback(async () => {
        try {
            const files = await window.electronAPI.openFileDialog()
            if (files.length > 0) onFilesAdded(files)
        } catch (err) {
            console.error('Failed to open file dialog:', err)
        }
    }, [onFilesAdded])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current = 0
        setIsDragActive(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        if (droppedFiles.length === 0) return

        try {
            const fileInfos: FileInfo[] = []
            for (const file of droppedFiles) {
                const electronFile = file as ElectronFile
                if (electronFile.path) {
                    const info = await window.electronAPI.getFileInfo(electronFile.path)
                    if (info) fileInfos.push(info)
                }
            }
            if (fileInfos.length > 0) onFilesAdded(fileInfos)
        } catch (err) {
            console.error('[DropZone] Failed to process dropped files:', err)
        }
    }, [onFilesAdded])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current += 1
        if (dragCounter.current === 1) {
            setIsDragActive(true)
        }
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current -= 1
        if (dragCounter.current === 0) {
            setIsDragActive(false)
        }
    }, [])

    return (
        <div
            onClick={handleBrowse}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 flex flex-col items-center justify-center gap-4 ${
                isDragActive
                    ? 'border-violet-500/70 bg-violet-500/10 scale-[1.02]'
                    : 'border-zinc-700/50 hover:border-violet-500/50 bg-zinc-900/30 hover:bg-violet-500/5'
            }`}
        >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />

            <div className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                isDragActive
                    ? 'bg-violet-500/10 border-violet-500/30 scale-110'
                    : 'bg-zinc-800/50 group-hover:bg-violet-500/10 border-zinc-700/50 group-hover:border-violet-500/30 group-hover:scale-110'
            }`}>
                <Upload className={`w-7 h-7 transition-colors duration-300 ${
                    isDragActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-violet-400'
                }`} />
            </div>

            <div className="text-center relative">
                <p className="text-base font-medium text-zinc-300 group-hover:text-white transition-colors">
                    {isDragActive ? 'Drop files to add them' : 'Drop files here or click to browse'}
                </p>
                <p className="text-sm text-zinc-600 mt-1">
                    Images, documents, video and audio files
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleBrowse()
                }}
                className="relative mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-sm font-medium text-zinc-300 hover:text-white transition-all duration-200"
            >
                <FolderOpen size={16} />
                Browse Files
            </button>
        </div>
    )
}
