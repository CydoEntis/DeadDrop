import { useState, useRef, useCallback } from "react";
import { Upload, FileIcon, Lock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateDrop } from "../queries";
import { useDropUpload } from "../hooks/useDropUpload";
import { UploadProgress } from "./UploadProgress";
import { ShareLinkResult } from "./ShareLinkResult";
import type { InviteVerifyResponse, CreateDropResponse } from "../types";

interface DropUploadFormProps {
  inviteCode: string;
  inviteInfo: InviteVerifyResponse;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function DropUploadForm({
  inviteCode,
  inviteInfo,
}: DropUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [dropResponse, setDropResponse] = useState<CreateDropResponse | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createDrop = useCreateDrop();
  const upload = useDropUpload({
    onComplete: () => {
      toast.success("Upload complete!");
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    if (
      inviteInfo.limits.maxBytesPerDrop &&
      selectedFile.size > inviteInfo.limits.maxBytesPerDrop
    ) {
      toast.error(
        `File too large. Maximum size: ${formatBytes(inviteInfo.limits.maxBytesPerDrop)}`
      );
      return;
    }
    setFile(selectedFile);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [inviteInfo.limits.maxBytesPerDrop]
  );

  const handleStartUpload = async () => {
    if (!file) return;

    try {
      const response = await createDrop.mutateAsync({
        inviteCode,
        ttlSeconds: 1800,
        password: usePassword ? password : undefined,
        deleteAfterDownloads: 1,
        originalFilename: file.name,
        contentType: file.type || undefined,
      });

      setDropResponse(response);
      upload.startUpload(file, response);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to create drop");
    }
  };

  // Show share link after upload completes
  if (upload.isComplete && dropResponse) {
    return (
      <ShareLinkResult
        dropResponse={dropResponse}
        hasPassword={usePassword && password.length > 0}
      />
    );
  }

  // Show progress during upload
  if (upload.isUploading || (upload.progress > 0 && !upload.isComplete)) {
    return (
      <UploadProgress
        filename={file?.name ?? ""}
        fileSize={file?.size ?? 0}
        progress={upload.progress}
        speed={upload.uploadSpeed}
        error={upload.error}
        isUploading={upload.isUploading}
        onPause={upload.pause}
        onResume={upload.resume}
        onAbort={upload.abort}
      />
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold tracking-wider">Drop terminal</h2>
        <p className="text-xs text-muted-foreground">
          Agent: <span className="text-primary">{inviteInfo.label}</span>
        </p>
      </div>

      {/* File Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded p-10 cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : file
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-border hover:border-primary/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />
        {file ? (
          <div className="flex items-center gap-3">
            <FileIcon className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="text-sm font-medium normal-case">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground">
              Drag file to initiate transfer
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 text-xs border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              Select file
            </button>
            {inviteInfo.limits.maxBytesPerDrop && (
              <p className="text-xs text-muted-foreground/50 mt-2">
                Max: {formatBytes(inviteInfo.limits.maxBytesPerDrop)}
              </p>
            )}
          </>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={usePassword}
            onChange={(e) => setUsePassword(e.target.checked)}
            className="accent-primary"
          />
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Password protect</span>
        </label>
        {usePassword && (
          <input
            type="password"
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors normal-case"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground/50 text-center normal-case">
        File will self-destruct after 1 download or 30 minutes.
      </p>

      {/* Deploy Button */}
      <button
        disabled={!file || createDrop.isPending}
        onClick={handleStartUpload}
        className="w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {createDrop.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Deploy drop
      </button>
    </div>
  );
}
