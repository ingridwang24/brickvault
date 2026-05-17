import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && <label htmlFor={inputId} className="text-xs text-slate-400 font-medium">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500',
            'focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30',
            'disabled:opacity-50',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
