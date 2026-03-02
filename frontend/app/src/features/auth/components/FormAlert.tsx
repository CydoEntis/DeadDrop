import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type FormAlertVariant = "error" | "success" | "warning" | "info";

interface FormAlertProps {
  message: string;
  variant?: FormAlertVariant;
}

const styles: Record<FormAlertVariant, string> = {
  error: "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive",
  success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  info: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

const icons: Record<FormAlertVariant, React.ReactNode> = {
  error: <AlertCircle className="h-4 w-4 shrink-0" />,
  success: <CheckCircle className="h-4 w-4 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
  info: <Info className="h-4 w-4 shrink-0" />,
};

export function FormAlert({ message, variant = "error" }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 text-sm", styles[variant])}
    >
      {icons[variant]}
      <span>{message}</span>
    </div>
  );
}
