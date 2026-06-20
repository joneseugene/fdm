"use client";

import Image from "next/image";
import { useState } from "react";
import * as Icons from "lucide-react";
import { Radio, Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LiveModal } from "@/components/LiveModal";
import { SectionHeader } from "@/components/SectionHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { BranchCard } from "@/components/BranchCard";
import { ScriptureCard } from "@/components/ScriptureCard";
import { ContactForm } from "@/components/ContactForm";
import {
  ACTIVITIES,
  BRANCHES,
  CHURCH,
  QUOTES,
  SERVICES,
  SOCIALS,
} from "@/utils/church";
import { ActivityCard } from "../ActivityCard";

export function HomePage() {
  const [liveOpen, setLiveOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onWatchLive={() => setLiveOpen(true)} />
      <LiveModal open={liveOpen} onClose={() => setLiveOpen(false)} />

      <section
        id="home"
        className="relative flex min-h-screen items-center overflow-hidden"
      >
        <Image
          src={"/hero.jpg"}
          alt="Worshippers raising hands before a cross"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/30" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-32 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
              <Radio className="h-3.5 w-3.5" /> Welcome Home
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-background sm:text-5xl lg:text-6xl">
              Faith, Deliverance, and Transformation Through Christ
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-background/85 sm:text-lg">
              {CHURCH.name} is a global ministry raising believers in faith,
              breaking chains through deliverance, and transforming lives by the
              power of the gospel.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setLiveOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
              >
                <Radio className="h-4 w-4" /> Watch Live Service
              </button>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-background/40 bg-background/10 px-6 py-3 text-sm font-semibold text-background backdrop-blur-sm transition-colors hover:bg-background/20"
              >
                Contact Us <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="live" className="bg-cream py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Live Now"
            title="Watch Our Live Church Service"
            subtitle="Join us live for worship, deliverance, prayer, and the Word of God — wherever you are in the world."
          />

          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="aspect-video w-full bg-black">
              <iframe
                title="Facebook Live Service"
                src={CHURCH.facebookEmbed}
                className="h-full w-full"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Streaming via Facebook Live · Replace with your church page URL
            anytime.
          </p>
        </div>
      </section>

      <section id="about" className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeader
              align="left"
              eyebrow="About Us"
              title="A Global Family of Faith"
              subtitle={`${CHURCH.name} is a Christ-centered ministry committed to raising disciples, ministering deliverance, and transforming nations. From our headquarters in The Gambia, we reach communities across West Africa and beyond.`}
            />

            <ul className="mt-8 space-y-3 text-sm text-foreground">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Headquarters in {CHURCH.headquarters}
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Branches in Sierra Leone, Liberia & United Kingdom
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Led by {CHURCH.overseer}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={"/overseer.jpg"}
                alt={CHURCH.overseer}
                fill
                className="object-cover"
              />
            </div>

            <div className="mt-5 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                General Overseer
              </span>

              <h3 className="mt-1 font-display text-xl font-semibold text-foreground">
                {CHURCH.overseer}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Shepherding the global vision of faith, deliverance, and
                transformation through Christ.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-cream py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Our Services"
            title="Gather, Grow & Encounter God"
            subtitle="There is a place for everyone in the family of God. Join us throughout the week."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section id="quotes" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="The Word"
            title="Promises to Stand On"
            subtitle="Let these scriptures strengthen your faith and renew your hope today."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {QUOTES.map((quote) => (
              <ScriptureCard
                key={quote.ref}
                reference={quote.ref}
                text={quote.text}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="activities" className="bg-cream py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="What's Happening"
            title="Upcoming & Recent Activities"
            subtitle="From revivals to outreaches, there is always something stirring in the ministry."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIVITIES.map((activity) => (
              <ActivityCard key={activity.title} {...activity} />
            ))}
          </div>
        </div>
      </section>

      <section id="branches" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Find Us"
            title="Our Branches Around the World"
            subtitle="One family, many locations. Worship with us at a branch near you."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BRANCHES.map((branch) => (
              <BranchCard key={branch.country} {...branch} />
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-cream py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Get In Touch"
              title="We'd Love to Hear From You"
              subtitle="Have a prayer request, question, or want to plan a visit? Reach out and our team will respond."
            />

            <div className="mt-8 space-y-4">
              <ContactRow
                icon={MapPin}
                label="Headquarters"
                value={`${BRANCHES[0].address}, ${CHURCH.headquarters}`}
              />
              <ContactRow icon={Mail} label="Email" value={CHURCH.email} />
              <ContactRow icon={Phone} label="Phone" value={CHURCH.phone} />
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                Branch Contacts
              </h4>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {BRANCHES.slice(1).map((branch) => (
                  <li key={branch.country}>
                    <span className="font-medium text-foreground">
                      {branch.country}:
                    </span>{" "}
                    {branch.contact}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Stay Connected" title="Follow Our Ministry" />

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {SOCIALS.map((social) => {
              const Icon = (Icons[social.icon as keyof typeof Icons] ??
                Icons.Globe) as Icons.LucideIcon;

              return (
                <a
                  key={social.label}
                  href={social.href}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary">
                    <Icon className="h-5 w-5 text-foreground" />
                  </span>

                  <span className="text-sm font-semibold text-foreground">
                    {social.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: Icons.LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <Icon className="h-5 w-5 text-foreground" />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
