import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showButton?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onSearch,
  placeholder = "Search...",
  debounceMs = 400,
  showButton = false,
  className,
}: SearchInputProps) {
  const [input, setInput] = useState(value);

  // Sync when external value changes (e.g. URL param reset)
  useEffect(() => {
    setInput(value);
  }, [value]);

  // Debounce: auto-search after user stops typing
  useEffect(() => {
    if (input === value) return;
    const timer = setTimeout(() => {
      onSearch(input);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [input, value, onSearch, debounceMs]);

  const handleSubmit = useCallback(() => {
    onSearch(input);
  }, [input, onSearch]);

  const handleClear = () => {
    setInput("");
    onSearch("");
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="pl-9 pr-9"
        />
        {input && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showButton && (
        <Button onClick={handleSubmit}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      )}
    </div>
  );
}
