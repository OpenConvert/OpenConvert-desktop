import { useState, useEffect } from 'react'
import { X, ArrowRight, Sparkles, RotateCcw, Tags } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getFileCategory, getTargetFormats, formatFileSize } from '@/lib/formats'
import { getFormatRecommendations, estimateOutputSize } from '@/lib/format-recommendations'
import { FileThumbnail } from './FileThumbnail'

export interface ConvertFile {
    id: string
    path: string
    name: string
    ext: string
    size: number
    targetFormat: string
    status: 'pending' | 'converting' | 'done' | 'error'
    progress: number
    error?: string
    quality?: number // Quality setting for this file (0-100)
    currentOperation?: string // Current operation being performed
    eta?: number // Estimated seconds remaining
    startTime?: number // When conversion started
    imageOptions?: ImageOptimizationOptions // Image-specific options (resize, rotate, etc.)
    mediaOptions?: MediaOptimizationOptions // Video/audio-specific options (bitrate, codec, etc.)
    metadata?: FileMetadata // Custom metadata to embed in output file
}

interface FileListProps {
    files: ConvertFile[]
    onRemoveFile: (id: string) => void
    onTargetFormatChange: (id: string, format: string) => void
    onReconvert?: (id: string) => void // Re-convert a completed file
    onEditMetadata?: (id: string) => void // Edit file metadata
    onRenameFile?: (id: string, newName: string) => void // Rename file
}

/** Format seconds into human-readable time */
function formatTimeRemaining(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60)
        const secs = Math.round(seconds % 60)
        return `${mins}m ${secs}s`
    }
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
}



/** Helper to format duration in seconds to MM:SS */
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Component to display file metadata */
function FileMetadataDisplay({ filePath }: { filePath: string }) {
    const [metadata, setMetadata] = useState<FileMetadataInfo | null>(null)

    useEffect(() => {
        let cancelled = false

        window.electronAPI.getFileMetadata(filePath)
            .then((data) => {
                if (!cancelled && data) {
                    setMetadata(data)
                }
            })
            .catch(() => {
                // Silently fail
            })

        return () => { cancelled = true }
    }, [filePath])

    if (!metadata) return null

    const parts: string[] = []

    // Show resolution for images and videos
    if (metadata.width && metadata.height) {
        parts.push(`${metadata.width}×${metadata.height}`)
    }

    // Show duration for videos and audio
    if (metadata.duration) {
        parts.push(formatDuration(metadata.duration))
    }

    // Show page count for PDFs
    if (metadata.pageCount) {
        parts.push(`${metadata.pageCount} ${metadata.pageCount === 1 ? 'page' : 'pages'}`)
    }

    if (parts.length === 0) return null

    return (
        <>
            {parts.map((part, idx) => (
                <span key={idx}>
                    <span className="text-xs text-zinc-700">•</span>
                    <span className="text-xs text-zinc-600">{part}</span>
                </span>
            ))}
        </>
    )
}

