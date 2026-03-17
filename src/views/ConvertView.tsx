import { useState, useCallback, useRef, useEffect } from 'react'
import { FolderOutput, Zap, Settings2, Image, FileText, Film, Music, Plus, Trash2, Upload, ChevronDown, ChevronUp, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import DropZone from '@/components/DropZone'
import FileList from '@/components/FileList'
import type { ConvertFile } from '@/components/FileList'
import ImageOptimizationPanel from '@/components/ImageOptimizationPanel'
import MediaOptimizationPanel from '@/components/MediaOptimizationPanel'
import { PresetDialog } from '@/components/PresetDialog'
import { PresetDropdown } from '@/components/PresetDropdown'
import { EditMetadataDialog } from '@/components/EditMetadataDialog'
import { getTargetFormats, getFileCategory } from '@/lib/formats'
import { useSettings } from '@/contexts/SettingsContext'
import { QUALITY_LABELS, QUALITY_VALUES } from '@/lib/settings'
import type { QualityPreset, OverwriteBehavior } from '@/lib/settings'
import type { Preset } from '@/lib/presets'

interface ConvertViewProps {
  files: ConvertFile[]
  setFiles: React.Dispatch<React.SetStateAction<ConvertFile[]>>
  outputDir: string | null
  setOutputDir: React.Dispatch<React.SetStateAction<string | null>>
}

export default function ConvertView({ files, setFiles, outputDir, setOutputDir }: ConvertViewProps) {
  const { settings } = useSettings()
  const [isConverting, setIsConverting] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(settings.showAdvancedSettings)
  const [batchQuality, setBatchQuality] = useState<QualityPreset | null>(null) // null = use global setting
  const [batchOverwrite, setBatchOverwrite] = useState<OverwriteBehavior | null>(null)
  const [imageOptions, setImageOptions] = useState<ImageOptimizationOptions | undefined>(undefined)
  const [mediaOptions, setMediaOptions] = useState<MediaOptimizationOptions | undefined>(undefined)
  const [alertDialog, setAlertDialog] = useState<{ open: boolean; title: string; description: string } | null>(null)
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [editingMetadata, setEditingMetadata] = useState<string | null>(null) // File ID being edited
  const dragCounter = useRef(0)

  // Listen for real-time conversion progress from the main process
  useEffect(() => {
    const cleanup = window.electronAPI.onConversionProgress((data) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== data.fileId) return f
          return {
            ...f,
            progress: data.progress,
            status: data.status,
            error: data.error,
            currentOperation: data.currentOperation,
            eta: data.eta,
            startTime: data.startTime,
          }
        })
      )
    })
    return cleanup
  }, [setFiles])

  // Use default output dir from settings if none selected
  useEffect(() => {
    if (!outputDir && settings.defaultOutputDir) {
      setOutputDir(settings.defaultOutputDir)
    }
  }, [outputDir, settings.defaultOutputDir, setOutputDir])

  const handleFilesAdded = useCallback((newFiles: FileInfo[]) => {
    // Check file count limit
    const currentFileCount = files.length
    const maxFileCount = settings.maxFileCount
    const availableSlots = maxFileCount - currentFileCount
    
    if (currentFileCount >= maxFileCount) {
      setAlertDialog({
        open: true,
        title: 'Maximum File Limit Reached',
        description: `You have reached the maximum limit of ${maxFileCount} files. Please remove some files before adding more.`,
      })
      return
    }
    
    // Filter files based on size limit
    const maxFileSizeBytes = settings.maxFileSizeMB * 1024 * 1024
    const validFiles: FileInfo[] = []
    const oversizedFiles: string[] = []
    
    for (const file of newFiles) {
      if (file.size > maxFileSizeBytes) {
        oversizedFiles.push(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
      } else {
        validFiles.push(file)
      }
    }
    
    // Show warning for oversized files
    if (oversizedFiles.length > 0) {
      setAlertDialog({
        open: true,
        title: 'Files Exceed Size Limit',
        description: `The following files exceed the maximum size limit of ${settings.maxFileSizeMB} MB and were skipped:\n\n${oversizedFiles.join('\n')}`,
      })
    }
    
    // Limit to available slots
    const filesToAdd = validFiles.slice(0, availableSlots)
    
    if (filesToAdd.length < validFiles.length) {
      setAlertDialog({
        open: true,
        title: 'Partial Files Added',
        description: `Only ${filesToAdd.length} of ${validFiles.length} files can be added due to the maximum file limit (${maxFileCount} files total).`,
      })
    }
    
    if (filesToAdd.length === 0) {
      return
    }
    
    const convertFiles: ConvertFile[] = filesToAdd.map((f) => {
      const targets = getTargetFormats(f.ext)
      const qualityPreset = batchQuality || settings.conversionQuality
      const qualityValue = QUALITY_VALUES[qualityPreset]
      const category = getFileCategory(f.ext)
      
      return {
        id: `${f.path}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        path: f.path,
        name: f.name,
        ext: f.ext,
        size: f.size,
        targetFormat: targets[0] ?? 'png',
        status: 'pending' as const,
        progress: 0,
        quality: qualityValue,
        imageOptions: category === 'image' ? imageOptions : undefined,
      }
    })
    setFiles((prev) => [...prev, ...convertFiles])
  }, [setFiles, files.length, settings.maxFileCount, settings.maxFileSizeMB])

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [setFiles])

  const handleTargetFormatChange = useCallback((id: string, format: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, targetFormat: format } : f))
    )
  }, [setFiles])

  const handleReconvert = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => 
        f.id === id 
          ? { ...f, status: 'pending' as const, progress: 0, error: undefined, currentOperation: undefined, eta: undefined }
          : f
      )
    )
  }, [setFiles])

  const handleClearAll = useCallback(() => {
    setFiles([])
  }, [setFiles])

  const handleRenameFile = useCallback((id: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    )
  }, [setFiles])

  const handleAddMoreFiles = useCallback(async () => {
    try {
      const newFiles = await window.electronAPI.openFileDialog()
      if (newFiles.length > 0) handleFilesAdded(newFiles)
    } catch (err) {
      console.error('Failed to open file dialog:', err)
    }
  }, [handleFilesAdded])

  const handleAddFolder = useCallback(async () => {
    try {
      const newFiles = await window.electronAPI.openFolderDialog()
      if (newFiles.length > 0) handleFilesAdded(newFiles)
    } catch (err) {
      console.error('Failed to open folder dialog:', err)
    }
  }, [handleFilesAdded])

  const handleSelectPreset = useCallback((preset: Preset) => {
    const settings = preset.settings as any
    
    // Apply preset settings to all pending files
    setFiles((prev) =>
      prev.map((f) => {
        if (f.status !== 'pending') return f
        
        // Update target format
        const updated: ConvertFile = {
          ...f,
          targetFormat: settings.targetFormat,
        }
        
        // Apply video/audio settings if applicable
        if (settings.resolution || settings.videoBitrate || settings.videoCodec) {
          updated.mediaOptions = {
            resolution: settings.resolution,
            videoBitrate: settings.videoBitrate,
            audioBitrate: settings.audioBitrate,
            fps: settings.fps,
            codec: {
              video: settings.videoCodec,
              audio: settings.audioCodec,
            }
          }
        }
        
        // Apply image settings if applicable
        if (settings.width || settings.height || settings.quality) {
          updated.imageOptions = {
            resize: settings.width || settings.height ? {
              width: settings.width,
              height: settings.height,
              fit: settings.fit,
            } : undefined,
          }
          if (settings.quality) {
            updated.quality = settings.quality
          }
        }
        
        return updated
      })
    )
  }, [setFiles])

  const handleEditMetadata = useCallback((fileId: string) => {
    setEditingMetadata(fileId)
  }, [])

  const handleSaveMetadata = useCallback((fileId: string, metadata: FileMetadata) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, metadata } : f))
    )
  }, [setFiles])

  const handleSelectOutputDir = useCallback(async () => {
    try {
      const dir = await window.electronAPI.selectOutputDir()
      if (dir) setOutputDir(dir)
    } catch (err) {
      console.error('Failed to select output directory:', err)
    }
  }, [setOutputDir])

  const handleConvert = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    if (!outputDir) {
      setAlertDialog({
        open: true,
        title: 'Output Folder Required',
        description: 'Please select an output folder before converting files.',
      })
      return
    }

    setIsConverting(true)

    // Determine quality settings
    const qualityPreset = batchQuality ?? settings.conversionQuality
    const quality = QUALITY_VALUES[qualityPreset]
    const overwrite = batchOverwrite ?? settings.overwriteBehavior
    const concurrency = settings.concurrency

    // Build the payload with full file info for history
    const payload: ConvertPayload = {
      targetDirectory: outputDir,
      filesToConvert: pendingFiles.map((f) => ({
        sourcePath: f.path,
        sourceExt: f.ext,
        sourceName: f.name,
        sourceSize: f.size,
        targetFormat: f.targetFormat,
        fileId: f.id,
        imageOptions: f.imageOptions,
        mediaOptions: f.mediaOptions,
        metadata: f.metadata,
      })),
      quality,
      concurrency,
      overwriteBehavior: overwrite,
    }

    // Mark all pending files as converting
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'converting' as const, progress: 0 } : f
      )
    )

    try {
      const response = await window.electronAPI.convertFiles(payload)
      console.log('[ConvertView] Conversion response:', response)

      // Auto-open folder if setting is enabled and at least one succeeded
      if (settings.autoOpenFolder && response.results.some((r) => r.success)) {
        window.electronAPI.showInFolder(
          response.results.find((r) => r.success)?.outputPath ?? outputDir
        )
      }
    } catch (err) {
      console.error('Conversion failed:', err)
      // Mark all converting files as error
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'converting'
            ? { ...f, status: 'error' as const, error: 'Conversion process failed' }
            : f
        )
      )
    } finally {
      setIsConverting(false)
    }
  }, [files, outputDir, setFiles, batchQuality, batchOverwrite, settings])

  // --- Drag-and-drop handlers ---
  const processDroppedFiles = useCallback(async (e: React.DragEvent) => {
    console.log('[ConvertView] processDroppedFiles fired!', e.dataTransfer.files.length, 'files')
    e.preventDefault()
    dragCounter.current = 0
    setIsDraggingOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    console.log('[ConvertView] droppedFiles:', droppedFiles)
    if (droppedFiles.length === 0) {
      console.warn('[ConvertView] No files in drop event')
      return
    }

    try {
      const fileInfos: FileInfo[] = []

      for (const file of droppedFiles) {
        // Use webUtils.getPathForFile() - the modern Electron approach
        const filePath = window.electronAPI.getPathForFile(file)
        console.log('[ConvertView] Processing file:', file.name, 'path:', filePath)
        if (filePath) {
          const info = await window.electronAPI.getFileInfo(filePath)
          console.log('[ConvertView] Got file info:', info)
          if (info) fileInfos.push(info)
        } else {
          console.warn('[ConvertView] Could not get path for file:', file)
        }
      }

      console.log('[ConvertView] Final fileInfos:', fileInfos)
      if (fileInfos.length > 0) handleFilesAdded(fileInfos)
    } catch (err) {
      console.error('[ConvertView] Failed to process dropped files:', err)
    }
  }, [handleFilesAdded])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    console.log('[ConvertView] handleDragEnter, counter:', dragCounter.current)
    e.preventDefault()
    dragCounter.current += 1
    if (dragCounter.current === 1) {
      setIsDraggingOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    console.log('[ConvertView] handleDragLeave, counter:', dragCounter.current)
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDraggingOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    console.log('[ConvertView] handleDragOver')
    e.preventDefault()
  }, [])

  // Stats
  const categoryCounts = files.reduce<Record<string, number>>((acc, f) => {
    const cat = getFileCategory(f.ext) ?? 'other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const doneCount = files.filter((f) => f.status === 'done').length
  const errorCount = files.filter((f) => f.status === 'error').length

  return (
    <div
      className="relative flex flex-col flex-1 w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={processDroppedFiles}
    >
      {files.length === 0 ? (
        // ===== EMPTY STATE =====
        <div className="flex flex-col items-center justify-center h-full px-6 flex-1">
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
      ) : (
        // ===== POPULATED STATE =====
        <>
          {/* Top Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 flex-shrink-0">
            {/* Left side: Add More Files/Folder */}
            <div className="flex gap-2">
              <div className="flex gap-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddMoreFiles}
                  className="gap-2 bg-zinc-900 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all rounded-r-none border-r-0"
                >
                  <Plus size={14} />
                  Add Files
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 bg-zinc-900 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all rounded-l-none"
                    >
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-700">
                    <DropdownMenuItem onClick={handleAddMoreFiles} className="text-sm cursor-pointer">
                      <Plus size={14} className="mr-2" />
                      Add Files
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddFolder} className="text-sm cursor-pointer">
                      <Folder size={14} className="mr-2" />
                      Add Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Right side: File count + Clear all */}
            <div className="flex items-center gap-3">
              {errorCount > 0 && (
                <Badge variant="secondary" className="text-sm bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1.5">
                  {errorCount} failed
                </Badge>
              )}
              <Badge variant="secondary" className="text-sm bg-zinc-800 text-zinc-400 border-zinc-700 px-3 py-1.5">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </Badge>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={16} />
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
              onReconvert={handleReconvert}
              onEditMetadata={handleEditMetadata}
              onRenameFile={handleRenameFile}
            />
          </div>

          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <>
              <Separator className="bg-zinc-800/50" />
              <div className="flex-shrink-0 px-6 py-3 bg-zinc-950/80 border-t border-zinc-800/30">
                <div className="flex items-center gap-6">
                  {/* Quality */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Quality:</span>
                    <Select
                      value={batchQuality ?? settings.conversionQuality}
                      onValueChange={(val) => setBatchQuality(val as QualityPreset)}
                    >
                      <SelectTrigger className="w-[120px] h-7 text-xs bg-zinc-900 border-zinc-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {(Object.entries(QUALITY_LABELS) as [QualityPreset, { label: string; description: string }][]).map(
                          ([key, { label, description }]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              <span>{label}</span>
                              <span className="text-zinc-500 ml-1">- {description}</span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Overwrite behavior */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">If exists:</span>
                    <Select
                      value={batchOverwrite ?? settings.overwriteBehavior}
                      onValueChange={(val) => setBatchOverwrite(val as OverwriteBehavior)}
                    >
                      <SelectTrigger className="w-[130px] h-7 text-xs bg-zinc-900 border-zinc-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="rename" className="text-xs">Auto-rename</SelectItem>
                        <SelectItem value="skip" className="text-xs">Skip</SelectItem>
                        <SelectItem value="overwrite" className="text-xs">Overwrite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset to defaults */}
                  {(batchQuality || batchOverwrite || imageOptions || mediaOptions) && (
                    <button
                      onClick={() => {
                        setBatchQuality(null)
                        setBatchOverwrite(null)
                        setImageOptions(undefined)
                        setMediaOptions(undefined)
                      }}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      Reset to defaults
                    </button>
                  )}
                </div>

                {/* Image Optimization Options */}
                {files.some(f => getFileCategory(f.ext) === 'image') && (
                  <div className="mt-3">
                    <ImageOptimizationPanel
                      imageOptions={imageOptions}
                      onOptionsChange={setImageOptions}
                    />
                  </div>
                )}

                {/* Video Optimization Options */}
                {files.some(f => getFileCategory(f.ext) === 'video') && (
                  <div className="mt-3">
                    <MediaOptimizationPanel
                      mediaOptions={mediaOptions}
                      onOptionsChange={setMediaOptions}
                      type="video"
                    />
                  </div>
                )}

                {/* Audio Optimization Options */}
                {files.some(f => getFileCategory(f.ext) === 'audio') && (
                  <div className="mt-3">
                    <MediaOptimizationPanel
                      mediaOptions={mediaOptions}
                      onOptionsChange={setMediaOptions}
                      type="audio"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sticky Bottom Action Bar */}
          <Separator className="bg-zinc-800/50" />
          <div className="flex-shrink-0 px-6 py-4 bg-[#0a0a0b]/95 backdrop-blur-xl border-t border-zinc-800/30">
            <div className="flex items-center justify-between">
              {/* Left: presets + output dir + stats */}
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {/* Presets Button with dropdown */}
                  <PresetDropdown onSelectPreset={handleSelectPreset} />

                  {/* Select Output Folder with dropdown */}
                  <div className="flex gap-0">
                    <button
                      onClick={handleSelectOutputDir}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-300 transition-all rounded-r-none border-r-0"
                    >
                      <FolderOutput size={14} />
                      {outputDir ? (
                        <span className="max-w-[180px] truncate">{outputDir}</span>
                      ) : (
                        'Output folder'
                      )}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-300 transition-all rounded-l-none"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-700 text-zinc-300 min-w-[200px]">
                        <DropdownMenuItem 
                          onClick={() => setOutputDir('__same_as_source__')} 
                          className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                        >
                          <Folder size={14} className="mr-2" />
                          Same as source
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (settings.defaultOutputDir) {
                              setOutputDir(settings.defaultOutputDir)
                            }
                          }} 
                          className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                        >
                          <FolderOutput size={14} className="mr-2" />
                          Use default folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem 
                          onClick={handleSelectOutputDir} 
                          className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                        >
                          <Folder size={14} className="mr-2" />
                          Browse and select
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

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

              {/* Right: advanced toggle + convert button */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-zinc-500 hover:text-zinc-300 gap-1"
                >
                  <Settings2 size={16} />
                  {showAdvanced ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
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
        </>
      )}

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

      {/* Alert Dialog */}
      {alertDialog && (
        <AlertDialog
          open={alertDialog.open}
          onOpenChange={(open) => !open && setAlertDialog(null)}
          title={alertDialog.title}
          description={alertDialog.description}
        />
      )}

      {/* Preset Dialog */}
      <PresetDialog
        open={showPresetDialog}
        onOpenChange={setShowPresetDialog}
        onSelectPreset={handleSelectPreset}
      />

      {/* Edit Metadata Dialog */}
      {editingMetadata && (() => {
        const file = files.find(f => f.id === editingMetadata)
        if (!file) return null
        return (
          <EditMetadataDialog
            open={true}
            onOpenChange={(open) => !open && setEditingMetadata(null)}
            fileName={file.name}
            fileExt={file.ext}
            filePath={file.path}
            metadata={file.metadata || {}}
            onSave={(metadata) => handleSaveMetadata(file.id, metadata)}
          />
        )
      })()}
    </div>
  )
}
