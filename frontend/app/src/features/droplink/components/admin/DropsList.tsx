import { useState } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminDrops, useDeleteDrop } from "../../queries";
import { DROP_STATUS } from "../../constants";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const statusColor = (status: string) => {
  switch (status) {
    case DROP_STATUS.READY:
      return "text-emerald-400";
    case DROP_STATUS.UPLOADING:
    case DROP_STATUS.CREATED:
      return "text-yellow-400";
    case DROP_STATUS.DELETED:
    case DROP_STATUS.EXPIRED:
    case DROP_STATUS.FAILED:
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
};

export function DropsList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { data, isLoading } = useAdminDrops(
    page,
    20,
    statusFilter === "all" ? undefined : statusFilter
  );
  const deleteDrop = useDeleteDrop();

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDrop.mutateAsync(deleteId);
      toast.success("Drop deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete drop");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const drops = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-3 items-center">
        <span className="text-xs text-muted-foreground">Filter:</span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-muted border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All</option>
          {Object.values(DROP_STATUS).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">File</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Status</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Size</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Downloads</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Agent</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Expires</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs w-[80px]" />
            </tr>
          </thead>
          <tbody>
            {drops.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No drops found
                </td>
              </tr>
            )}
            {drops.map((drop) => (
              <tr key={drop.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 max-w-[200px] truncate normal-case">
                  {drop.originalFilename}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${statusColor(drop.status)}`}>
                    {drop.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {drop.sizeBytes ? formatBytes(drop.sizeBytes) : "-"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-primary">{drop.downloadCount}</span>
                  {drop.deleteAfterDownloads > 0 && (
                    <span className="text-muted-foreground">
                      {" "}/ {drop.deleteAfterDownloads}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {drop.inviteCodeLabel}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(drop.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {drop.status === DROP_STATUS.READY && (
                      <a
                        href={`/d/${drop.publicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors p-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteId(drop.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Delete drop and its file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-4 items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            &lt; prev
          </button>
          <span className="text-xs text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
            className="text-xs text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            next &gt;
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-sm font-bold">Delete drop?</h3>
            <p className="text-xs text-muted-foreground normal-case">
              This will permanently delete the file from the server. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs border border-border rounded hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs bg-destructive text-white rounded hover:bg-destructive/80 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
