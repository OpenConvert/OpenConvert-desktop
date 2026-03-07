import { X, Image, FileText, Film, Music, ArrowRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getFileCategory, getTargetFormats, getCategoryColor, getCategoryBgColor, formatFileSize } from '@/lib/formats'
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
}

interface FileListProps {
    files: ConvertFile[]
    onRemoveFile: (id: string) => void
    onTargetFormatChange: (id: string, format: string) => void
    onClearAll: () => void
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

export default function FileList({ files, onRemoveFile, onTargetFormatChange, onClearAll }: FileListProps) {
    if (files.length === 0) return null

    return (
        <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-300">
                        Files to convert
                    </h3>
                    <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                        {files.length} {files.length === 1 ? 'file' : 'files'}
                    </Badge>
                </div>
                <button
                    onClick={onClearAll}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                    Clear all
                </button>
            </div>

            {/* File list */}
            <ScrollArea className="max-h-[340px]">
                <div className="flex flex-col gap-2 pr-3">
                    {files.map((file) => {
                        const category = getFileCategory(file.ext)
                        const targets = getTargetFormats(file.ext)

                        return (
                            <div
                                key={file.id}
                                className={`group relative flex items-center gap-3 rounded-xl border bg-zinc-900/50 hover:bg-zinc-900/80 p-3 transition-all duration-200 ${file.status === 'done' ? 'border-emerald-500/20' :
                                        file.status === 'error' ? 'border-red-500/20' :
                                            file.status === 'converting' ? 'border-violet-500/20' :
                                                'border-zinc-800'
                                    }`}
                            >
                                {/* File icon */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${category ? getCategoryBgColor(category) : 'bg-zinc-800/50 border-zinc-700/50'
                                    }`}>
                                    <CategoryIcon category={category} />
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-200 truncate">
                                        {file.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-zinc-600 uppercase font-mono">{file.ext}</span>
                                        <span className="text-xs text-zinc-700">•</span>
                                        <span className="text-xs text-zinc-600">{formatFileSize(file.size)}</span>
                                    </div>
                                </div>

                                {/* Conversion arrow + target format */}
                                <div className="flex items-center gap-2 flex-shrink-0">
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
                                            {targets.map((fmt) => (
                                                <SelectItem key={fmt} value={fmt} className="text-xs uppercase font-mono">
                                                    {fmt.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status indicator */}
                                {file.status === 'converting' && (
                                    <div className="flex-shrink-0 w-5 h-5">
                                        <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                    </div>
                                )}
                                {file.status === 'done' && (
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <span className="text-emerald-400 text-xs">✓</span>
                                    </div>
                                )}
                                {file.status === 'error' && (
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <span className="text-red-400 text-xs">!</span>
                                    </div>
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

                                {/* Progress bar overlay */}
                                {file.status === 'converting' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
                                            style={{ width: `${file.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
