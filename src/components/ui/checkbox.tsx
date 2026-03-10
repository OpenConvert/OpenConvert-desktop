import * as React from "react"
import { Check } from "lucide-react"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'checked'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        ref={ref as any}
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        onClick={() => onCheckedChange?.(!checked)}
        className={`peer h-4 w-4 shrink-0 rounded-sm border border-zinc-700 bg-zinc-900 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 data-[state=checked]:text-white transition-colors ${className}`}
        {...props as any}
      >
        {checked && (
          <span className="flex items-center justify-center text-current">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
