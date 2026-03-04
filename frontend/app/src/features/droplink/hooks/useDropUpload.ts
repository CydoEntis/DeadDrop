import { useState, useCallback, useRef } from "react";
import type { CreateDropResponse } from "../types";
import { dropLinkService } from "../services";

const CONCURRENT_UPLOADS = 3;

interface UseDropUploadOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface PartResult {
  partNumber: number;
  eTag: string;
}

function uploadPartXHR(
  url: string,
  chunk: Blob,
  onProgress: (loaded: number) => void,
  signal: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const eTag = xhr.getResponseHeader("ETag");
        if (!eTag) {
          reject(new Error("No ETag in part upload response"));
          return;
        }
        resolve(eTag);
      } else {
        reject(new Error(`Part upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during part upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    const abortHandler = () => xhr.abort();
    signal.addEventListener("abort", abortHandler, { once: true });

    xhr.send(chunk);
  });
}

export function useDropUpload(options?: UseDropUploadOptions) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [eta, setEta] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const resumeResolverRef = useRef<(() => void) | null>(null);
  const uploadStateRef = useRef<{
    dropId: string;
    uploadId: string;
    file: File;
    partSize: number;
    completedParts: PartResult[];
    totalParts: number;
    completedBytes: number;
    inflightBytes: number[];
  } | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : "Upload failed";

      if (message.includes("aborted") || message.includes("AbortError")) return;

      let friendly = message;
      if (message.includes("413") || message.includes("too large"))
        friendly = "File exceeds the maximum allowed size.";
      else if (message.includes("storage limit"))
        friendly = "This invite code has reached its storage limit.";
      else if (message.includes("revoked"))
        friendly = "This invite code has been revoked.";
      else if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("Network error"))
        friendly = "Network error. Check your connection and try again.";
      else if (message.includes("timeout"))
        friendly = "Upload timed out. Check your connection and try again.";

      setIsUploading(false);
      setError(friendly);
      options?.onError?.(new Error(friendly));
    },
    [options]
  );

  const waitIfPaused = useCallback((): Promise<void> => {
    if (!isPausedRef.current) return Promise.resolve();
    return new Promise((resolve) => {
      resumeResolverRef.current = resolve;
    });
  }, []);

  const updateProgress = useCallback((state: NonNullable<typeof uploadStateRef.current>) => {
    const totalSent = state.completedBytes + state.inflightBytes.reduce((a, b) => a + b, 0);
    const pct = Math.min(Math.round((totalSent / state.file.size) * 100), 99);
    setProgress(pct);
  }, []);

  const startUpload = useCallback(
    async (file: File, dropResponse: CreateDropResponse) => {
      setIsUploading(true);
      setIsComplete(false);
      setError(null);
      setProgress(0);
      setUploadSpeed(0);
      setEta(null);
      isPausedRef.current = false;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const { uploadId, partSize } = await dropLinkService.initiateUpload(
          dropResponse.dropId
        );

        const totalParts = Math.ceil(file.size / partSize);

        const state = {
          dropId: dropResponse.dropId,
          uploadId,
          file,
          partSize,
          completedParts: [] as PartResult[],
          totalParts,
          completedBytes: 0,
          inflightBytes: new Array(CONCURRENT_UPLOADS).fill(0),
        };
        uploadStateRef.current = state;

        // Shared queue of part numbers — workers pull from this
        let nextPart = 1;
        let speedStartTime = Date.now();
        let speedStartBytes = 0;

        const worker = async (workerIndex: number): Promise<void> => {
          while (nextPart <= totalParts) {
            if (abortController.signal.aborted) return;
            await waitIfPaused();

            const partNumber = nextPart++;
            if (partNumber > totalParts) return;

            // Presign just-in-time so URLs are always fresh
            const { parts } = await dropLinkService.presignParts(
              state.dropId,
              state.uploadId,
              [partNumber]
            );
            const url = parts[0].url;

            const start = (partNumber - 1) * state.partSize;
            const end = Math.min(start + state.partSize, file.size);
            const chunk = file.slice(start, end);

            state.inflightBytes[workerIndex] = 0;

            const eTag = await uploadPartXHR(
              url,
              chunk,
              (loaded) => {
                state.inflightBytes[workerIndex] = loaded;
                updateProgress(state);

                const now = Date.now();
                const elapsed = (now - speedStartTime) / 1000;
                if (elapsed > 1) {
                  const totalSent = state.completedBytes + state.inflightBytes.reduce((a, b) => a + b, 0);
                  const bytesDiff = totalSent - speedStartBytes;
                  const speed = bytesDiff / elapsed;
                  setUploadSpeed(speed);
                  if (speed > 0) {
                    const remaining = file.size - totalSent;
                    setEta(Math.ceil(remaining / speed));
                  }
                  speedStartTime = now;
                  speedStartBytes = totalSent;
                }
              },
              abortController.signal
            );

            state.completedParts.push({ partNumber, eTag });
            state.completedBytes += chunk.size;
            state.inflightBytes[workerIndex] = 0;
            updateProgress(state);
          }
        };

        await Promise.all(
          Array.from({ length: CONCURRENT_UPLOADS }, (_, i) => worker(i))
        );

        if (abortController.signal.aborted) return;

        state.completedParts.sort((a, b) => a.partNumber - b.partNumber);
        await dropLinkService.completeUpload(
          state.dropId,
          state.uploadId,
          state.completedParts
        );

        setProgress(100);
        setIsUploading(false);
        setIsComplete(true);
        options?.onComplete?.();
      } catch (err) {
        handleError(err);
      }
    },
    [options, handleError, waitIfPaused, updateProgress]
  );

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsUploading(false);
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsUploading(true);
    setError(null);
    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }
  }, []);

  const abort = useCallback(async () => {
    abortControllerRef.current?.abort();
    isPausedRef.current = false;

    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }

    const state = uploadStateRef.current;
    if (state?.uploadId) {
      try {
        await dropLinkService.abortUpload(state.dropId, state.uploadId);
      } catch {
        // best effort
      }
    }

    uploadStateRef.current = null;
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
    eta,
    startUpload,
    pause,
    resume,
    abort,
  };
}
