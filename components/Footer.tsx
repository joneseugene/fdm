import Image from "next/image";

import type { SiteContent } from "@/features/content/schemas";
import { SocialIcon } from "./SocialIcon";

type FooterProps = Pick<SiteContent, "site" | "navigation" | "branches" | "socials" | "footer"> & {
  year: number;
};

export function Footer({ site, navigation, branches, socials, footer, year }: FooterProps) {
  const showSocials = socials.visible && socials.items.length > 0;
  return (
    <footer className="border-t border-border bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src={site.logo.src}
                alt={`${site.name} logo`}
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
              />
              <span className="font-display text-base font-semibold text-foreground">{site.shortName}</span>
            </div>
            {site.statement && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{site.statement}</p>
            )}
            {showSocials && (
              <div className="mt-5 flex gap-2">
                {socials.items.map((s) => (
                  <a
                    key={`${s.platform}-${s.href}`}
                    href={s.href}
                    aria-label={s.label}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow-soft transition-colors hover:bg-primary"
                  >
                    <SocialIcon platform={s.platform} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {navigation.links.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                {footer.quickLinksTitle}
              </h4>
              <ul className="mt-4 space-y-2">
                {navigation.links.map((l) => (
                  <li key={`${l.href}-${l.label}`}>
                    <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {branches.items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                {footer.branchesTitle}
              </h4>
              <ul className="mt-4 space-y-2">
                {branches.items.map((b) => (
                  <li key={b.country} className="text-sm text-muted-foreground">
                    {b.country} <span className="text-xs">({b.role})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
              {footer.contactTitle}
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>HQ: {site.headquarters}</li>
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="hover:text-foreground">
                    {site.email}
                  </a>
                </li>
              )}
              {site.phone && (
                <li>
                  <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>Overseer: {site.overseer}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {year} {footer.copyright}
        </div>
      </div>
    </footer>
  );
}
