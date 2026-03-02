import { useState, useEffect, useRef } from "react";
import { Download, Loader2, ShieldCheck } from "lucide-react";
import { useDropMetadata, useAuthorizeDownload } from "../queries";
import { dropLinkService } from "../services";
import { useExpiryCountdown } from "../hooks/useExpiryCountdown";
import { PasswordPrompt } from "./PasswordPrompt";
import { DropExpired } from "./DropExpired";

const CLEANUP_STEPS = [
  "Initiating secure download...",
  "Decrypting transfer channel...",
  "Delivering payload...",
  "Scrubbing transfer logs...",
  "Removing evidence of drop...",
  "Drop complete.",
];

interface DropDownloadPageProps {
  publicId: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function DropDownloadPage({ publicId }: DropDownloadPageProps) {
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [cleanupStep, setCleanupStep] = useState(-1);
  const [cleanupDone, setCleanupDone] = useState(false);
  const downloadTriggered = useRef(false);
  const {
    data: metadata,
    isLoading,
    error,
  } = useDropMetadata(publicId);
  const authorizeDownload = useAuthorizeDownload();
  const { timeLeft, isExpired } = useExpiryCountdown(
    metadata?.expiresAt ?? null
  );

  // Auto-trigger download once authorization token is obtained, then run cleanup animation
  useEffect(() => {
    if (downloadToken && !downloadTriggered.current) {
      downloadTriggered.current = true;
      const url = dropLinkService.getDownloadUrl(publicId, downloadToken);
      window.location.href = url;

      // Start cleanup animation sequence
      let step = 0;
      setCleanupStep(0);
      const interval = setInterval(() => {
        step++;
        if (step >= CLEANUP_STEPS.length) {
          clearInterval(interval);
          setCleanupDone(true);
        } else {
          setCleanupStep(step);
        }
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [downloadToken, publicId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    const errMessage = (error as { message?: string }).message ?? "";
    if (errMessage.includes("expired"))
      return <DropExpired type="expired" />;
    if (errMessage.includes("deleted"))
      return <DropExpired type="deleted" />;
    if (errMessage.includes("download limit"))
      return <DropExpired type="limit-reached" />;
    return <DropExpired type="not-found" />;
  }

  if (!metadata) return <DropExpired type="not-found" />;
  if (isExpired) return <DropExpired type="expired" />;

  const handlePasswordSubmit = async (password: string) => {
    const response = await authorizeDownload.mutateAsync({
      publicId,
      password,
    });
    setDownloadToken(response.token);
  };

  const handleNoPasswordDownload = async () => {
    const response = await authorizeDownload.mutateAsync({
      publicId,
      password: undefined,
    });
    setDownloadToken(response.token);
  };

  // Post-download cleanup animation
  if (cleanupStep >= 0) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-1">
          {cleanupDone ? (
            <>
              <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold tracking-wider text-emerald-400">
                Drop complete
              </h2>
              <p className="text-xs text-muted-foreground">
                All traces have been removed.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <h2 className="text-lg font-bold tracking-wider">
                Securing channel
              </h2>
            </>
          )}
        </div>

        <div className="border border-border rounded p-6">
          <div className="space-y-2 font-mono">
            {CLEANUP_STEPS.slice(0, cleanupStep + 1).map((step, i) => {
              const isCurrentStep = i === cleanupStep && !cleanupDone;
              const isComplete = i < cleanupStep || cleanupDone;
              return (
                <div
                  key={i}
                  className={`text-xs flex items-center gap-2 transition-opacity ${
                    isComplete
                      ? "text-emerald-400"
                      : isCurrentStep
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {isCurrentStep && !cleanupDone ? (
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  ) : (
                    <span className="w-3 text-center shrink-0">
                      {isComplete ? ">" : " "}
                    </span>
                  )}
                  <span className="normal-case">{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {cleanupDone && (
          <p className="text-xs text-muted-foreground/50 text-center normal-case">
            You may close this page.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold tracking-wider">Secure node</h2>
      </div>

      <div className="border border-border rounded p-6 space-y-5">
        {/* File info */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">File</span>
            <span className="text-primary normal-case">{metadata.originalFilename}</span>
          </div>
          {metadata.sizeBytes && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Size</span>
              <span className="text-primary">{formatBytes(metadata.sizeBytes)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Expires</span>
            <span className="text-foreground">{timeLeft}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Downloads</span>
            <span className="text-foreground">Single use</span>
          </div>
        </div>

        {metadata.requiresPassword ? (
          <PasswordPrompt
            onSubmit={handlePasswordSubmit}
            isPending={authorizeDownload.isPending}
          />
        ) : (
          <button
            onClick={handleNoPasswordDownload}
            disabled={authorizeDownload.isPending}
            className="w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authorizeDownload.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Initiate download
          </button>
        )}
      </div>
    </div>
  );
}
