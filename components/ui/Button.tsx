import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

const variants = {
  primary: 'bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-semibold',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
  ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
  danger: 'bg-red-900/40 text-red-400 hover:bg-red-900/60',
}

const sizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export default Button
