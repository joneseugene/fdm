"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";

import { cn } from "@/utils/twMerge";

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Focus the first box on mount. */
  autoFocus?: boolean;
  /** Show the boxes in an error state. */
  invalid?: boolean;
  /** Called once every box is filled (e.g. to submit). */
  onComplete?: (value: string) => void;
  "aria-label"?: string;
}

function PinInput({
  length = 6,
  value,
  onChange,
  disabled,
  className,
  autoFocus,
  invalid,
  onComplete,
  "aria-label": ariaLabel = "Code",
}: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const chars = value.padEnd(length, " ").slice(0, length).split("");

  const emit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const setAt = (index: number, char: string) => {
    const next = chars.slice();

    next[index] = char;

    emit(next.join("").replace(/\s/g, ""));
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      if (chars[index] !== " ") {
        setAt(index, " ");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, " ");
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    emit(text);

    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center justify-center gap-2 sm:gap-3",
        className,
      )}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          autoFocus={autoFocus && index === 0}
          maxLength={1}
          disabled={disabled}
          value={chars[index] === " " ? "" : chars[index]}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);

            if (!char) return;

            setAt(index, char);

            if (index < length - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-10 rounded-xl border border-input bg-card text-center text-2xl font-semibold text-foreground shadow-soft transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-14",
            invalid && "border-destructive focus:border-destructive focus:ring-destructive/30",
          )}
        />
      ))}
    </div>
  );
}

export { PinInput };
