import * as Icons from "lucide-react";
import { BRANCHES, CHURCH, NAV_LINKS, SOCIALS } from "@/utils/church";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src={"/logo.png"}
                alt={`${CHURCH.name} logo`}
                width={40}
                height={40}
                className="h-9 w-9"
              />
              <span className="font-display text-base font-semibold text-foreground">
                {CHURCH.short}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {CHURCH.statement}
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((s) => {
                const Icon = (Icons[s.icon as keyof typeof Icons] ??
                  Icons.Globe) as Icons.LucideIcon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow-soft transition-colors hover:bg-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
              Branches
            </h4>
            <ul className="mt-4 space-y-2">
              {BRANCHES.map((b) => (
                <li key={b.country} className="text-sm text-muted-foreground">
                  {b.country} <span className="text-xs">({b.role})</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
              Contact
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>HQ: {CHURCH.headquarters}</li>
              <li>{CHURCH.email}</li>
              <li>{CHURCH.phone}</li>
              <li>Overseer: {CHURCH.overseer}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {CHURCH.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
