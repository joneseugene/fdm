"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, Radio, X } from "lucide-react";

import type { ImageAsset } from "@/features/content/schemas";
import { useLive } from "./LiveModal";

interface NavbarProps {
  name: string;
  tagline: string;
  logo: ImageAsset;
  links: Array<{ label: string; href: string }>;
  showLive: boolean;
}

export function Navbar({ name, tagline, logo, links, showLive }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openLive } = useLive();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? "border-b border-border bg-background/90 shadow-lg backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          <Image
            src={logo.src}
            alt={`${name} logo`}
            width={40}
            height={40}
            loading="eager"
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
          />
          <div className="flex min-w-0 flex-col leading-tight">
            <span
              className={`truncate font-display text-sm font-bold tracking-tight sm:text-base ${
                scrolled ? "text-foreground" : "text-background"
              }`}
            >
              {name}
            </span>
            {tagline && (
              <span
                className={`hidden text-[11px] font-medium uppercase tracking-widest sm:block ${
                  scrolled ? "text-muted-foreground" : "text-background/70"
                }`}
              >
                {tagline}
              </span>
            )}
          </div>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={`${l.href}-${l.label}`}
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
          {showLive && (
            <button
              onClick={openLive}
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-105 sm:inline-flex"
            >
              <Radio className="h-4 w-4" /> Watch Live
            </button>
          )}
          <button
            className={`rounded-full p-2 transition-colors lg:hidden ${
              scrolled ? "text-foreground hover:bg-accent" : "text-background hover:bg-white/10"
            }`}
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 shadow-xl backdrop-blur-xl lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {links.map((l) => (
              <a
                key={`${l.href}-${l.label}`}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {l.label}
              </a>
            ))}
            {showLive && (
              <button
                onClick={() => {
                  setOpen(false);
                  openLive();
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
              >
                <Radio className="h-4 w-4" /> Watch Live
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
