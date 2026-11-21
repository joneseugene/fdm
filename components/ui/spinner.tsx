import { cn } from "@/utils/twMerge";

const BLADES = 12;

/**
 * iOS-style "blade" activity indicator: 12 rounded blades fading in turn.
 * Inherits the text colour; size it with `size-*` classes (default 1rem).
 */
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("relative inline-block size-4 shrink-0", className)}>
      {Array.from({ length: BLADES }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="spinner-blade absolute left-[45%] top-[2%] h-[29%] w-[10%] rounded-full bg-current"
          style={{
            transform: `rotate(${(360 / BLADES) * i}deg)`,
            // Rotate around the spinner's centre: (50% - top) / height.
            transformOrigin: "50% 165.5%",
            animationDelay: `${-1.2 + (1.2 / BLADES) * i}s`,
          }}
        />
      ))}
    </span>
  );
}

/** Centered spinner for a page or panel that is loading. */
export function LoadingPanel({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("grid min-h-[40vh] place-items-center", className)}>
      <div className="grid justify-items-center gap-3 text-muted-foreground">
        <Spinner className="size-8" label={label} />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
