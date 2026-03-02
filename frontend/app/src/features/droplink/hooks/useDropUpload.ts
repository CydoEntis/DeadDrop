import { useState, useCallback, useRef } from "react";
import * as tus from "tus-js-client";
import type { CreateDropResponse } from "../types";

interface UseDropUploadOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useDropUpload(options?: UseDropUploadOptions) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const uploadRef = useRef<tus.Upload | null>(null);
  const lastProgressRef = useRef<{ bytes: number; time: number } | null>(null);

  const startUpload = useCallback(
    (file: File, dropResponse: CreateDropResponse) => {
      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5135";
      const endpoint = `${baseUrl}${dropResponse.upload.endpoint}`;

      setIsUploading(true);
      setIsComplete(false);
      setError(null);
      setProgress(0);
      setUploadSpeed(0);
      lastProgressRef.current = { bytes: 0, time: Date.now() };

      const upload = new tus.Upload(file, {
        endpoint,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        chunkSize: 5 * 1024 * 1024, // 5 MB chunks
        metadata: {
          dropId: dropResponse.dropId,
          filename: file.name,
          filetype: file.type || "application/octet-stream",
        },
        onProgress: (bytesUploaded: number, bytesTotal: number) => {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(pct);

          // Calculate speed
          if (lastProgressRef.current) {
            const elapsed = (Date.now() - lastProgressRef.current.time) / 1000;
            if (elapsed > 0.5) {
              const bytesDiff =
                bytesUploaded - lastProgressRef.current.bytes;
              setUploadSpeed(bytesDiff / elapsed);
              lastProgressRef.current = {
                bytes: bytesUploaded,
                time: Date.now(),
              };
            }
          }
        },
        onSuccess: () => {
          setIsUploading(false);
          setIsComplete(true);
          setProgress(100);
          options?.onComplete?.();
        },
        onError: (err: Error) => {
          setIsUploading(false);
          setError(err.message || "Upload failed");
          options?.onError?.(err);
        },
      });

      uploadRef.current = upload;
      upload.start();
    },
    [options]
  );

  const pause = useCallback(() => {
    uploadRef.current?.abort();
    setIsUploading(false);
  }, []);

  const resume = useCallback(() => {
    if (uploadRef.current) {
      setIsUploading(true);
      setError(null);
      uploadRef.current.start();
    }
  }, []);

  const abort = useCallback(() => {
    uploadRef.current?.abort();
    uploadRef.current = null;
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setIsComplete(false);
  }, []);

  return {
    progress,
    isUploading,
    isComplete,
    error,
    uploadSpeed,
    startUpload,
    pause,
    resume,
    abort,
  };
}
