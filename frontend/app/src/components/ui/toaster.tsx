import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react"
import { useTheme } from "@/features/theme/ThemeProvider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      visibleToasts={3}
      icons={{
        success: <CircleCheck className="h-5 w-5 text-emerald-500" />,
        error: <CircleX className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <TriangleAlert className="h-5 w-5 text-amber-500" />,
      }}
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        },
        classNames: {
          toast: "group toast group-[.toaster]:!shadow-lg",
          description: "group-[.toast]:!text-muted-foreground",
          actionButton:
            "group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground",
          cancelButton:
            "group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
