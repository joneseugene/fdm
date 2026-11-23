"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { VideoFrame } from "@/components/VideoFrame";
import type { VideoEmbed } from "@/lib/embed";
import { cn } from "@/utils/twMerge";

type LiveContextValue = { openLive: () => void; available: boolean };

const LiveContext = createContext<LiveContextValue>({ openLive: () => {}, available: false });

export const useLive = () => useContext(LiveContext);

/**
 * Holds the "Watch live" modal so any button on the page (navbar, hero) can
 * open it. The player iframe is only created when the modal opens.
 */
export function LiveProvider({
  embed,
  title,
  children,
}: {
  embed: VideoEmbed | null;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openLive = useCallback(() => {
    if (embed) setOpen(true);
    else document.getElementById("live")?.scrollIntoView({ behavior: "smooth" });
  }, [embed]);

  return (
    <LiveContext.Provider value={{ openLive, available: Boolean(embed) }}>
      {children}
      {open && embed && <LiveModal embed={embed} title={title} onClose={() => setOpen(false)} />}
    </LiveContext.Provider>
  );
}

function LiveModal({ embed, title, onClose }: { embed: VideoEmbed; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-glow",
          embed.kind === "facebook-page" ? "max-w-[500px]" : "max-w-3xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close live service"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <VideoFrame embed={embed} title={title} className={embed.kind === "facebook-page" ? "h-[min(600px,80svh)]" : undefined} />
      </div>
    </div>
  );
}

/** A button that opens the live service. */
export function WatchLiveButton({ className, children }: { className?: string; children: ReactNode }) {
  const { openLive } = useLive();
  return (
    <button type="button" onClick={openLive} className={className}>
      {children}
    </button>
  );
}
