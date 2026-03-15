import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getFileCategory } from '@/config/formats'

interface EditMetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  fileExt: string
  filePath: string
  metadata: FileMetadata
  onSave: (metadata: FileMetadata) => void
}

export function EditMetadataDialog({
  open,
  onOpenChange,
  fileName,
  fileExt,
  filePath,
  metadata,
  onSave
}: EditMetadataDialogProps) {
  const [formData, setFormData] = useState<FileMetadata>(metadata)
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  const category = getFileCategory(fileExt)

  // Load thumbnail when dialog opens
  useEffect(() => {
    if (open && (category === 'video' || category === 'image')) {
      loadThumbnail()
    }
  }, [open, filePath])

  // Reset form when metadata changes
  useEffect(() => {
    setFormData(metadata)
  }, [metadata])

  const loadThumbnail = async () => {
    try {
      if (category === 'image') {
        // For images, use the image itself as thumbnail
        setThumbnail(`file://${filePath}`)
      } else if (category === 'video') {
        // For videos, generate thumbnail
        const thumb = await window.electronAPI.generateThumbnail(filePath)
        setThumbnail(thumb)
      }
    } catch (error) {
      console.error('Failed to load thumbnail:', error)
    }
  }

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const handleChange = (field: keyof FileMetadata, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || undefined
    }))
  }

  if (!open) return null

  // Determine which fields to show based on file category
  const showVideoFields = category === 'video' || category === 'audio'
  const showImageFields = category === 'image'
  const showAudioFields = category === 'audio'

  // Get recommended thumbnail dimensions
  const getRecommendedDimensions = () => {
    if (category === 'image') return '1920×1080 or smaller'
    if (category === 'video') return '1280×720 recommended'
    return ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative z-50 w-full max-w-4xl h-[85vh] bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Edit Metadata</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{fileName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Thumbnail Preview */}
          <div className="w-80 border-r border-zinc-800 bg-zinc-950/30 p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Preview</h3>
              <div className="aspect-video bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-zinc-600">
                    <Info size={32} className="mx-auto mb-2" />
                    <p className="text-xs">No preview available</p>
                  </div>
                )}
              </div>
            </div>

            {getRecommendedDimensions() && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-300">Recommended Size</p>
                    <p className="text-xs text-blue-400/80 mt-0.5">{getRecommendedDimensions()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1" />

            <div className="text-xs text-zinc-500">
              <p className="mb-1">Category: <span className="text-zinc-400 capitalize">{category}</span></p>
              <p>Format: <span className="text-zinc-400 uppercase">{fileExt}</span></p>
            </div>
          </div>

          {/* Right: Metadata Fields */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Common Fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-300">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs text-zinc-400">Title</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Enter title"
                      className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs text-zinc-400">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Enter description"
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment" className="text-xs text-zinc-400">Comment</Label>
                    <Input
                      id="comment"
                      type="text"
                      value={formData.comment || ''}
                      onChange={(e) => handleChange('comment', e.target.value)}
                      placeholder="Add a comment"
                      className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* Audio/Video Fields */}
                {(showVideoFields || showAudioFields) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-300">
                      {showAudioFields ? 'Audio Metadata' : 'Media Information'}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="artist" className="text-xs text-zinc-400">Artist</Label>
                        <Input
                          id="artist"
                          type="text"
                          value={formData.artist || ''}
                          onChange={(e) => handleChange('artist', e.target.value)}
                          placeholder="Artist name"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="album" className="text-xs text-zinc-400">Album</Label>
                        <Input
                          id="album"
                          type="text"
                          value={formData.album || ''}
                          onChange={(e) => handleChange('album', e.target.value)}
                          placeholder="Album name"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="composer" className="text-xs text-zinc-400">Composer</Label>
                        <Input
                          id="composer"
                          type="text"
                          value={formData.composer || ''}
                          onChange={(e) => handleChange('composer', e.target.value)}
                          placeholder="Composer name"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="genre" className="text-xs text-zinc-400">Genre</Label>
                        <Input
                          id="genre"
                          type="text"
                          value={formData.genre || ''}
                          onChange={(e) => handleChange('genre', e.target.value)}
                          placeholder="Genre"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-xs text-zinc-400">Date</Label>
                        <Input
                          id="date"
                          type="text"
                          value={formData.date || ''}
                          onChange={(e) => handleChange('date', e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>

                      {showVideoFields && (
                        <div className="space-y-2">
                          <Label htmlFor="copyright" className="text-xs text-zinc-400">Copyright</Label>
                          <Input
                            id="copyright"
                            type="text"
                            value={formData.copyright || ''}
                            onChange={(e) => handleChange('copyright', e.target.value)}
                            placeholder="Copyright notice"
                            className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Fields */}
                {showImageFields && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-300">Image Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="author" className="text-xs text-zinc-400">Author</Label>
                        <Input
                          id="author"
                          type="text"
                          value={formData.author || ''}
                          onChange={(e) => handleChange('author', e.target.value)}
                          placeholder="Author/photographer name"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="copyright" className="text-xs text-zinc-400">Copyright</Label>
                        <Input
                          id="copyright"
                          type="text"
                          value={formData.copyright || ''}
                          onChange={(e) => handleChange('copyright', e.target.value)}
                          placeholder="Copyright notice"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-xs text-zinc-400">Date Taken</Label>
                        <Input
                          id="date"
                          type="text"
                          value={formData.date || ''}
                          onChange={(e) => handleChange('date', e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="border-t border-zinc-800 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
              >
                Save Metadata
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
