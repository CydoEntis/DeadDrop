import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateInviteCode } from "../../queries";
import {
  createInviteCodeSchema,
  type CreateInviteCodeFormData,
} from "../../schemas";

interface CreateInviteCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildDropLink(code: string): string {
  const origin = window.location.origin;
  return `${origin}/drop?code=${encodeURIComponent(code)}`;
}

export function CreateInviteCodeDialog({
  open,
  onOpenChange,
}: CreateInviteCodeDialogProps) {
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createInvite = useCreateInviteCode();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInviteCodeFormData>({
    resolver: zodResolver(createInviteCodeSchema),
    defaultValues: {
      label: "",
    },
  });

  const onSubmit = async (data: CreateInviteCodeFormData) => {
    try {
      const maxBytes = data.maxTotalBytes
        ? data.maxTotalBytes * 1024 * 1024 * 1024
        : undefined;
      const response = await createInvite.mutateAsync({
        label: data.label,
        maxTotalBytes: maxBytes,
      });
      setCreatedCode(response.inviteCode);
    } catch {
      toast.error("Failed to create drop link");
    }
  };

  const handleCopy = async () => {
    if (!createdCode) return;
    const link = buildDropLink(createdCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleClose = () => {
    setCreatedCode(null);
    setCopied(false);
    reset();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded p-6 max-w-md w-full mx-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold">
              {createdCode ? "Link generated" : "Generate drop link"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 normal-case">
              {createdCode
                ? "Share this link with the person you want to receive files from. Link expires in 30 minutes."
                : "Generate a one-time link that allows someone to send you a file. Expires in 30 minutes."}
            </p>
          </div>

          {createdCode ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={buildDropLink(createdCode)}
                  readOnly
                  className="flex-1 bg-muted border border-border rounded px-3 py-2 text-xs normal-case font-mono text-foreground focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Agent name</label>
                <input
                  {...register("label")}
                  placeholder="e.g. Mike"
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors normal-case"
                />
                {errors.label && (
                  <p className="text-xs text-destructive normal-case">
                    {errors.label.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Max upload size (GB)</label>
                <input
                  {...register("maxTotalBytes", { valueAsNumber: true })}
                  type="number"
                  placeholder="10"
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-xs border border-border rounded hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvite.isPending}
                  className="flex-1 px-4 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createInvite.isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Generate link
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
