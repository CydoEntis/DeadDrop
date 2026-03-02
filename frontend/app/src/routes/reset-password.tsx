import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AuthLayout } from "@/features/layouts/public/AuthLayout";
import { AppLogo } from "@/components/AppLogo";
import { useResetPasswordForm } from "@/features/auth/hooks/useResetPasswordForm";
import { tokenSearchSchema } from "@/features/auth/schemas";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: tokenSearchSchema,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const {
    form,
    onSubmit,
    hasToken,
    showPassword,
    toggleShowPassword,
    showConfirmPassword,
    toggleShowConfirmPassword,
  } = useResetPasswordForm(token);

  if (!hasToken) {
    return (
      <AuthLayout>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <AppLogo className="h-32 w-auto sm:h-48 md:h-56" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-destructive">Invalid Link</h2>
          <p className="text-muted-foreground text-sm">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className="space-y-4">
          <Button className="w-full h-11 font-medium" asChild>
            <Link to="/forgot-password">Request New Reset Link</Link>
          </Button>
          <Button variant="ghost" className="w-full h-11" asChild>
            <Link to="/login">Back to Sign In</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <img
            src="/placeholder_logo.png"
            alt="DeadDrop Logo"
            className="h-32 w-auto sm:h-48 md:h-56"
          />
        </div>
        <h2 className="text-xl font-semibold mb-2">Reset your password</h2>
        <p className="text-muted-foreground text-sm">
          Enter your new password below
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password (min. 8 characters)"
                      {...field}
                      disabled={form.formState.isSubmitting}
                      className="h-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={toggleShowPassword}
                      disabled={form.formState.isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      {...field}
                      disabled={form.formState.isSubmitting}
                      className="h-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={toggleShowConfirmPassword}
                      disabled={form.formState.isSubmitting}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 font-medium"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Resetting password..." : "Reset Password"}
          </Button>

          <Button variant="ghost" className="w-full h-11" asChild>
            <Link to="/login">Back to Sign In</Link>
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
