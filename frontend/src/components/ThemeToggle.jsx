import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 text-xs">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition ${
            mode === value
              ? "bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm"
              : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          }`}
          aria-pressed={mode === value}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
