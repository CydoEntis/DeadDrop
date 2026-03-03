import { AlertCircle, X } from "lucide-react";

interface UploadProgressProps {
  filename: string;
  fileSize: number;
  progress: number;
  speed: number;
  error: string | null;
  isUploading: boolean;
  onPause: () => void;
  onResume: () => void;
  onAbort: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function UploadProgress({
  filename,
  fileSize,
  progress,
  speed,
  error,
  isUploading,
  onAbort,
}: UploadProgressProps) {
  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold tracking-wider">Transfer active</h2>
      </div>

      <div className="border border-border rounded p-6 space-y-5">
        {/* File info */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">File</span>
            <span className="text-primary normal-case">{filename}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Size</span>
            <span className="text-primary">{formatBytes(fileSize)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              <span className="text-foreground font-medium">{progress}%</span>
              {isUploading && " — receiving"}
            </span>
            {isUploading && speed > 0 && (
              <span>{formatSpeed(speed)}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="h-4 w-4" />
            <span className="normal-case">{error}</span>
          </div>
        )}

        <button
          onClick={onAbort}
          className="w-full px-4 py-2.5 text-xs font-medium border border-border rounded hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors flex items-center justify-center gap-2"
        >
          <X className="h-3.5 w-3.5" />
          Cancel transfer
        </button>
      </div>
    </div>
  );
}
