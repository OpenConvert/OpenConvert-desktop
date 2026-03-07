import { useState, useCallback, useRef } from 'react'
import { FolderOutput, Zap, Settings2, Image, FileText, Film, Music, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import DropZone from '@/components/DropZone'
import FileList from '@/components/FileList'
import type { ConvertFile } from '@/components/FileList'
import { getTargetFormats, getFileCategory } from '@/lib/formats'

export default function ConvertView() {
  const [files, setFiles] = useState<ConvertFile[]>([])
  const [outputDir, setOutputDir] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounter = useRef(0)

  const handleFilesAdded = useCallback((newFiles: FileInfo[]) => {
    const convertFiles: ConvertFile[] = newFiles.map((f) => {
      const targets = getTargetFormats(f.ext)
      return {
        id: `${f.path}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        path: f.path,
        name: f.name,
        ext: f.ext,
        size: f.size,
        targetFormat: targets[0] ?? 'png',
        status: 'pending' as const,
        progress: 0,
      }
    })
    setFiles((prev) => [...prev, ...convertFiles])
  }, [])

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleTargetFormatChange = useCallback((id: string, format: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, targetFormat: format } : f))
    )
  }, [])

  const handleClearAll = useCallback(() => {
    setFiles([])
  }, [])

  const handleAddMoreFiles = useCallback(async () => {
    try {
      const newFiles = await window.electronAPI.openFileDialog()
      if (newFiles.length > 0) handleFilesAdded(newFiles)
    } catch (err) {
      console.error('Failed to open file dialog:', err)
    }
  }, [handleFilesAdded])

  const handleSelectOutputDir = useCallback(async () => {
    try {
      const dir = await window.electronAPI.selectOutputDir()
      if (dir) setOutputDir(dir)
    } catch (err) {
      console.error('Failed to select output directory:', err)
    }
  }, [])

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return
    setIsConverting(true)

    const fileIds = files.map((f) => f.id)

    try {
      for (const fileId of fileIds) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: 'converting' as const, progress: 0 } : f))
        )

        for (let p = 0; p <= 100; p += 10) {
          await new Promise((r) => setTimeout(r, 80))
          setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress: p } : f))
          )
        }

        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: 'done' as const, progress: 100 } : f))
        )
      }
    } catch (err) {
      console.error('Conversion failed:', err)
    } finally {
      setIsConverting(false)
    }
  }, [files])

  // --- Global drag-and-drop handlers for populated state ---
  const processDroppedFiles = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDraggingOver(false)

    try {
      const droppedFiles = Array.from(e.dataTransfer.files)
      const fileInfos: FileInfo[] = []

      for (const file of droppedFiles) {
        const electronFile = file as ElectronFile
        const info = await window.electronAPI.getFileInfo(electronFile.path)
        if (info) fileInfos.push(info)
      }

      if (fileInfos.length > 0) handleFilesAdded(fileInfos)
    } catch (err) {
      console.error('Failed to process dropped files:', err)
    }
  }, [handleFilesAdded])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (dragCounter.current === 1) {
      setIsDraggingOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDraggingOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Stats
  const categoryCounts = files.reduce<Record<string, number>>((acc, f) => {
    const cat = getFileCategory(f.ext) ?? 'other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const doneCount = files.filter((f) => f.status === 'done').length

  // ===== EMPTY STATE =====
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="max-w-lg w-full flex flex-col items-center gap-6">
          {/* Hero header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Convert your files
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Images, documents, video & audio — fast and private
            </p>
          </div>

          {/* Format category pills */}
          <div className="flex items-center justify-center gap-2">
            {[
              { icon: Image, label: 'Images', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { icon: FileText, label: 'Docs', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              { icon: Film, label: 'Video', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { icon: Music, label: 'Audio', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${color} transition-all`}
              >
                <Icon size={12} />
                {label}
              </div>
            ))}
          </div>

          {/* Drop zone */}
          <div className="w-full">
            <DropZone onFilesAdded={handleFilesAdded} />
          </div>
        </div>
      </div>
    )
  }

  // ===== POPULATED STATE =====
  return (
    <div
      className="relative flex flex-col h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={processDroppedFiles}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 flex-shrink-0">
        {/* Left side: Add More Files */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddMoreFiles}
          className="gap-2 bg-zinc-900 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all"
        >
          <Plus size={14} />
          Add Files
        </Button>

        {/* Right side: File count + Clear all */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700 px-2.5 py-0.5">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </Badge>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
            Clear all
          </button>
        </div>
      </div>

      {/* File List — takes remaining vertical space */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <FileList
          files={files}
          onRemoveFile={handleRemoveFile}
          onTargetFormatChange={handleTargetFormatChange}
        />
      </div>

      {/* Sticky Bottom Action Bar */}
      <Separator className="bg-zinc-800/50" />
      <div className="flex-shrink-0 px-6 py-4 bg-[#0a0a0b]/95 backdrop-blur-xl border-t border-zinc-800/30">
        <div className="flex items-center justify-between">
          {/* Left: output dir + stats */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectOutputDir}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-300 transition-all"
            >
              <FolderOutput size={14} />
              {outputDir ? (
                <span className="max-w-[180px] truncate">{outputDir}</span>
              ) : (
                'Output folder'
              )}
            </button>

            <div className="flex items-center gap-3 text-xs text-zinc-600">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <span key={cat} className="capitalize">
                  {count} {cat}
                </span>
              ))}
              {doneCount > 0 && (
                <span className="text-emerald-500">
                  {doneCount}/{files.length} done
                </span>
              )}
            </div>
          </div>

          {/* Right: convert button */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-300"
            >
              <Settings2 size={16} />
            </Button>
            <Button
              onClick={handleConvert}
              disabled={pendingCount === 0 || isConverting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium px-6 shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:shadow-none transition-all duration-200"
            >
              <Zap size={16} className="mr-2" />
              {isConverting
                ? 'Converting...'
                : `Convert ${pendingCount} ${pendingCount === 1 ? 'file' : 'files'}`
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Global Drag Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0b]/80 backdrop-blur-sm border-2 border-dashed border-violet-500/50 rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <Upload className="w-7 h-7 text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">Drop files to add them</p>
              <p className="text-sm text-zinc-400 mt-1">Release to add to your conversion queue</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
