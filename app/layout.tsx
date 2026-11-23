import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { getSiteContent } from "@/features/content/server/service";
import { serverEnv } from "@/server/env";
import "./globals.css";

// Self-hosted at build time: no request to Google, no layout shift.
const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

/**
 * Site-wide SEO. Title and description come from Admin > Ministry details.
 * Icons (favicon.ico, icon.png, apple-icon.png) and the share image
 * (opengraph-image.png + .alt.txt) are file conventions in this folder.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteContent();
  return {
    metadataBase: new URL(serverEnv.APP_URL),
    title: { default: site.seoTitle, template: `%s · ${site.shortName}` },
    description: site.seoDescription,
    applicationName: site.name,
    keywords: [site.name, site.shortName, "church", "ministry", "deliverance", "faith", site.headquarters].filter(Boolean),
    authors: [{ name: site.name }],
    creator: site.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: site.name,
      title: site.seoTitle,
      description: site.seoDescription,
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: site.seoTitle,
      description: site.seoDescription,
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets sticky bars sit above the iPhone home indicator (env(safe-area-inset-bottom)).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F1" },
    { media: "(prefers-color-scheme: dark)", color: "#1F1912" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
