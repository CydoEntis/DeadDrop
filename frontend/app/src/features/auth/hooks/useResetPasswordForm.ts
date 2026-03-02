import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { applyServerErrorsToForm, isRateLimitError, type ErrorHoundClientError } from "@/lib/errors";
import { useResetPassword } from "@/features/auth/queries.password";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/features/auth/schemas";

export function useResetPasswordForm(token: string) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    try {
      await resetPassword.mutateAsync({
        token,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success("Password reset successful! You can now sign in with your new password.");
      navigate({ to: "/login" });
    } catch (error) {
      const ehError = error as ErrorHoundClientError;

      if (isRateLimitError(ehError)) {
        toast.error(ehError.message || "Too many attempts. Please try again later.");
        return;
      }

      if (!applyServerErrorsToForm(ehError, form.setError)) {
        toast.error(ehError.message || "Failed to reset password. The link may have expired.");
      }
    }
  };

  return {
    form,
    onSubmit,
    hasToken: !!token,
    showPassword,
    toggleShowPassword: () => setShowPassword((v) => !v),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((v) => !v),
  };
}
