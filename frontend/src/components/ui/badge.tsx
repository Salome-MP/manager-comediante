import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary/90 text-primary-foreground border-primary/20 [a&]:hover:bg-primary",
        secondary:
          "bg-overlay-medium text-foreground/80 border-border-strong [a&]:hover:bg-overlay-hover",
        destructive:
          "bg-destructive/20 text-red-400 border-destructive/20 [a&]:hover:bg-destructive/30 focus-visible:ring-destructive/20",
        outline:
          "border-border-hover text-foreground/70 bg-transparent [a&]:hover:bg-overlay-medium [a&]:hover:text-foreground",
        ghost:
          "bg-transparent text-foreground/60 border-transparent [a&]:hover:bg-overlay-medium [a&]:hover:text-foreground",
        link: "text-primary underline-offset-4 border-transparent [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
