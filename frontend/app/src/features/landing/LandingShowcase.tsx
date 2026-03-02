import {
  Lock,
  Zap,
  Clock,
  Shield,
  Upload,
  Terminal,
  Download,
  Github,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/AppLogo";
import type { LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Upload,
    title: "Resumable uploads",
    description:
      "TUS protocol for chunked, resumable file uploads. Connection drops? Pick up where you left off.",
  },
  {
    icon: Lock,
    title: "Password protection",
    description:
      "Optionally lock drops with a password. Only people with the password can download.",
  },
  {
    icon: Clock,
    title: "Auto-expiring links",
    description:
      "Every drop has a TTL. Files are automatically purged from disk when they expire.",
  },
  {
    icon: Shield,
    title: "Self-destructing",
    description:
      "Set a download limit. File is permanently deleted after the limit is hit.",
  },
  {
    icon: Terminal,
    title: "Invite-only access",
    description:
      "No public sign-up. The operator generates invite keys and controls who can upload.",
  },
  {
    icon: Zap,
    title: "Zero accounts",
    description:
      "Uploaders don't need an account. Enter an invite code, drop a file, get a link.",
  },
];


const SCREENSHOTS = [
  { label: "Admin console", src: "/screenshots/admin-console.png", description: "Generate and manage invite keys, monitor active drops" },
  { label: "Drop terminal", src: "/screenshots/drop-terminal.png", description: "Drag-and-drop upload with expiration and self-destruct settings" },
  { label: "Transfer active", src: "/screenshots/transfer-active.png", description: "Resumable chunked upload with real-time progress" },
  { label: "Secure node", src: "/screenshots/secure-node.png", description: "Password-protected download page with expiry countdown" },
];

export function LandingShowcase() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AppLogo className="h-7 w-auto" />
            <span className="text-sm font-bold tracking-wider">DeadDrop</span>
          </Link>
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Operator login
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 sm:py-32 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-1 rounded text-xs text-primary">
              <Terminal className="h-3.5 w-3.5" />
              Invite-only file sharing
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Drop files.{" "}
              <span className="text-primary">Share links.</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed normal-case">
              A private, self-hosted file sharing tool. Generate invite keys for trusted contacts,
              they upload files without creating an account, you get a download link. Files auto-expire
              and self-destruct.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <a
                href="#screenshots"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                See how it works
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-medium border border-border rounded hover:bg-muted transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                View source
              </a>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24 px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs text-muted-foreground font-medium tracking-widest mb-10 text-center">
              How it works
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mx-auto">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">Step 01</div>
                <h3 className="text-sm font-bold">Generate invite key</h3>
                <p className="text-xs text-muted-foreground normal-case leading-relaxed">
                  The operator creates an invite key from the admin console with usage limits
                  and expiration.
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mx-auto">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">Step 02</div>
                <h3 className="text-sm font-bold">Agent uploads file</h3>
                <p className="text-xs text-muted-foreground normal-case leading-relaxed">
                  The recipient opens the invite link, drops a file, and configures expiration
                  and self-destruct settings.
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mx-auto">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">Step 03</div>
                <h3 className="text-sm font-bold">Download & expire</h3>
                <p className="text-xs text-muted-foreground normal-case leading-relaxed">
                  A secure download link is generated. The file auto-deletes after the TTL
                  expires or download limit is reached.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshots */}
        <section id="screenshots" className="py-16 sm:py-24 px-6 border-t border-border scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs text-muted-foreground font-medium tracking-widest mb-10 text-center">
              Screenshots
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SCREENSHOTS.map((screenshot) => (
                <div key={screenshot.label} className="border border-border rounded overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <img
                      src={screenshot.src}
                      alt={screenshot.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.innerHTML = `<span class="text-xs text-muted-foreground">${screenshot.label}</span>`;
                      }}
                    />
                  </div>
                  <div className="px-4 py-3">
                    <h3 className="text-xs font-bold mb-1">{screenshot.label}</h3>
                    <p className="text-xs text-muted-foreground normal-case">{screenshot.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs text-muted-foreground font-medium tracking-widest mb-10 text-center">
              Features
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="border border-border rounded p-5 hover:border-primary/50 transition-colors"
                >
                  <feature.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="text-sm font-bold mb-2">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed normal-case">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
