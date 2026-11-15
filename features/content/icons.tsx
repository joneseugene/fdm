import { createElement, type SVGProps } from "react";
import {
  Baby,
  BookOpen,
  Church,
  Cross,
  Crown,
  Droplets,
  Flame,
  Gift,
  Globe,
  GraduationCap,
  HandHeart,
  HandHelping,
  Handshake,
  Headphones,
  Heart,
  Megaphone,
  MessageCircle,
  Mic,
  Music,
  Podcast,
  Radio,
  School,
  Sparkles,
  Star,
  Sun,
  Users,
  Utensils,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons an editor can pick for services. Named imports (not `import *`) so
 * only these end up in the bundle.
 */
export const SERVICE_ICONS = {
  Church,
  Flame,
  Music,
  HandHelping,
  BookOpen,
  Users,
  Heart,
  Megaphone,
  Cross,
  HandHeart,
  Baby,
  Mic,
  Sparkles,
  Video,
  Radio,
  Podcast,
  Headphones,
  Star,
  Sun,
  Crown,
  Gift,
  GraduationCap,
  Handshake,
  Droplets,
  Utensils,
  School,
  Globe,
} satisfies Record<string, LucideIcon>;

export type ServiceIconName = keyof typeof SERVICE_ICONS;
export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS) as ServiceIconName[];

export function serviceIcon(name: string): LucideIcon {
  return SERVICE_ICONS[name as ServiceIconName] ?? Church;
}

/** Renders a service icon by its stored name (unknown names show a church). */
export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  return createElement(serviceIcon(name), { className, "aria-hidden": true });
}

// ---------- Social platforms (lucide v1 has no brand icons) ----------

type IconProps = SVGProps<SVGSVGElement>;

const filled = (d: string) =>
  function BrandIcon(props: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d={d} />
      </svg>
    );
  };

function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export const SOCIAL_PLATFORMS = {
  facebook: {
    label: "Facebook",
    Icon: filled(
      "M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z",
    ),
  },
  youtube: {
    label: "YouTube",
    Icon: filled(
      "M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z",
    ),
  },
  instagram: { label: "Instagram", Icon: InstagramIcon },
  tiktok: {
    label: "TikTok",
    Icon: filled(
      "M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.966 7.966 0 0 1-5-1.755z",
    ),
  },
  x: {
    label: "X (Twitter)",
    Icon: filled(
      "M18.205 2.25h3.308l-7.227 8.26 8.502 11.24H16.13l-5.214-6.817L4.95 21.75H1.64l7.73-8.835L1.215 2.25H8.04l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.045 4.126H5.078L17.044 19.77z",
    ),
  },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle },
  podcast: { label: "Podcast", Icon: Podcast },
  website: { label: "Website", Icon: Globe },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;
export const SOCIAL_PLATFORM_IDS = Object.keys(SOCIAL_PLATFORMS) as [SocialPlatform, ...SocialPlatform[]];
