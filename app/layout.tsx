import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { getSiteContent } from "@/features/content/server/service";
import "./globals.css";

// Self-hosted at build time: no request to Google, no layout shift.
const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteContent();
  return {
    title: { default: site.seoTitle, template: `%s · ${site.shortName}` },
    description: site.seoDescription,
    openGraph: { title: site.name, description: site.seoDescription },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
