import type { ReactNode } from "react";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter } from "./AuthFooter";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      
      <main className="min-h-svh flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      
      <AuthFooter />
    </div>
  );
}