export default function FileList({ files, onRemoveFile, onTargetFormatChange, onReconvert, onEditMetadata, onRenameFile }: FileListProps) {
    const [editingFileId, setEditingFileId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')

    const handleRenameStart = (file: ConvertFile) => {
        // Don't allow rename while converting
        if (file.status === 'converting') return
        
        setEditingFileId(file.id)
        // Set name without extension
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'))
        setEditingName(nameWithoutExt || file.name)
    }

    const handleRenameSave = (fileId: string) => {
        const file = files.find(f => f.id === fileId)
        if (!file || !onRenameFile) {
            setEditingFileId(null)
            return
        }
        
        // Trim and validate
        const trimmedName = editingName.trim()
        if (!trimmedName || trimmedName === file.name.substring(0, file.name.lastIndexOf('.'))) {
            setEditingFileId(null)
            return
        }
        
        // Check if name exists in current file list
        const newName = `${trimmedName}.${file.ext}`
        const exists = files.some(f => 
            f.id !== fileId && f.name.toLowerCase() === newName.toLowerCase()
        )
        
        if (exists) {
            // Auto-append number
            let counter = 1
            let finalName = newName
            while (files.some(f => f.id !== fileId && f.name.toLowerCase() === finalName.toLowerCase())) {
                finalName = `${trimmedName}-${counter}.${file.ext}`
                counter++
            }
            onRenameFile(fileId, finalName)
        } else {
            onRenameFile(fileId, newName)
        }
        
        setEditingFileId(null)
    }

    const handleRenameCancel = () => {
        setEditingFileId(null)
    }

    if (files.length === 0) return null

    return (
        <div className="flex flex-col gap-2 px-4 py-2">
            {files.map((file) => {
                const category = getFileCategory(file.ext)
                const targets = getTargetFormats(file.ext)

                return (
                    <div
                        key={file.id}
                        className={`group relative flex items-center gap-3 rounded-xl border bg-zinc-900/50 hover:bg-zinc-900/80 p-3 transition-all duration-200 ${
                            file.status === 'converting' ? 'pb-12' : ''
                        } ${file.status === 'done' ? 'border-emerald-500/20' :
                            file.status === 'error' ? 'border-red-500/20' :
                                file.status === 'converting' ? 'border-violet-500/20' :
                                    'border-zinc-800'
                            }`}
                    >
                        {/* Universal thumbnail for all file types */}
                        <FileThumbnail filePath={file.path} category={category} />

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                            {editingFileId === file.id ? (
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => handleRenameSave(file.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameSave(file.id)
                                        if (e.key === 'Escape') handleRenameCancel()
                                    }}
                                    className="text-sm font-medium bg-zinc-800 border border-violet-500 rounded px-2 py-0.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 w-full"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <p 
                                    className={`text-sm font-medium text-zinc-200 truncate ${
                                        file.status !== 'converting' && onRenameFile 
                                            ? 'cursor-text hover:text-white transition-colors' 
                                            : ''
                                    }`}
                                    onClick={() => onRenameFile && handleRenameStart(file)}
                                    title={onRenameFile && file.status !== 'converting' ? 'Click to rename' : file.name}
                                >
                                    {file.name}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-zinc-600 uppercase font-mono">{file.ext}</span>
                                <span className="text-xs text-zinc-700">•</span>
                                <span className="text-xs text-zinc-600">{formatFileSize(file.size)}</span>
                                
                                {/* Show metadata (resolution, duration, page count) */}
                                <FileMetadataDisplay filePath={file.path} />
                                
                                {/* Show current operation and ETA while converting */}
                                {file.status === 'converting' && (
                                    <>
                                        {file.currentOperation && (
                                            <>
                                                <span className="text-xs text-zinc-700">•</span>
                                                <span className="text-xs text-violet-400">{file.currentOperation}</span>
                                            </>
                                        )}
                                        {file.eta !== undefined && file.eta > 0 && (
                                            <>
                                                <span className="text-xs text-zinc-700">•</span>
                                                <span className="text-xs text-zinc-500">{formatTimeRemaining(file.eta)} left</span>
                                            </>
                                        )}
                                    </>
                                )}
                                
                                {file.error && (
                                    <>
                                        <span className="text-xs text-zinc-700">•</span>
                                        <span className="text-xs text-red-400 truncate max-w-[200px]" title={file.error}>
                                            {file.error}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Conversion arrow + target format */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <ArrowRight size={16} className="text-zinc-600" />
                                <Select
                                    value={file.targetFormat}
                                    onValueChange={(val) => onTargetFormatChange(file.id, val)}
                                    disabled={file.status === 'converting' || file.status === 'done'}
                                >
                                    <SelectTrigger className="w-[100px] h-9 text-sm bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600 focus:ring-violet-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-700">
                                        {/* Recommendations section */}
                                        {file.status === 'pending' && getFormatRecommendations(file.ext).length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-sm text-zinc-500 flex items-center gap-1.5">
                                                    <Sparkles size={12} />
                                                    <span>Recommended</span>
                                                </div>
                                                {getFormatRecommendations(file.ext).map((rec) => (
                                                    <SelectItem 
                                                        key={rec.format} 
                                                        value={rec.format} 
                                                        className="text-sm uppercase font-mono bg-violet-500/5"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{rec.format.toUpperCase()}</span>
                                                            <Sparkles size={12} className="text-violet-400" />
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                <div className="h-px bg-zinc-800 my-1" />
                                            </>
                                        )}
                                        {/* All formats */}
                                        {targets.map((fmt) => {
                                            const isRecommended = getFormatRecommendations(file.ext).some(r => r.format === fmt)
                                            if (isRecommended && file.status === 'pending') return null // Already shown above
                                            return (
                                                <SelectItem key={fmt} value={fmt} className="text-sm uppercase font-mono">
                                                    {fmt.toUpperCase()}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Estimated size */}
                            {file.status === 'pending' && file.quality !== undefined && (
                                <div className="text-sm text-zinc-500 flex items-center gap-1 ml-6">
                                    <span>~{formatFileSize(estimateOutputSize(file.size, file.ext, file.targetFormat, file.quality))}</span>
                                </div>
                            )}
                        </div>

                        {/* Status indicator */}
                        {file.status === 'converting' && (
                            <div className="flex-shrink-0 w-6 h-6">
                                <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                            </div>
                        )}
                        {file.status === 'done' && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <span className="text-emerald-400 text-sm font-semibold">&#x2713;</span>
                            </div>
                        )}
                        {file.status === 'error' && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-red-400 text-sm font-semibold">!</span>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {/* Edit metadata button for pending files */}
                            {file.status === 'pending' && onEditMetadata && (category === 'video' || category === 'audio' || category === 'image') && (
                                <button
                                    onClick={() => onEditMetadata(file.id)}
                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150 border border-transparent hover:border-violet-500/20"
                                    title="Edit metadata"
                                >
                                    <Tags size={16} />
                                </button>
                            )}
                            
                            {/* Re-convert button for completed files */}
                            {file.status === 'done' && onReconvert && (
                                <button
                                    onClick={() => onReconvert(file.id)}
                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-150 border border-transparent hover:border-emerald-500/20"
                                    title="Convert again"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            )}
                            
                            {/* Remove button */}
                            {(file.status === 'pending' || file.status === 'error') && (
                                <button
                                    onClick={() => onRemoveFile(file.id)}
                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 border border-transparent hover:border-red-500/20"
                                    title="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Progress bar with info */}
                        {file.status === 'converting' && (
                            <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                                {/* Progress bar */}
                                <div className="relative h-1.5 rounded-full bg-zinc-800/60 overflow-hidden backdrop-blur-sm border border-zinc-700/30">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-500 via-violet-400 to-indigo-500 transition-all duration-500 ease-out relative"
                                        style={{ width: `${file.progress}%` }}
                                    >
                                        {/* Animated shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </div>
                                </div>
                                
                                {/* Progress info */}
                                <div className="flex items-center justify-between mt-1.5 px-0.5">
                                    <span className="text-[10px] font-semibold text-violet-400 tabular-nums">
                                        {Math.round(file.progress)}%
                                    </span>
                                    {file.eta !== undefined && file.eta > 0 && (
                                        <span className="text-[10px] font-medium text-zinc-500 tabular-nums">
                                            {formatTimeRemaining(file.eta)} remaining
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
