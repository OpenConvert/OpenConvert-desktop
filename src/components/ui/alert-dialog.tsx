import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: AlertDialogProps) {
  if (!open) return null

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-zinc-400 whitespace-pre-line">{description}</p>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && (
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-zinc-400 hover:text-zinc-200"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              className={variant === "destructive" ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
