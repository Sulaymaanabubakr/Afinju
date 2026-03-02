import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-body font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-widest uppercase',
  {
    variants: {
      variant: {
        default:
          'bg-obsidian text-ivory hover:bg-neutral-800 border border-transparent hover:border-gold-500',
        gold:
          'bg-gold-500 text-obsidian hover:bg-gold-400 shadow-lg shadow-gold-500/20',
        outline:
          'border border-obsidian bg-transparent text-obsidian hover:bg-obsidian hover:text-ivory',
        'outline-gold':
          'border border-gold-500 bg-transparent text-gold-500 hover:bg-gold-500 hover:text-obsidian',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-gold-500 underline-offset-4 hover:underline p-0 h-auto',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ivory: 'bg-ivory text-obsidian hover:bg-white',
      },
      size: {
        default: 'h-11 px-8 py-2',
        sm: 'h-9 px-4',
        lg: 'h-14 px-12 text-base',
        xl: 'h-16 px-16 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
