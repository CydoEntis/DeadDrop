import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button type="button" onClick={toggleTheme} className="w-full flex items-center gap-2 cursor-pointer">
      {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === "light" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
