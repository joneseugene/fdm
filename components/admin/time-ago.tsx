"use client";

import { useSyncExternalStore } from "react";

/**
 * Friendly relative dates ("just now", "2 mins ago", "yesterday") that keep
 * themselves up to date. Hover shows the exact date and time.
 */

// One shared clock for every <TimeAgo>, ticking every 30 seconds while any is mounted.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    setTimeout(() => listeners.forEach((l) => l()), 0);
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getNow = () => now;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

export function timeAgo(iso: string, at: number): string {
  const seconds = Math.round((at - new Date(iso).getTime()) / 1000);
  const future = seconds < 0;
  const s = Math.abs(seconds);
  const say = (text: string) => (future ? `in ${text}` : `${text} ago`);

  if (s < 45) return "just now";
  if (s < 3600) return say(plural(Math.max(1, Math.round(s / 60)), "min"));
  if (s < 86_400) return say(plural(Math.round(s / 3600), "hour"));
  const days = Math.round(s / 86_400);
  if (days === 1) return future ? "tomorrow" : "yesterday";
  if (days < 7) return say(plural(days, "day"));
  if (days < 30) return say(plural(Math.round(days / 7), "week"));
  if (days < 365) return say(plural(Math.round(days / 30), "month"));
  return say(plural(Math.round(days / 365), "year"));
}

export const fullDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function TimeAgo({ date, fallback = "Never", className }: { date: string | null; fallback?: string; className?: string }) {
  const at = useSyncExternalStore(subscribe, getNow, getNow);
  if (!date) return <span className={className}>{fallback}</span>;
  return (
    // Server and browser clocks can differ by a minute; the browser's wins.
    <time dateTime={date} title={fullDate(date)} className={className} suppressHydrationWarning>
      {timeAgo(date, at)}
    </time>
  );
}
