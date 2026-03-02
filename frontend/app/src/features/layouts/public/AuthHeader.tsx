import { Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/AppLogo";

export function AuthHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <AppLogo className="h-7 w-auto" />
          <span className="text-sm font-bold tracking-wider">DeadDrop</span>
        </Link>
        <span className="text-xs text-muted-foreground">Secure file transfer</span>
      </div>
    </header>
  );
}
