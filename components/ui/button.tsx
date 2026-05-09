import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Solid gold — flat, clean, the day-to-day primary CTA.
        default:
          "bg-primary text-primary-foreground hover:brightness-110 active:brightness-95",
        // Gradient gold — the dressed-up CTA: hero buttons, conversion moments.
        // Only use when the action is the page's reason for existing.
        gold:
          "bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold-dim)] text-primary-foreground shadow-[0_2px_12px_rgba(201,168,76,0.25)] hover:shadow-[0_4px_18px_rgba(201,168,76,0.4)] hover:brightness-105 active:brightness-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground hover:border-[var(--border-emphasis)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[var(--bg-card)]",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-[var(--gold-light)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-sm",
        xl: "h-12 rounded-md px-8 text-sm tracking-[0.04em]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
