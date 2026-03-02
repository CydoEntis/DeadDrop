import { createFileRoute, Link } from "@tanstack/react-router";
import { DropDownloadPage } from "@/features/droplink/components/DropDownloadPage";
import { AppLogo } from "@/components/AppLogo";

export const Route = createFileRoute("/d/$publicId")({
  component: DownloadPage,
});

function DownloadPage() {
  const { publicId } = Route.useParams();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AppLogo className="h-7 w-auto" />
            <span className="text-sm font-bold tracking-wider">DeadDrop</span>
          </Link>
          <span className="text-xs text-muted-foreground">Secure file transfer</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex items-center justify-center">
        <DropDownloadPage publicId={publicId} />
      </main>
    </div>
  );
}
