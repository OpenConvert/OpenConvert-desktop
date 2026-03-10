import { useState, useEffect } from 'react'
import { X, ArrowRight, FileText, Image as ImageIcon } from 'lucide-react'
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

  useEffect(() => {
    // Generate thumbnails if images
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'tiff', 'bmp'].includes(sourceFile.ext.toLowerCase())
    
    if (isImage) {
      window.electronAPI.generateThumbnail(sourceFile.path).then(setSourceThumbnail)
      window.electronAPI.generateThumbnail(outputFile.path).then(setOutputThumbnail)
    }

    // Get output file size if not provided
    if (!outputSize) {
      window.electronAPI.getFileInfo(outputFile.path).then(info => {
        if (info) setOutputSize(info.size)
      })
    }
  }, [sourceFile.path, sourceFile.ext, outputFile.path, outputSize])

  const sizeReduction = outputSize && sourceFile.size > 0
    ? ((sourceFile.size - outputSize) / sourceFile.size) * 100
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">File Comparison</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Source File */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-300">Original</h3>
            </div>

            {sourceThumbnail && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                <img
                  src={sourceThumbnail}
                  alt="Source preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2 p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Name:</span>
                <span className="text-zinc-300 font-medium truncate ml-2">{sourceFile.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Format:</span>
                <span className="text-zinc-300 font-mono uppercase">{sourceFile.ext}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Size:</span>
                <span className="text-zinc-300 font-medium">{formatFileSize(sourceFile.size)}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 border-2 border-violet-500/50 flex items-center justify-center">
              <ArrowRight size={24} className="text-violet-400" />
            </div>
          </div>

          {/* Output File */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon size={16} className="text-emerald-500" />
              <h3 className="text-sm font-medium text-zinc-300">Converted</h3>
            </div>

            {outputThumbnail && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-emerald-800/30 bg-zinc-950">
                <img
                  src={outputThumbnail}
                  alt="Output preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2 p-4 rounded-lg bg-zinc-950/50 border border-emerald-800/30">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Name:</span>
                <span className="text-zinc-300 font-medium truncate ml-2">{outputFile.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Format:</span>
                <span className="text-emerald-400 font-mono uppercase">
                  {outputFile.name.split('.').pop()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Size:</span>
                <span className="text-zinc-300 font-medium">
                  {outputSize ? formatFileSize(outputSize) : 'Calculating...'}
                </span>
              </div>
              {outputSize && sizeReduction !== 0 && (
                <div className="flex justify-between text-xs pt-2 border-t border-zinc-800">
                  <span className="text-zinc-500">Size change:</span>
                  <span className={`font-medium ${sizeReduction > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {sizeReduction > 0 ? '↓' : '↑'} {Math.abs(sizeReduction).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.electronAPI.showInFolder(outputFile.path)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Show in Folder
          </Button>
          <Button
            onClick={onClose}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
