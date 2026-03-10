import { useState, useEffect, memo } from 'react'
import { X, Image, FileText, Film, Music, ArrowRight, Sparkles, RotateCcw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getFileCategory, getTargetFormats, getCategoryColor, getCategoryBgColor, formatFileSize } from '@/lib/formats'
import { getFormatRecommendations, estimateOutputSize, getRecommendationReason } from '@/lib/format-recommendations'
import type { FileCategory } from '@/lib/formats'

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
}

interface FileListProps {
    files: ConvertFile[]
    onRemoveFile: (id: string) => void
    onTargetFormatChange: (id: string, format: string) => void
    onReconvert?: (id: string) => void // Re-convert a completed file
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

function CategoryIcon({ category }: { category: FileCategory | null }) {
    const iconClass = `w-4 h-4 ${category ? getCategoryColor(category) : 'text-zinc-500'}`
    switch (category) {
        case 'image': return <Image className={iconClass} />
        case 'document': return <FileText className={iconClass} />
        case 'video': return <Film className={iconClass} />
        case 'audio': return <Music className={iconClass} />
        default: return <FileText className={iconClass} />
    }
}

/** Lazy-loaded image thumbnail component */
const ImageThumbnail = memo(function ImageThumbnail({ filePath }: { filePath: string }) {
    const [thumbnail, setThumbnail] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        // Thumbnail generation is starting, so we can unconditionally set loading state to true
        setIsLoading(true) // eslint-disable-line react-hooks/set-state-in-effect

        window.electronAPI.generateThumbnail(filePath).then((dataUrl) => {
            if (!cancelled) {
                setThumbnail(dataUrl)
                setIsLoading(false)
            }
        }).catch(() => {
            if (!cancelled) setIsLoading(false)
        })

        return () => { cancelled = true }

    }, [filePath])

    if (isLoading) {
        return (
            <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/30 animate-pulse" />
        )
    }

    if (!thumbnail) {
        return null // Will fall back to category icon
    }

    return (
        <img
            src={thumbnail}
            alt="Preview"
            className="w-10 h-10 rounded-lg object-cover border border-zinc-700/30"
            loading="lazy"
        />
    )
})

export default function FileList({ files, onRemoveFile, onTargetFormatChange, onReconvert }: FileListProps) {
    if (files.length === 0) return null

    return (
        <div className="flex flex-col gap-2 px-4 py-2">
            {files.map((file) => {
                const category = getFileCategory(file.ext)
                const targets = getTargetFormats(file.ext)
                const isImage = category === 'image'

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
                        {/* File icon / Image preview */}
                        {isImage ? (
                            <div className="flex-shrink-0">
                                <ImageThumbnail filePath={file.path} />
                            </div>
                        ) : (
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${category ? getCategoryBgColor(category) : 'bg-zinc-800/50 border-zinc-700/50'
                                }`}>
                                <CategoryIcon category={category} />
                            </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                                {file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-zinc-600 uppercase font-mono">{file.ext}</span>
                                <span className="text-xs text-zinc-700">•</span>
                                <span className="text-xs text-zinc-600">{formatFileSize(file.size)}</span>
                                
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
                                <ArrowRight size={14} className="text-zinc-600" />
                                <Select
                                    value={file.targetFormat}
                                    onValueChange={(val) => onTargetFormatChange(file.id, val)}
                                    disabled={file.status === 'converting' || file.status === 'done'}
                                >
                                    <SelectTrigger className="w-[90px] h-8 text-xs bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600 focus:ring-violet-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-700">
                                        {/* Recommendations section */}
                                        {file.status === 'pending' && getFormatRecommendations(file.ext).length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs text-zinc-500 flex items-center gap-1">
                                                    <Sparkles size={10} />
                                                    <span>Recommended</span>
                                                </div>
                                                {getFormatRecommendations(file.ext).map((rec) => (
                                                    <SelectItem 
                                                        key={rec.format} 
                                                        value={rec.format} 
                                                        className="text-xs uppercase font-mono bg-violet-500/5"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{rec.format.toUpperCase()}</span>
                                                            <Sparkles size={10} className="text-violet-400" />
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
                                                <SelectItem key={fmt} value={fmt} className="text-xs uppercase font-mono">
                                                    {fmt.toUpperCase()}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Estimated size */}
                            {file.status === 'pending' && file.quality !== undefined && (
                                <div className="text-xs text-zinc-600 flex items-center gap-1 ml-5">
                                    <span>~{formatFileSize(estimateOutputSize(file.size, file.ext, file.targetFormat, file.quality))}</span>
                                    <span className="text-zinc-700" title={getRecommendationReason(file.targetFormat)}>•</span>
                                </div>
                            )}
                        </div>

                        {/* Status indicator */}
                        {file.status === 'converting' && (
                            <div className="flex-shrink-0 w-5 h-5">
                                <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                            </div>
                        )}
                        {file.status === 'done' && (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <span className="text-emerald-400 text-xs">&#x2713;</span>
                            </div>
                        )}
                        {file.status === 'error' && (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-red-400 text-xs">!</span>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                            {/* Re-convert button for completed files */}
                            {file.status === 'done' && onReconvert && (
                                <button
                                    onClick={() => onReconvert(file.id)}
                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-150"
                                    title="Convert again"
                                >
                                    <RotateCcw size={12} />
                                </button>
                            )}
                            
                            {/* Remove button */}
                            {(file.status === 'pending' || file.status === 'error') && (
                                <button
                                    onClick={() => onRemoveFile(file.id)}
                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all duration-150"
                                >
                                    <X size={12} />
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
