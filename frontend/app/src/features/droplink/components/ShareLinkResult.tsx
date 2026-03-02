import { useState } from "react";
import { Check, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useExpiryCountdown } from "../hooks/useExpiryCountdown";
import type { CreateDropResponse } from "../types";

interface ShareLinkResultProps {
  dropResponse: CreateDropResponse;
  hasPassword: boolean;
}

export function ShareLinkResult({
  dropResponse,
  hasPassword,
}: ShareLinkResultProps) {
  const [copied, setCopied] = useState(false);
  const { timeLeft } = useExpiryCountdown(dropResponse.expiresAt);

  const shareUrl = `${window.location.origin}/d/${dropResponse.publicId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold tracking-wider text-emerald-400">
          Drop successful
        </h2>
        <p className="text-xs text-muted-foreground">Transfer complete.</p>
      </div>

      <div className="border border-border rounded p-6 space-y-5">
        {/* Share URL */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Download link</label>
          <div className="flex gap-2">
            <input
              value={shareUrl}
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
        </div>

        {/* Info */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires in</span>
            <span className="text-foreground">{timeLeft}</span>
          </div>
          {hasPassword && (
            <div className="flex items-center gap-2 text-amber-400 mt-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="normal-case">
                Remember to share the password separately!
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
