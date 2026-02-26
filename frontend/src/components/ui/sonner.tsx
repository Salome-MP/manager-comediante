"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme === "light" ? "light" : "dark"}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-surface-card text-foreground border border-border-strong shadow-2xl shadow-[var(--shadow-color)] rounded-xl",
          title: "text-foreground font-medium text-sm",
          description: "text-muted-foreground text-xs",
          success:
            "border-emerald-500/20 bg-emerald-500/5 [&_[data-icon]]:text-emerald-400",
          error:
            "border-red-500/20 bg-red-500/5 [&_[data-icon]]:text-red-400",
          warning:
            "border-amber-500/20 bg-amber-500/5 [&_[data-icon]]:text-amber-400",
          info:
            "border-blue-500/20 bg-blue-500/5 [&_[data-icon]]:text-blue-400",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3 py-1.5 rounded-md",
          cancelButton:
            "bg-overlay-medium text-foreground/70 hover:bg-overlay-hover text-xs font-medium px-3 py-1.5 rounded-md border border-border-strong",
          closeButton:
            "bg-overlay-medium border border-border-strong text-foreground/60 hover:bg-overlay-hover hover:text-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--surface-card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border-strong)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
