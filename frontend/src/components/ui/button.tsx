import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20",
        destructive:
          "bg-destructive/80 text-white hover:bg-destructive focus-visible:ring-destructive/30 border border-destructive/20",
        outline:
          "border border-border-strong bg-overlay-light text-foreground hover:bg-overlay-strong hover:border-border-accent shadow-xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "text-foreground/70 hover:bg-overlay-light hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const sizeStr = size ?? "default"
  const isIcon = typeof sizeStr === "string" && sizeStr.startsWith("icon")
  const showAurora = variant !== "ghost" && variant !== "link" && !isIcon

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const target = e.currentTarget
      const rect = target.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      target.style.setProperty("--aurora-x", `${x}%`)
      target.style.setProperty("--aurora-y", `${y}%`)
      if (typeof props.onPointerMove === "function") {
        props.onPointerMove(e as any)
      }
    },
    [props.onPointerMove]
  )

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size, className }),
        showAurora && "aurora-btn"
      )}
      {...props}
      {...(showAurora ? { onPointerMove: handlePointerMove } : {})}
    />
  )
}

export { Button, buttonVariants }
