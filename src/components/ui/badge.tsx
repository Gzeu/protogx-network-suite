import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-600 text-primary-foreground shadow hover:bg-primary-500',
        secondary:
          'border-transparent bg-secondary-600 text-secondary-foreground hover:bg-secondary-500',
        destructive:
          'border-transparent bg-red-600 text-white shadow hover:bg-red-500',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-600 text-white shadow hover:bg-green-500',
        warning:
          'border-transparent bg-yellow-600 text-white shadow hover:bg-yellow-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }