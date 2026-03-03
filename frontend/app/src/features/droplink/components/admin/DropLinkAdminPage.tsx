import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LinkIcon, FileDown, BarChart3 } from "lucide-react";
import { useDropLinkStats } from "../../queries";
import { InviteCodeList } from "./InviteCodeList";
import { CreateInviteCodeDialog } from "./CreateInviteCodeDialog";
import { DropsList } from "./DropsList";
import { AppLogo } from "@/components/AppLogo";
import { useLogout } from "@/features/auth/queries";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

type Tab = "invites" | "drops" | "stats";

export function DropLinkAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("invites");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: stats } = useDropLinkStats();
  const { mutate: logout } = useLogout();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <AppLogo className="h-7 w-auto" />
          <span className="text-primary font-bold tracking-widest">DeadDrop</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-xs hidden sm:inline">Control Console</span>
          <button
            onClick={() => logout()}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Nav (desktop) */}
        <nav className="hidden md:flex w-40 border-r border-border p-4 flex-col gap-1">
          <button
            onClick={() => setActiveTab("invites")}
            className={`text-left px-3 py-2 text-xs tracking-wider transition-colors ${
              activeTab === "invites"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Drop Links
          </button>
          <button
            onClick={() => setActiveTab("drops")}
            className={`text-left px-3 py-2 text-xs tracking-wider transition-colors ${
              activeTab === "drops"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Drops
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`text-left px-3 py-2 text-xs tracking-wider transition-colors ${
              activeTab === "stats"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            System Status
          </button>
        </nav>

        {/* Mobile Tab Bar */}
        <nav className="md:hidden border-b border-border flex">
          <button
            onClick={() => setActiveTab("invites")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs tracking-wider transition-colors border-b-2 ${
              activeTab === "invites"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Links
          </button>
          <button
            onClick={() => setActiveTab("drops")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs tracking-wider transition-colors border-b-2 ${
              activeTab === "drops"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <FileDown className="h-3.5 w-3.5" />
            Drops
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs tracking-wider transition-colors border-b-2 ${
              activeTab === "stats"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Status
          </button>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          {activeTab === "invites" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm tracking-widest text-muted-foreground">Drop Links</h2>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="text-xs border border-primary text-primary px-3 sm:px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  + Generate Link
                </button>
              </div>
              <InviteCodeList />
            </div>
          )}

          {activeTab === "drops" && (
            <div className="space-y-4">
              <h2 className="text-sm tracking-widest text-muted-foreground">Active Drops</h2>
              <DropsList />
            </div>
          )}

          {activeTab === "stats" && stats && (
            <div className="space-y-6">
              <h2 className="text-sm tracking-widest text-muted-foreground">System Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-4">
                  <h3 className="text-xs text-muted-foreground tracking-wider">Downloads</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last 24h</span>
                      <span className="text-primary">{stats.totalDownloads24h}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last 7d</span>
                      <span className="text-primary">{stats.totalDownloads7d}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last 30d</span>
                      <span className="text-primary">{stats.totalDownloads30d}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Transferred</span>
                      <span className="text-primary">{formatBytes(stats.totalBytesTransferred)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs text-muted-foreground tracking-wider">System</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Links</span>
                      <span className="text-primary">{stats.totalInviteCodesCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Active Links</span>
                      <span className="text-primary">{stats.activeInviteCodesCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Active Drops</span>
                      <span className="text-primary">{stats.activeDropsCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="text-primary">{formatBytes(stats.totalStorageUsedBytes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="border-t border-border px-4 sm:px-6 py-2 flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Drops</span>
          <span className="text-foreground">{stats?.activeDropsCount ?? 0}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Node</span>
          <span className="text-primary">Stable</span>
        </div>
      </footer>

      <CreateInviteCodeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
