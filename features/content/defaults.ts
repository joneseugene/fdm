import type { StaticImageData } from "next/image";

import activityCrusade from "@/public/activity-crusade.jpg";
import activityOutreach from "@/public/activity-outreach.jpg";
import activityPrayer from "@/public/activity-prayer.jpg";
import activityRevival from "@/public/activity-revival.jpg";
import activityWorship from "@/public/activity-worship.jpg";
import activityYouth from "@/public/activity-youth.jpg";
import hero from "@/public/hero.jpg";
import logo from "@/public/logo.png";
import overseer from "@/public/overseer.jpg";
import type { ImageAsset, SiteContent } from "./schemas";

/**
 * What the page shows for any section nobody has edited yet (and when the
 * database isn't reachable). Images are static imports, so Next.js knows
 * their size and generates their blur previews at build time.
 */
const img = ({ src, width, height, blurDataURL }: StaticImageData): ImageAsset => ({
  src,
  width,
  height,
  blurDataURL: blurDataURL ?? "",
});

const NAME = "Faith and Deliverance Ministries Global";

export const DEFAULT_CONTENT: SiteContent = {
  site: {
    name: NAME,
    shortName: "FDMG",
    tagline: "Faith · Deliverance · Transformation",
    statement:
      "A global family of believers pursuing faith, deliverance, and transformation through the power of Jesus Christ.",
    overseer: "Primate Desmond T. Conteh",
    headquarters: "The Gambia",
    email: "info@fdmglobal.org",
    phone: "+220 000 0000",
    logo: img(logo),
    seoTitle: `${NAME} | Faith. Deliverance. Transformation.`,
    seoDescription: `${NAME} — a worldwide family of believers pursuing faith, deliverance, and transformation through Christ. HQ in The Gambia.`,
  },

  navigation: {
    links: [
      { label: "Home", href: "#home" },
      { label: "Live Service", href: "#live" },
      { label: "Services", href: "#services" },
      { label: "Bible Quotes", href: "#quotes" },
      { label: "Activities", href: "#activities" },
      { label: "Branches", href: "#branches" },
      { label: "Contact", href: "#contact" },
    ],
  },

  hero: {
    badge: "Welcome Home",
    title: "Faith, Deliverance, and Transformation Through Christ",
    subtitle: `${NAME} is a global ministry raising believers in faith, breaking chains through deliverance, and transforming lives by the power of the gospel.`,
    image: img(hero),
    imageAlt: "Worshippers raising hands before a cross",
    primaryCta: "Watch Live Service",
    secondaryCta: "Contact Us",
    secondaryHref: "#contact",
  },

  live: {
    visible: true,
    eyebrow: "Live Now",
    title: "Watch Our Live Church Service",
    subtitle:
      "Join us live for worship, deliverance, prayer, and the Word of God — wherever you are in the world.",
    videoUrl: "https://www.facebook.com/facebook/videos/10153231379946729/",
    note: "Streaming via Facebook Live",
  },

  about: {
    visible: true,
    eyebrow: "About Us",
    title: "A Global Family of Faith",
    subtitle: `${NAME} is a Christ-centered ministry committed to raising disciples, ministering deliverance, and transforming nations. From our headquarters in The Gambia, we reach communities across West Africa and beyond.`,
    highlights: [
      { text: "Headquarters in The Gambia" },
      { text: "Branches in Sierra Leone, Liberia & United Kingdom" },
      { text: "Led by Primate Desmond T. Conteh" },
    ],
    overseerImage: img(overseer),
    overseerLabel: "General Overseer",
    overseerBio: "Shepherding the global vision of faith, deliverance, and transformation through Christ.",
  },

  services: {
    visible: true,
    eyebrow: "Our Services",
    title: "Gather, Grow & Encounter God",
    subtitle: "There is a place for everyone in the family of God. Join us throughout the week.",
    items: [
      { icon: "Church", title: "Sunday Services", desc: "Gather for powerful worship and the undiluted Word of God.", time: "Sundays · 9:00 AM" },
      { icon: "Flame", title: "Deliverance Services", desc: "Breaking chains and setting captives free by the Spirit.", time: "Fridays · 6:00 PM" },
      { icon: "Music", title: "Praise & Worship", desc: "Enter His courts with thanksgiving and joyful praise.", time: "Sundays · 8:30 AM" },
      { icon: "HandHelping", title: "Prayer Meetings", desc: "Corporate intercession for families and nations.", time: "Tuesdays · 6:00 PM" },
      { icon: "BookOpen", title: "Bible Study", desc: "Grow deep in Scripture and sound doctrine.", time: "Wednesdays · 6:00 PM" },
      { icon: "Users", title: "Youth Fellowship", desc: "Raising a bold generation rooted in Christ.", time: "Saturdays · 4:00 PM" },
      { icon: "Heart", title: "Women's Fellowship", desc: "Equipping women of faith and virtue.", time: "Thursdays · 5:00 PM" },
      { icon: "Megaphone", title: "Evangelism Outreach", desc: "Taking the gospel to the streets and nations.", time: "Saturdays · 9:00 AM" },
    ],
  },

  scriptures: {
    visible: true,
    eyebrow: "The Word",
    title: "Promises to Stand On",
    subtitle: "Let these scriptures strengthen your faith and renew your hope today.",
    items: [
      { reference: "Jeremiah 29:11", text: "“For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.”" },
      { reference: "Psalm 91:1-2", text: "“Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. He is my refuge and my fortress.”" },
      { reference: "Isaiah 54:17", text: "“No weapon formed against you shall prosper, and every tongue that rises against you in judgment you shall condemn.”" },
      { reference: "John 3:16", text: "“For God so loved the world that He gave His one and only Son, that whoever believes in Him shall not perish but have eternal life.”" },
      { reference: "Philippians 4:13", text: "“I can do all things through Christ who strengthens me.”" },
    ],
  },

  activities: {
    visible: true,
    eyebrow: "What's Happening",
    title: "Upcoming & Recent Activities",
    subtitle: "From revivals to outreaches, there is always something stirring in the ministry.",
    items: [
      { image: img(activityRevival), title: "Annual Revival Program", date: "Aug 12–16, 2026", location: "HQ, The Gambia", desc: "Five nights of fire, faith, and fresh encounters with God." },
      { image: img(activityPrayer), title: "Global Prayer Conference", date: "Sep 5, 2026", location: "Online & On-site", desc: "Nations uniting in prayer for breakthrough and revival." },
      { image: img(activityCrusade), title: "Deliverance Crusade", date: "Oct 18, 2026", location: "Freetown, Sierra Leone", desc: "An open-air gathering of healing and deliverance." },
      { image: img(activityWorship), title: "Worship Night", date: "Jun 28, 2026", location: "London, UK", desc: "A night of intimate worship and the presence of God." },
      { image: img(activityOutreach), title: "Community Outreach", date: "Jul 10, 2026", location: "Monrovia, Liberia", desc: "Serving communities with love, food, and the gospel." },
      { image: img(activityYouth), title: "Youth Empowerment", date: "Aug 2, 2026", location: "HQ, The Gambia", desc: "Mentorship and skills for the next generation." },
    ],
  },

  branches: {
    visible: true,
    eyebrow: "Find Us",
    title: "Our Branches Around the World",
    subtitle: "One family, many locations. Worship with us at a branch near you.",
    items: [
      { country: "The Gambia", role: "Headquarters", address: "123 Kairaba Avenue, Banjul", contact: "+220 000 0000", time: "Sun · 9:00 AM", headquarters: true },
      { country: "Sierra Leone", role: "Branch", address: "45 Wilkinson Road, Freetown", contact: "+232 000 0000", time: "Sun · 9:30 AM", headquarters: false },
      { country: "Liberia", role: "Branch", address: "78 Tubman Blvd, Monrovia", contact: "+231 000 0000", time: "Sun · 10:00 AM", headquarters: false },
      { country: "United Kingdom", role: "Branch", address: "12 Grace Street, London", contact: "+44 0000 000000", time: "Sun · 11:00 AM", headquarters: false },
    ],
  },

  contact: {
    visible: true,
    eyebrow: "Get In Touch",
    title: "We'd Love to Hear From You",
    subtitle: "Have a prayer request, question, or want to plan a visit? Reach out and our team will respond.",
    address: "123 Kairaba Avenue, Banjul, The Gambia",
    branchContactsTitle: "Branch Contacts",
    successMessage: "Thank you! Your message has been sent. Our team will respond soon.",
  },

  socials: {
    visible: true,
    eyebrow: "Stay Connected",
    title: "Follow Our Ministry",
    subtitle: "",
    items: [
      { platform: "facebook", label: "Facebook", href: "#" },
      { platform: "youtube", label: "YouTube", href: "#" },
      { platform: "instagram", label: "Instagram", href: "#" },
      { platform: "tiktok", label: "TikTok", href: "#" },
      { platform: "whatsapp", label: "WhatsApp", href: "#" },
    ],
  },

  footer: {
    quickLinksTitle: "Quick Links",
    branchesTitle: "Branches",
    contactTitle: "Contact",
    copyright: `${NAME}. All rights reserved.`,
  },
};
