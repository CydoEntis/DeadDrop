interface DropExpiredProps {
  type: "expired" | "deleted" | "not-found" | "limit-reached";
}

const messages = {
  expired: {
    title: "Link expired",
    description: "This file has expired and is no longer available for download.",
  },
  deleted: {
    title: "File deleted",
    description: "This file has been deleted and is no longer available.",
  },
  "not-found": {
    title: "Not found",
    description: "This link doesn't exist or the file has been removed.",
  },
  "limit-reached": {
    title: "Download limit reached",
    description: "This file has reached its maximum number of downloads.",
  },
};

export function DropExpired({ type }: DropExpiredProps) {
  const msg = messages[type];

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold tracking-wider text-destructive">
          {msg.title}
        </h2>
      </div>

      <div className="border border-border rounded p-6 text-center">
        <p className="text-xs text-muted-foreground normal-case">
          {msg.description}
        </p>
      </div>
    </div>
  );
}
