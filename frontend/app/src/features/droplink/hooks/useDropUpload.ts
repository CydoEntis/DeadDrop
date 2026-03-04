import { useState, useCallback, useRef } from "react";
import type { CreateDropResponse } from "../types";
import { dropLinkService } from "../services";

const CONCURRENT_UPLOADS = 3;
const PRESIGN_BATCH_SIZE = 10;

interface UseDropUploadOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface PartResult {
  partNumber: number;
  eTag: string;
}

interface PartJob {
  partNumber: number;
  url: string;
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

        // Presign all parts in batches
        const allJobs: PartJob[] = [];
        const allPartNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

        for (let i = 0; i < allPartNumbers.length; i += PRESIGN_BATCH_SIZE) {
          if (abortController.signal.aborted) return;

          const batch = allPartNumbers.slice(i, i + PRESIGN_BATCH_SIZE);
          const { parts } = await dropLinkService.presignParts(
            state.dropId,
            state.uploadId,
            batch
          );
          for (const p of parts) {
            allJobs.push({ partNumber: p.partNumber, url: p.url });
          }
        }

        let jobIndex = 0;
        let speedStartTime = Date.now();
        let speedStartBytes = 0;

        const worker = async (workerIndex: number): Promise<void> => {
          while (jobIndex < allJobs.length) {
            if (abortController.signal.aborted) return;
            await waitIfPaused();

            const idx = jobIndex++;
            if (idx >= allJobs.length) return;

            const job = allJobs[idx];
            const start = (job.partNumber - 1) * state.partSize;
            const end = Math.min(start + state.partSize, file.size);
            const chunk = file.slice(start, end);

            state.inflightBytes[workerIndex] = 0;

            const eTag = await uploadPartXHR(
              job.url,
              chunk,
              (loaded) => {
                state.inflightBytes[workerIndex] = loaded;
                updateProgress(state);

                const now = Date.now();
                const elapsed = (now - speedStartTime) / 1000;
                if (elapsed > 1) {
                  const totalSent = state.completedBytes + state.inflightBytes.reduce((a, b) => a + b, 0);
                  const bytesDiff = totalSent - speedStartBytes;
                  setUploadSpeed(bytesDiff / elapsed);
                  speedStartTime = now;
                  speedStartBytes = totalSent;
                }
              },
              abortController.signal
            );

            state.completedParts.push({ partNumber: job.partNumber, eTag });
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
    startUpload,
    pause,
    resume,
    abort,
  };
}
