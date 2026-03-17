import { useState, useEffect } from 'react'
import { X, ArrowRight, FileText, Image as ImageIcon, TrendingDown, TrendingUp, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/formats'

interface ComparisonModalProps {
  sourceFile: {
    path: string
    name: string
    size: number
    ext: string
  }
  outputFile: {
    path: string
    name: string
    size?: number
  }
  onClose: () => void
}

export default function ComparisonModal({ sourceFile, outputFile, onClose }: ComparisonModalProps) {
  const [sourceThumbnail, setSourceThumbnail] = useState<string | null>(null)
  const [outputThumbnail, setOutputThumbnail] = useState<string | null>(null)
  const [outputSize, setOutputSize] = useState<number | undefined>(outputFile.size)
  const [sourceMetadata, setSourceMetadata] = useState<FileMetadataInfo | null>(null)
  const [outputMetadata, setOutputMetadata] = useState<FileMetadataInfo | null>(null)

  useEffect(() => {
    // Generate thumbnails for all file types
    window.electronAPI.generateThumbnail(sourceFile.path).then(setSourceThumbnail)
    window.electronAPI.generateThumbnail(outputFile.path).then(setOutputThumbnail)

    // Get metadata
    window.electronAPI.getFileMetadata(sourceFile.path).then(setSourceMetadata)
    window.electronAPI.getFileMetadata(outputFile.path).then(setOutputMetadata)

    // Get output file size if not provided
    if (!outputSize) {
      window.electronAPI.getFileInfo(outputFile.path).then(info => {
        if (info) setOutputSize(info.size)
      })
    }
  }, [sourceFile.path, outputFile.path, outputSize])

  const sizeReduction = outputSize && sourceFile.size > 0
    ? ((sourceFile.size - outputSize) / sourceFile.size) * 100
    : 0

  const isReduced = sizeReduction > 0
  const outputExt = outputFile.name.split('.').pop()?.toLowerCase() || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-6xl mx-4 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="relative flex items-center justify-between px-8 py-5 border-b border-zinc-800/50 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-500/5">
          <div>
            <h2 className="text-xl font-bold text-white">File Comparison</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Before & After Conversion</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-800 transition-all hover:rotate-90 duration-300"
          >
            <X size={20} className="text-zinc-400 hover:text-white" />
          </button>
        </div>

        {/* Main Comparison Area */}
        <div className="p-8">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-start">
            {/* Source File - Left */}
            <div className="space-y-4 animate-in slide-in-from-left duration-500">
              {/* Label */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                  <FileText size={16} className="text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300">Original</h3>
                  <p className="text-xs text-zinc-600">Source file</p>
                </div>
              </div>

              {/* Thumbnail/Preview */}
              <div className="relative group">
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg">
                  {sourceThumbnail ? (
                    <img
                      src={sourceThumbnail}
                      alt="Source preview"
                      className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText size={48} className="text-zinc-700" />
                    </div>
                  )}
                </div>
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* File Info Card */}
              <div className="space-y-3 p-5 rounded-xl bg-zinc-900/80 border border-zinc-800/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Filename</span>
                  <span className="text-sm text-zinc-300 font-medium truncate ml-3 max-w-[200px]" title={sourceFile.name}>
                    {sourceFile.name}
                  </span>
                </div>
                <div className="h-px bg-zinc-800/50" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Format</span>
                  <span className="text-sm text-zinc-300 font-mono uppercase px-2 py-0.5 rounded bg-zinc-800/50">
                    {sourceFile.ext}
                  </span>
                </div>
                <div className="h-px bg-zinc-800/50" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">File Size</span>
                  <span className="text-sm text-zinc-300 font-semibold">
                    {formatFileSize(sourceFile.size)}
                  </span>
                </div>
                {sourceMetadata?.width && sourceMetadata?.height && (
                  <>
                    <div className="h-px bg-zinc-800/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Resolution</span>
                      <span className="text-sm text-zinc-300 font-mono">
                        {sourceMetadata.width}×{sourceMetadata.height}
                      </span>
                    </div>
                  </>
                )}
                {sourceMetadata?.duration && (
                  <>
                    <div className="h-px bg-zinc-800/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Duration</span>
                      <span className="text-sm text-zinc-300 font-mono">
                        {Math.floor(sourceMetadata.duration / 60)}:{Math.floor(sourceMetadata.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Center Arrow Indicator */}
            <div className="flex flex-col items-center justify-center gap-4 pt-20 animate-in zoom-in duration-700 delay-200">
              <div className="relative">
                {/* Animated pulse ring */}
                <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                {/* Main arrow container */}
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 p-[2px] shadow-lg shadow-violet-500/20">
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                    <ArrowRight size={28} className="text-white" />
                  </div>
                </div>
              </div>
              
              {/* Conversion Success Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Check size={12} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Converted</span>
              </div>
            </div>

            {/* Output File - Right */}
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
              {/* Label */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center">
                  <ImageIcon size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">Converted</h3>
                  <p className="text-xs text-zinc-600">Output file</p>
                </div>
              </div>

              {/* Thumbnail/Preview */}
              <div className="relative group">
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-emerald-500/20 bg-zinc-950 shadow-lg shadow-emerald-500/5">
                  {outputThumbnail ? (
                    <img
                      src={outputThumbnail}
                      alt="Output preview"
                      className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} className="text-emerald-700/50" />
                    </div>
                  )}
                </div>
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* File Info Card */}
              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-emerald-500/5 to-zinc-900/80 border border-emerald-500/20 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Filename</span>
                  <span className="text-sm text-emerald-300 font-medium truncate ml-3 max-w-[200px]" title={outputFile.name}>
                    {outputFile.name}
                  </span>
                </div>
                <div className="h-px bg-emerald-500/10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Format</span>
                  <span className="text-sm text-emerald-400 font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10">
                    {outputExt}
                  </span>
                </div>
                <div className="h-px bg-emerald-500/10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">File Size</span>
                  <span className="text-sm text-emerald-300 font-semibold">
                    {outputSize ? formatFileSize(outputSize) : 'Calculating...'}
                  </span>
                </div>
                {outputMetadata?.width && outputMetadata?.height && (
                  <>
                    <div className="h-px bg-emerald-500/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Resolution</span>
                      <span className="text-sm text-emerald-300 font-mono">
                        {outputMetadata.width}×{outputMetadata.height}
                      </span>
                    </div>
                  </>
                )}
                {outputMetadata?.duration && (
                  <>
                    <div className="h-px bg-emerald-500/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Duration</span>
                      <span className="text-sm text-emerald-300 font-mono">
                        {Math.floor(outputMetadata.duration / 60)}:{Math.floor(outputMetadata.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Size Comparison Stats */}
          {outputSize && sizeReduction !== 0 && (
            <div className="mt-6 animate-in slide-in-from-bottom duration-500 delay-300">
              <div className={`p-5 rounded-xl border ${
                isReduced 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/30' 
                  : 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${
                      isReduced ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                    } flex items-center justify-center`}>
                      {isReduced ? (
                        <TrendingDown size={20} className="text-emerald-400" />
                      ) : (
                        <TrendingUp size={20} className="text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold ${
                        isReduced ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isReduced ? 'Size Reduced' : 'Size Increased'}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {isReduced 
                          ? 'File size optimized successfully' 
                          : 'Output file is larger than original'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      isReduced ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {isReduced ? '-' : '+'}{Math.abs(sizeReduction).toFixed(1)}%
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {isReduced ? 'saved' : 'increased'}: {formatFileSize(Math.abs(sourceFile.size - (outputSize || 0)))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-zinc-800/50 bg-zinc-950/50">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Info size={14} />
            <span>Click "Show in Folder" to view the converted file</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.electronAPI.showInFolder(outputFile.path)}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              Show in Folder
            </Button>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white shadow-lg shadow-violet-500/20"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
