import { z } from "zod";

import { videoUrlProblem } from "@/lib/embed";
import { SOCIAL_PLATFORM_IDS } from "./icons";

/**
 * Everything on the landing page, section by section. Shared by the admin
 * forms (client validation) and the server (validated again before saving).
 * Each section is stored as one JSON row in `site_sections`.
 */

const text = (max: number) => z.string().trim().max(max, `At most ${max} characters`);
const required = (max: number) => text(max).min(1, "Required");

/** Links an editor may set: in-page anchors, site paths, web, email, phone. */
const href = z
  .string()
  .trim()
  .min(1, "Required")
  .max(500)
  .regex(/^(#[\w-]*|\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/i, "Use a #section, /path, https:// link, mailto: or tel:");

/**
 * An image: either a file in /public (defaults) or one uploaded through the
 * admin (re-encoded to WebP and stored in Supabase). Width/height avoid layout
 * shift; blurDataURL is a ~300-byte preview shown instantly while it loads.
 */
export const imageSchema = z.object({
  src: z
    .string()
    .min(1, "Upload an image")
    .refine((s) => s.startsWith("/") || s.startsWith("https://"), "Invalid image"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataURL: z
    .string()
    .max(4000)
    .refine((s) => s === "" || s.startsWith("data:image/"), "Invalid preview")
    .optional(),
});
export type ImageAsset = z.infer<typeof imageSchema>;

const header = {
  eyebrow: text(60),
  title: required(140),
  subtitle: text(500),
};

const visible = z.boolean();

// ---------- Sections ----------

export const siteSchema = z.object({
  name: required(120),
  shortName: required(30),
  tagline: text(120),
  statement: text(400),
  overseer: required(120),
  headquarters: required(120),
  email: z.union([z.email("Enter a valid email"), z.literal("")]),
  phone: text(40),
  logo: imageSchema,
  seoTitle: required(160),
  seoDescription: required(300),
});

export const heroSchema = z.object({
  badge: text(40),
  title: required(160),
  subtitle: text(500),
  image: imageSchema,
  imageAlt: required(200),
  primaryCta: text(40),
  secondaryCta: text(40),
  secondaryHref: href,
});

export const navigationSchema = z.object({
  links: z
    .array(z.object({ label: required(30), href }))
    .max(10, "At most 10 links"),
});

export const liveSchema = z.object({
  visible,
  ...header,
  videoUrl: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      const problem = videoUrlProblem(v);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    }),
  note: text(200),
});

export const aboutSchema = z.object({
  visible,
  ...header,
  highlights: z.array(z.object({ text: required(160) })).max(8, "At most 8"),
  overseerImage: imageSchema,
  overseerLabel: text(60),
  overseerBio: text(400),
});

export const servicesSchema = z.object({
  visible,
  ...header,
  items: z
    .array(
      z.object({
        icon: z.string().max(40),
        title: required(80),
        desc: text(240),
        time: text(60),
      }),
    )
    .max(24),
});

export const scripturesSchema = z.object({
  visible,
  ...header,
  items: z.array(z.object({ reference: required(60), text: required(600) })).max(24),
});

export const activitiesSchema = z.object({
  visible,
  ...header,
  items: z
    .array(
      z.object({
        image: imageSchema,
        title: required(100),
        date: text(60),
        location: text(100),
        desc: text(300),
      }),
    )
    .max(24),
});

export const branchesSchema = z.object({
  visible,
  ...header,
  items: z
    .array(
      z.object({
        country: required(80),
        role: required(40),
        address: text(200),
        contact: text(80),
        time: text(80),
        headquarters: z.boolean(),
      }),
    )
    .max(30),
});

export const contactSchema = z.object({
  visible,
  ...header,
  address: text(200),
  branchContactsTitle: text(60),
  successMessage: text(200),
});

export const socialsSchema = z.object({
  visible,
  ...header,
  items: z
    .array(
      z.object({
        platform: z.enum(SOCIAL_PLATFORM_IDS),
        label: required(40),
        href,
      }),
    )
    .max(12),
});

export const footerSchema = z.object({
  quickLinksTitle: text(40),
  branchesTitle: text(40),
  contactTitle: text(40),
  copyright: text(200),
});

// ---------- Registry ----------

export const SECTION_SCHEMAS = {
  site: siteSchema,
  hero: heroSchema,
  navigation: navigationSchema,
  live: liveSchema,
  about: aboutSchema,
  services: servicesSchema,
  scriptures: scripturesSchema,
  activities: activitiesSchema,
  branches: branchesSchema,
  contact: contactSchema,
  socials: socialsSchema,
  footer: footerSchema,
} as const;

export type SectionKey = keyof typeof SECTION_SCHEMAS;
export const SECTION_KEYS = Object.keys(SECTION_SCHEMAS) as SectionKey[];

export type SectionData<K extends SectionKey> = z.infer<(typeof SECTION_SCHEMAS)[K]>;
export type SiteContent = { [K in SectionKey]: SectionData<K> };

export const isSectionKey = (key: string): key is SectionKey => key in SECTION_SCHEMAS;

/** Admin labels, in the order the sections appear on the page. */
export const SECTION_META: Record<SectionKey, { label: string; description: string; anchor?: string }> = {
  site: { label: "Ministry details", description: "Name, logo, contact details and search engine text." },
  navigation: { label: "Menu", description: "Links in the top menu and footer." },
  hero: { label: "Hero", description: "The first thing visitors see: headline, image and buttons.", anchor: "home" },
  live: { label: "Live service", description: "The Facebook or YouTube stream shown on the page.", anchor: "live" },
  about: { label: "About", description: "Who you are, highlights and the General Overseer.", anchor: "about" },
  services: { label: "Services", description: "Weekly services and meetings.", anchor: "services" },
  scriptures: { label: "Scriptures", description: "Bible verses shown on the page.", anchor: "quotes" },
  activities: { label: "Activities", description: "Upcoming and recent events with photos.", anchor: "activities" },
  branches: { label: "Branches", description: "Locations, contacts and service times.", anchor: "branches" },
  contact: { label: "Contact", description: "Contact section text and form.", anchor: "contact" },
  socials: { label: "Social media", description: "Links to your social media pages." },
  footer: { label: "Footer", description: "Footer headings and copyright line." },
};

export const ADMIN_SECTION_ORDER: SectionKey[] = [
  "site",
  "navigation",
  "hero",
  "live",
  "about",
  "services",
  "scriptures",
  "activities",
  "branches",
  "contact",
  "socials",
  "footer",
];

// ---------- Drafts and review ----------

/** draft: saved, not live. in_review: sent to a publisher. */
export type DraftStatus = "draft" | "in_review";

/** What the editor shows about a section's unpublished draft. */
export type SectionDraftInfo = {
  status: DraftStatus;
  updatedAt: string;
  updatedByName: string | null;
  submittedAt: string | null;
  submittedByName: string | null;
  /** The reviewer's reason when they sent it back. */
  reviewNote: string | null;
};

export const reviewNoteSchema = z.string().trim().min(3, "Say briefly what to change").max(1000);
