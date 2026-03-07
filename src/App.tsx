import { useState, useCallback } from 'react'
import { FolderOutput, Zap, Settings2, Image, FileText, Film, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import Titlebar from '@/components/Titlebar'
import DropZone from '@/components/DropZone'
import FileList from '@/components/FileList'
import type { ConvertFile } from '@/components/FileList'
import { getTargetFormats, getFileCategory } from '@/lib/formats'

function App() {
  const [files, setFiles] = useState<ConvertFile[]>([])
  const [outputDir, setOutputDir] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

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

    // Snapshot file IDs to avoid stale closure issues if files array changes during conversion
    const fileIds = files.map((f) => f.id)

    try {
      // Simulate conversion progress for each file
      for (const fileId of fileIds) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: 'converting' as const, progress: 0 } : f))
        )

        // Simulate progress
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

  // Stats
  const categoryCounts = files.reduce<Record<string, number>>((acc, f) => {
    const cat = getFileCategory(f.ext) ?? 'other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const doneCount = files.filter((f) => f.status === 'done').length

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-[#0a0a0b] text-white overflow-hidden">
        <Titlebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
              {/* Hero header */}
              <div className="text-center mb-2">
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
              <DropZone onFilesAdded={handleFilesAdded} />

              {/* File list */}
              <FileList
                files={files}
                onRemoveFile={handleRemoveFile}
                onTargetFormatChange={handleTargetFormatChange}
                onClearAll={handleClearAll}
              />
            </div>
          </div>

          {/* Bottom action bar */}
          {files.length > 0 && (
            <>
              <Separator className="bg-zinc-800/50" />
              <div className="flex-shrink-0 px-6 py-4 bg-[#0a0a0b]/95 backdrop-blur-xl border-t border-zinc-800/30">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
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
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
