import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  Church,
  Image as ImageIcon,
  Info,
  MapPin,
  Menu,
  PanelBottom,
  Phone,
  Radio,
  Share2,
  type LucideIcon,
} from "lucide-react";

import type { SectionKey } from "./schemas";

/** One icon per page section (sidebar and content overview). Client-safe. */
export const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
  site: Church,
  navigation: Menu,
  hero: ImageIcon,
  live: Radio,
  about: Info,
  services: CalendarClock,
  scriptures: BookOpen,
  activities: CalendarDays,
  branches: MapPin,
  contact: Phone,
  socials: Share2,
  footer: PanelBottom,
};
