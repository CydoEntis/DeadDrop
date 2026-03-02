export function AuthFooter() {
  return (
    <footer className="border-t border-border py-6 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} DeadDrop</span>
        <span className="normal-case">
          Built with .NET 9 + React 19
        </span>
      </div>
    </footer>
  );
}
