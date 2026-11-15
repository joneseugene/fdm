"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type LiveContextValue = { openLive: () => void; available: boolean };

const LiveContext = createContext<LiveContextValue>({ openLive: () => {}, available: false });

export const useLive = () => useContext(LiveContext);

/**
 * Holds the "Watch live" modal so any button on the page (navbar, hero) can
 * open it. The player iframe is only created when the modal opens.
 */
export function LiveProvider({
  embedUrl,
  title,
  children,
}: {
  embedUrl: string | null;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openLive = useCallback(() => {
    if (embedUrl) setOpen(true);
    else document.getElementById("live")?.scrollIntoView({ behavior: "smooth" });
  }, [embedUrl]);

  return (
    <LiveContext.Provider value={{ openLive, available: Boolean(embedUrl) }}>
      {children}
      {open && embedUrl && <LiveModal embedUrl={embedUrl} title={title} onClose={() => setOpen(false)} />}
    </LiveContext.Provider>
  );
}

function LiveModal({ embedUrl, title, onClose }: { embedUrl: string; title: string; onClose: () => void }) {
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
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-glow"
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
        <div className="aspect-video w-full bg-black">
          <iframe
            title={title}
            src={embedUrl}
            className="h-full w-full"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
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
