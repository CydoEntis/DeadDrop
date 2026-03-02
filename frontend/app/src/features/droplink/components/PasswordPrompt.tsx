import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Loader2 } from "lucide-react";
import { passwordSchema, type PasswordFormData } from "../schemas";

interface PasswordPromptProps {
  onSubmit: (password: string) => Promise<void>;
  isPending: boolean;
}

export function PasswordPrompt({ onSubmit, isPending }: PasswordPromptProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleFormSubmit = async (data: PasswordFormData) => {
    setError(null);
    try {
      await onSubmit(data.password);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Incorrect password");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Lock className="h-3.5 w-3.5" />
        <span>This file is password protected</span>
      </div>
      <div>
        <input
          {...register("password")}
          type="password"
          placeholder="Enter password"
          autoFocus
          className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors normal-case"
        />
        {errors.password && (
          <p className="text-xs text-destructive mt-1 normal-case">
            {errors.password.message}
          </p>
        )}
        {error && <p className="text-xs text-destructive mt-1 normal-case">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Authenticate
      </button>
    </form>
  );
}
