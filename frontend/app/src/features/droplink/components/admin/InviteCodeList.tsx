import { useState } from "react";
import { Copy, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminInviteCodes, useRevokeInviteCode, useDeleteInviteCode } from "../../queries";
import type { InviteCodeResponse } from "../../types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function buildDropLink(code: string): string {
  const origin = window.location.origin;
  return `${origin}/drop?code=${encodeURIComponent(code)}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) return "expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) return `${days}d ${remainingHours}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(diffMs / (1000 * 60));
  return `${minutes}m`;
}

function isUsed(invite: InviteCodeResponse): boolean {
  return (
    (invite.maxDropCount != null && invite.usedDropCount >= invite.maxDropCount) ||
    (invite.maxTotalBytes != null && invite.usedTotalBytes >= invite.maxTotalBytes)
  );
}

function getInviteStatus(invite: InviteCodeResponse): {
  label: string;
  className: string;
} {
  if (invite.isRevoked) {
    return { label: "Revoked", className: "text-orange-400" };
  }
  if (isUsed(invite)) {
    return { label: "Used", className: "text-muted-foreground" };
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { label: "Expired", className: "text-muted-foreground" };
  }
  return { label: "Active", className: "text-emerald-400" };
}

export function InviteCodeList() {
  const [page, setPage] = useState(1);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data, isLoading } = useAdminInviteCodes(page);
  const revokeInvite = useRevokeInviteCode();
  const deleteInvite = useDeleteInviteCode();

  const handleCopyLink = async (invite: { id: string; code: string }) => {
    try {
      await navigator.clipboard.writeText(buildDropLink(invite.code));
      setCopiedId(invite.id);
      toast.success("Link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    setRevoking(true);
    try {
      await revokeInvite.mutateAsync(revokeId);
      toast.success("Invite code revoked");
      setRevokeId(null);
    } catch {
      toast.error("Failed to revoke invite code");
    } finally {
      setRevoking(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteInvite.mutateAsync(deleteId);
      toast.success("Invite code deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete invite code");
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

  const invites = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Agent</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Status</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Data used</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Expires</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No drop links generated yet
                </td>
              </tr>
            )}
            {invites.map((invite) => {
              const status = getInviteStatus(invite);
              const isActive = status.label === "Active";
              const used = isUsed(invite);

              return (
                <tr key={invite.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{invite.label}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="text-primary">{formatBytes(invite.usedTotalBytes)}</span>
                    {invite.maxTotalBytes && (
                      <span> / {formatBytes(invite.maxTotalBytes)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {used
                      ? "—"
                      : invite.expiresAt
                        ? formatRelativeTime(invite.expiresAt)
                        : "never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {isActive && (
                        <button
                          onClick={() => handleCopyLink(invite)}
                          className="text-primary hover:text-primary/80 transition-colors p-1"
                          title="Copy drop link"
                        >
                          {copiedId === invite.id ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => setRevokeId(invite.id)}
                          className="text-xs text-destructive hover:text-destructive/80 transition-colors px-2 py-1"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(invite.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Delete drop link and its files"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {/* Revoke Confirmation */}
      {revokeId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-sm font-bold">Revoke drop link?</h3>
            <p className="text-xs text-muted-foreground normal-case">
              This will immediately prevent any new uploads using this invite code. Existing drops will not be affected.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRevokeId(null)}
                className="px-4 py-2 text-xs border border-border rounded hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="px-4 py-2 text-xs bg-destructive text-white rounded hover:bg-destructive/80 transition-colors disabled:opacity-50"
              >
                {revoking ? "Revoking..." : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-sm font-bold">Delete drop link?</h3>
            <p className="text-xs text-muted-foreground normal-case">
              This will permanently delete the drop link and all associated files. This action cannot be undone.
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
