import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { InviteCodeForm } from "@/features/droplink/components/InviteCodeForm";
import { DropUploadForm } from "@/features/droplink/components/DropUploadForm";
import { AppLogo } from "@/components/AppLogo";
import { dropLinkService } from "@/features/droplink/services";
import type { InviteVerifyResponse } from "@/features/droplink/types";
import type { ErrorHoundClientError } from "@/lib/errors";
import { z } from "zod";

const dropSearchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/drop/")(({
  component: DropPage,
  validateSearch: dropSearchSchema,
}));

function DropPage() {
  const { code: urlCode } = Route.useSearch();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteVerifyResponse | null>(
    null
  );
  const [autoVerifying, setAutoVerifying] = useState(!!urlCode);
  const [autoVerifyError, setAutoVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (urlCode && !inviteCode) {
      setAutoVerifying(true);
      dropLinkService
        .verifyInvite(urlCode)
        .then((response) => {
          setInviteCode(urlCode);
          setInviteInfo(response);
        })
        .catch((err: ErrorHoundClientError) => {
          setAutoVerifyError(err.message || "This drop link is invalid or has expired.");
        })
        .finally(() => {
          setAutoVerifying(false);
        });
    }
  }, [urlCode]);

  const handleVerified = (code: string, response: InviteVerifyResponse) => {
    setInviteCode(code);
    setInviteInfo(response);
  };

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

      <main className="container mx-auto px-4 py-12">
        {autoVerifying ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Verifying drop link...</p>
          </div>
        ) : autoVerifyError ? (
          <div className="flex flex-col items-center gap-4 py-12 max-w-md mx-auto text-center">
            <p className="text-sm text-destructive font-medium normal-case">{autoVerifyError}</p>
            <p className="text-xs text-muted-foreground normal-case">
              Contact the person who sent you this link for a new one.
            </p>
          </div>
        ) : inviteCode && inviteInfo ? (
          <DropUploadForm
            inviteCode={inviteCode}
            inviteInfo={inviteInfo}
          />
        ) : (
          <InviteCodeForm onVerified={handleVerified} />
        )}
      </main>
    </div>
  );
}
