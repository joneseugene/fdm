import Image from "next/image";
import { ArrowRight, Mail, MapPin, Phone, Radio, type LucideIcon } from "lucide-react";

import { ActivityCard } from "@/components/ActivityCard";
import { BranchCard } from "@/components/BranchCard";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { LiveProvider, WatchLiveButton } from "@/components/LiveModal";
import { Navbar } from "@/components/Navbar";
import { ScriptureCard } from "@/components/ScriptureCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { SocialIcon } from "@/components/SocialIcon";
import type { SiteContent } from "@/features/content/schemas";
import { toEmbedUrl } from "@/lib/embed";

/**
 * The public landing page. A server component: it ships as static HTML with
 * only three small interactive islands (menu, live player, contact form).
 */
export function HomePage({ content, year }: { content: SiteContent; year: number }) {
  const { site, navigation, hero, live, about, services, scriptures, activities, branches, contact, socials } =
    content;
  const embedUrl = live.visible && live.videoUrl ? toEmbedUrl(live.videoUrl) : null;
  const otherBranches = branches.items.filter((b) => !b.headquarters);

  return (
    <LiveProvider embedUrl={embedUrl} title={`Live Service · ${site.shortName}`}>
      <div className="min-h-screen bg-background">
        <Navbar
          name={site.name}
          tagline={site.tagline}
          logo={site.logo}
          links={navigation.links}
          showLive={Boolean(embedUrl)}
        />

        <section id="home" className="relative flex min-h-screen items-center overflow-hidden bg-foreground">
          {/*
            The LCP image: preloaded from <head>, sized to the screen, and shown
            as an inline blurred preview until the full image arrives.
          */}
          <Image
            src={hero.image.src}
            alt={hero.imageAlt}
            fill
            preload
            sizes="100vw"
            placeholder={hero.image.blurDataURL ? "blur" : "empty"}
            blurDataURL={hero.image.blurDataURL || undefined}
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/30" />

          <div className="relative mx-auto w-full max-w-7xl px-4 py-32 sm:px-6">
            <div className="max-w-2xl">
              {hero.badge && (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                  <Radio className="h-3.5 w-3.5" /> {hero.badge}
                </span>
              )}

              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-background sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>

              {hero.subtitle && (
                <p className="mt-6 max-w-xl text-base leading-relaxed text-background/85 sm:text-lg">
                  {hero.subtitle}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {hero.primaryCta && embedUrl && (
                  <WatchLiveButton className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105">
                    <Radio className="h-4 w-4" /> {hero.primaryCta}
                  </WatchLiveButton>
                )}

                {hero.secondaryCta && (
                  <a
                    href={hero.secondaryHref}
                    className="inline-flex items-center gap-2 rounded-full border border-background/40 bg-background/10 px-6 py-3 text-sm font-semibold text-background backdrop-blur-sm transition-colors hover:bg-background/20"
                  >
                    {hero.secondaryCta} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {embedUrl && (
          <section id="live" className="bg-cream py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow={live.eyebrow} title={live.title} subtitle={live.subtitle} />

              <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <div className="aspect-video w-full bg-black">
                  {/* Lazy: the player's scripts don't compete with the hero. */}
                  <iframe
                    title={live.title}
                    src={embedUrl}
                    loading="lazy"
                    className="h-full w-full"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>

              {live.note && <p className="mt-6 text-center text-sm text-muted-foreground">{live.note}</p>}
            </div>
          </section>
        )}

        {about.visible && (
          <section id="about" className="py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
              <div>
                <SectionHeader align="left" eyebrow={about.eyebrow} title={about.title} subtitle={about.subtitle} />

                {about.highlights.length > 0 && (
                  <ul className="mt-8 space-y-3 text-sm text-foreground">
                    {about.highlights.map((h) => (
                      <li key={h.text} className="flex items-center gap-3">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        {h.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={about.overseerImage.src}
                    alt={site.overseer}
                    fill
                    sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
                    placeholder={about.overseerImage.blurDataURL ? "blur" : "empty"}
                    blurDataURL={about.overseerImage.blurDataURL || undefined}
                    className="object-cover"
                  />
                </div>

                <div className="mt-5 text-center">
                  {about.overseerLabel && (
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                      {about.overseerLabel}
                    </span>
                  )}
                  <h3 className="mt-1 font-display text-xl font-semibold text-foreground">{site.overseer}</h3>
                  {about.overseerBio && <p className="mt-2 text-sm text-muted-foreground">{about.overseerBio}</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {services.visible && services.items.length > 0 && (
          <section id="services" className="bg-cream py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow={services.eyebrow} title={services.title} subtitle={services.subtitle} />
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {services.items.map((service, i) => (
                  <ServiceCard key={`${service.title}-${i}`} {...service} />
                ))}
              </div>
            </div>
          </section>
        )}

        {scriptures.visible && scriptures.items.length > 0 && (
          <section id="quotes" className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow={scriptures.eyebrow} title={scriptures.title} subtitle={scriptures.subtitle} />
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {scriptures.items.map((quote, i) => (
                  <ScriptureCard key={`${quote.reference}-${i}`} reference={quote.reference} text={quote.text} />
                ))}
              </div>
            </div>
          </section>
        )}

        {activities.visible && activities.items.length > 0 && (
          <section id="activities" className="bg-cream py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow={activities.eyebrow} title={activities.title} subtitle={activities.subtitle} />
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activities.items.map((activity, i) => (
                  <ActivityCard key={`${activity.title}-${i}`} {...activity} />
                ))}
              </div>
            </div>
          </section>
        )}

        {branches.visible && branches.items.length > 0 && (
          <section id="branches" className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow={branches.eyebrow} title={branches.title} subtitle={branches.subtitle} />
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {branches.items.map((branch, i) => (
                  <BranchCard key={`${branch.country}-${i}`} {...branch} />
                ))}
              </div>
            </div>
          </section>
        )}

        {contact.visible && (
          <section id="contact" className="bg-cream py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
              <div>
                <SectionHeader align="left" eyebrow={contact.eyebrow} title={contact.title} subtitle={contact.subtitle} />

                <div className="mt-8 space-y-4">
                  {contact.address && <ContactRow icon={MapPin} label="Headquarters" value={contact.address} />}
                  {site.email && (
                    <ContactRow icon={Mail} label="Email" value={site.email} href={`mailto:${site.email}`} />
                  )}
                  {site.phone && (
                    <ContactRow
                      icon={Phone}
                      label="Phone"
                      value={site.phone}
                      href={`tel:${site.phone.replace(/\s/g, "")}`}
                    />
                  )}
                </div>

                {otherBranches.length > 0 && (
                  <div className="mt-8">
                    {contact.branchContactsTitle && (
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                        {contact.branchContactsTitle}
                      </h4>
                    )}
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {otherBranches.map((branch) => (
                        <li key={branch.country}>
                          <span className="font-medium text-foreground">{branch.country}:</span> {branch.contact}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <ContactForm successMessage={contact.successMessage || "Thank you! Your message has been sent."} />
            </div>
          </section>
        )}

        {socials.visible && socials.items.length > 0 && (
          <section className="py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow={socials.eyebrow} title={socials.title} subtitle={socials.subtitle} />
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {socials.items.map((social) => (
                  <a
                    key={`${social.platform}-${social.href}`}
                    href={social.href}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                    rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary">
                      <SocialIcon platform={social.platform} className="h-5 w-5 text-foreground" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{social.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer
          site={site}
          navigation={navigation}
          branches={branches}
          socials={socials}
          footer={content.footer}
          year={year}
        />
      </div>
    </LiveProvider>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <Icon className="h-5 w-5 text-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-foreground hover:underline">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
