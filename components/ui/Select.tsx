import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && <label htmlFor={selectId} className="text-xs text-slate-400 font-medium">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200',
            'focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30',
            className
          )}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }
)
Select.displayName = 'Select'
export default Select
