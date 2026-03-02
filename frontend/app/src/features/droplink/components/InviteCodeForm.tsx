import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useVerifyInvite } from "../queries";
import { inviteCodeSchema, type InviteCodeFormData } from "../schemas";
import type { InviteVerifyResponse } from "../types";

interface InviteCodeFormProps {
  onVerified: (code: string, response: InviteVerifyResponse) => void;
}

export function InviteCodeForm({ onVerified }: InviteCodeFormProps) {
  const [error, setError] = useState<string | null>(null);
  const verifyInvite = useVerifyInvite();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteCodeFormData>({
    resolver: zodResolver(inviteCodeSchema),
  });

  const onSubmit = async (data: InviteCodeFormData) => {
    setError(null);
    try {
      const response = await verifyInvite.mutateAsync(data.code);
      onVerified(data.code, response);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Invalid invite code");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold tracking-wider">Enter invite code</h2>
        <p className="text-xs text-muted-foreground">
          You need an invite code to upload files
        </p>
      </div>

      <div className="border border-border rounded p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("code")}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full bg-muted border border-border rounded px-4 py-3 text-center font-mono text-sm tracking-widest text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors normal-case"
              autoFocus
            />
            {errors.code && (
              <p className="text-xs text-destructive mt-2 normal-case">
                {errors.code.message}
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-2 normal-case">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={verifyInvite.isPending}
            className="w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verifyInvite.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Verify code
          </button>
        </form>
      </div>
    </div>
  );
}
