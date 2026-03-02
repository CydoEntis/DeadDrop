import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { AuthLayout } from "@/features/layouts/public/AuthLayout";
import { useForgotPasswordForm } from "@/features/auth/hooks/useForgotPasswordForm";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { form, onSubmit, submitted, submittedEmail } = useForgotPasswordForm();

  if (submitted) {
    return (
      <AuthLayout>
      <div className="text-center mb-8">
<h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We've sent a password reset link to <strong>{submittedEmail}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <Button variant="outline" className="w-full h-11" asChild>
            <Link to="/login">Back to Sign In</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
<h2 className="text-xl font-semibold mb-2">Forgot password?</h2>
        <p className="text-muted-foreground text-sm">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                    disabled={form.formState.isSubmitting}
                    className="h-11"
                  />
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
            {form.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>

          <Button variant="ghost" className="w-full h-11" asChild>
            <Link to="/login">Back to Sign In</Link>
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
