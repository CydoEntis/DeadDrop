import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  applyServerErrorsToForm,
  isFormLevelError,
  isSystemError,
  isRateLimitError,
  ErrorCodes,
  type ErrorHoundClientError,
} from "@/lib/errors";
import { useLogin } from "@/features/auth/queries";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas";
import { OAUTH_PROVIDERS } from "@/lib/constants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5135";

interface LoginSearchParams {
  redirect?: string;
  error?: string;
  error_description?: string;
  registered?: string;
}

export function useLoginForm(searchParams: LoginSearchParams) {
  const login = useLogin(searchParams.redirect);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(0);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (!lockoutEndTime) return;

    const updateCountdown = () => {
      const secondsLeft = Math.ceil((lockoutEndTime.getTime() - Date.now()) / 1000);
      if (secondsLeft <= 0) {
        setLockoutEndTime(null);
        setLockoutSecondsLeft(0);
        form.clearErrors("root");
      } else {
        setLockoutSecondsLeft(secondsLeft);
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        const timeString = minutes > 0
          ? `${minutes}m ${seconds}s`
          : `${seconds}s`;
        form.setError("root", {
          type: "lockout",
          message: `Account is locked. Try again in ${timeString}.`,
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime, form]);

  useEffect(() => {
    if (searchParams.registered) {
      form.setError("root", {
        type: "registered",
        message: "Account created! We've sent a verification email — please check your inbox and verify before signing in.",
      });
      return;
    }

    if (searchParams.error?.toUpperCase() === ErrorCodes.ACCOUNT_LOCKED) {
      form.setError("root", {
        type: "lockout",
        message: searchParams.error_description || "This account has been locked. Please contact support for assistance.",
      });
      return;
    }

    if (searchParams.error) {
      form.setError("root", {
        type: "oauth",
        message: searchParams.error_description || searchParams.error,
      });
    }
  }, [form, searchParams.error, searchParams.error_description, searchParams.registered]);

  const onSubmit = async (data: LoginFormData) => {
    if (lockoutEndTime && lockoutEndTime.getTime() > Date.now()) {
      return;
    }

    try {
      await login.mutateAsync(data);
      toast.success("Welcome back!");
    } catch (error) {
      const ehError = error as ErrorHoundClientError;

      if (isRateLimitError(ehError)) {
        form.setError("root", {
          type: "rateLimit",
          message: ehError.message || "Too many login attempts. Please try again later.",
        });
        return;
      }

      const details = ehError.details as { unlockAt?: string } | null;
      if (ehError.code === ErrorCodes.ACCOUNT_LOCKED) {
        if (details?.unlockAt) {
          const unlockAt = new Date(details.unlockAt);
          setLockoutEndTime(unlockAt);
        } else {
          form.setError("root", {
            type: "lockout",
            message: "This account has been locked. Please contact support for assistance.",
          });
        }
        return;
      }

      if (ehError.code === ErrorCodes.EMAIL_NOT_VERIFIED) {
        form.setError("root", {
          type: "emailNotVerified",
          message: "Please verify your email before signing in. Check your inbox for a verification link.",
        });
        return;
      }

      if (applyServerErrorsToForm(ehError, form.setError)) {
        return;
      }

      if (isFormLevelError(ehError)) {
        form.setError("root", {
          type: "server",
          message: ehError.message,
        });
        return;
      }

      if (isSystemError(ehError)) {
        toast.error(ehError.message || "Something went wrong. Please try again.");
        return;
      }

      form.setError("root", {
        type: "server",
        message: ehError.message || "An unexpected error occurred.",
      });
    }
  };

  const handleOAuthLogin = (provider: (typeof OAUTH_PROVIDERS)[keyof typeof OAUTH_PROVIDERS]) => {
    const returnUrl = encodeURIComponent(window.location.origin + "/auth/callback");
    window.location.href = `${API_URL}/api/auth/oauth/${provider}?returnUrl=${returnUrl}`;
  };

  return {
    form,
    onSubmit,
    handleOAuthLogin,
    isLockedOut: lockoutSecondsLeft > 0,
    lockoutSecondsLeft,
  };
}
