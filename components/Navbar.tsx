import { useState, useEffect } from "react";
import { Menu, X, Radio } from "lucide-react";
import { CHURCH, NAV_LINKS } from "@/utils/church";
import Image from "next/image";

interface NavbarProps {
  onWatchLive: () => void;
}

export function Navbar({ onWatchLive }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/90 shadow-lg backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          <Image
            src={"/logo.png"}
            alt={`${CHURCH.name} logo`}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg"
          />
          <div className="flex min-w-0 flex-col leading-tight">
            <span
              className={`truncate font-display text-sm font-bold tracking-tight sm:text-base ${
                scrolled ? "text-foreground" : "text-background"
              }`}
            >
              {CHURCH.name}
            </span>
            <span
              className={`hidden text-[11px] font-medium uppercase tracking-widest sm:block ${
                scrolled ? "text-muted-foreground" : "text-background/70"
              }`}
            >
              Faith · Deliverance · Transformation
            </span>
          </div>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                scrolled
                  ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                  : "text-background/80 hover:bg-white/10 hover:text-background"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onWatchLive}
            className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-105 sm:inline-flex"
          >
            <Radio className="h-4 w-4" /> Watch Live
          </button>
          <button
            className={`rounded-full p-2 transition-colors lg:hidden ${
              scrolled
                ? "text-foreground hover:bg-accent"
                : "text-background hover:bg-white/10"
            }`}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 shadow-xl backdrop-blur-xl lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                onWatchLive();
              }}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <Radio className="h-4 w-4" /> Watch Live
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

