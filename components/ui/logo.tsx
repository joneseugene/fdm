import { ShieldCheck } from "lucide-react";

import { cn } from "@/utils/twMerge";

interface LogoProps {
  className?: string;
  dark?: boolean;
}

function Logo({ className, dark = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-2xl border shadow-sm transition-all",
          dark
            ? "border-white/20 bg-white/10 backdrop-blur text-white"
            : "border-slate-200 bg-white text-sky-600",
        )}
      >
        <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
      </span>

      <span className="flex items-center text-lg font-black tracking-tight">
        <span className={cn(dark ? "text-white" : "text-slate-900")}>
          Trust
        </span>

        <span className={cn("ml-0.5", dark ? "text-sky-100" : "text-sky-600")}>
          Pin
        </span>
      </span>
    </span>
  );
}

export { Logo };
