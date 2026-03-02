import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 overflow-hidden">
      <div className="text-center">
        <h1 className="text-8xl md:text-9xl font-bold text-primary/20 select-none">404</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="rounded-md bg-primary px-6 py-2.5 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="rounded-md border border-input bg-background px-6 py-2.5 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
