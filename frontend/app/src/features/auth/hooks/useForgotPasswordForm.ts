import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { applyServerErrorsToForm, isRateLimitError, type ErrorHoundClientError } from "@/lib/errors";
import { useForgotPassword } from "@/features/auth/queries.password";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/features/auth/schemas";

export function useForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const forgotPassword = useForgotPassword();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword.mutateAsync(data);
      setSubmittedEmail(data.email);
      setSubmitted(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      const ehError = error as ErrorHoundClientError;

      if (isRateLimitError(ehError)) {
        toast.error(ehError.message || "Too many attempts. Please try again later.");
        return;
      }

      if (!applyServerErrorsToForm(ehError, form.setError)) {
        toast.error(ehError.message || "Failed to send reset email. Please try again.");
      }
    }
  };

  return {
    form,
    onSubmit,
    submitted,
    submittedEmail,
  };
}
