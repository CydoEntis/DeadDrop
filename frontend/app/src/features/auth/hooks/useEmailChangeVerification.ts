import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ErrorHoundClientError } from "@/lib/errors";
import { useVerifyEmailChange } from "@/features/auth/queries.password";

export function useEmailChangeVerification(token: string) {
  const navigate = useNavigate();
  const verifyEmailChange = useVerifyEmailChange();
  const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verify = async () => {
      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("Invalid or missing verification token");
        toast.error("Invalid verification link");
        return;
      }

      try {
        await verifyEmailChange.mutateAsync({ token });
        setVerificationStatus("success");
        toast.success("Email changed successfully!");

        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
      } catch (error) {
        setVerificationStatus("error");
        const ehError = error as ErrorHoundClientError;
        const message = ehError.message || "Email change verification failed. The link may have expired.";
        setErrorMessage(message);
        toast.error(message);
      }
    };

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    verificationStatus,
    errorMessage,
  };
}
