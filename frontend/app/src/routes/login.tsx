import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AuthLayout } from "@/features/layouts/public/AuthLayout";
import { FormAlert } from "@/features/auth/components";
import { useLoginForm } from "@/features/auth/hooks/useLoginForm";
import { loginSearchSchema } from "@/features/auth/schemas";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: loginSearchSchema,
});

function LoginPage() {
  const searchParams = Route.useSearch();
  const { form, onSubmit } = useLoginForm(searchParams);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-sm font-bold tracking-wider mb-2">Operator login</h2>
        <p className="text-muted-foreground text-xs">
          Authenticate to access the control console
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
                    placeholder=""
                    {...field}
                    disabled={form.formState.isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder=""
                      {...field}
                      disabled={form.formState.isSubmitting}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <FormAlert
              message={form.formState.errors.root.message!}
              variant={
                form.formState.errors.root.type === "registered" ? "success"
                  : form.formState.errors.root.type === "emailNotVerified" ? "warning"
                  : form.formState.errors.root.type === "lockout" ? "warning"
                  : "error"
              }
            />
          )}

          <Button type="submit" className="w-full h-11 font-medium" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
