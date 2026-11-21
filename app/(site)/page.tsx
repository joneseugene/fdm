import { cacheLife } from "next/cache";

import { HomePage } from "@/components/page/HomePage";
import type { SiteContent } from "@/features/content/schemas";
import { getSiteContent } from "@/features/content/server/service";
import { serverEnv } from "@/server/env";

/** For the footer's copyright line; checked daily. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** schema.org data so search engines can show the ministry's details. */
function structuredData({ site, socials, branches }: SiteContent) {
  const url = new URL("/", serverEnv.APP_URL).toString();
  const logo = new URL(site.logo.src, serverEnv.APP_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    name: site.name,
    alternateName: site.shortName,
    description: site.seoDescription,
    url,
    logo,
    image: new URL("/opengraph-image.png", serverEnv.APP_URL).toString(),
    ...(site.email && { email: site.email }),
    ...(site.phone && { telephone: site.phone }),
    ...(site.overseer && { founder: { "@type": "Person", name: site.overseer } }),
    address: { "@type": "PostalAddress", addressCountry: site.headquarters },
    ...(socials.items.length > 0 && { sameAs: socials.items.map((s) => s.href).filter((h) => /^https?:\/\//.test(h)) }),
    ...(branches.items.length > 0 && {
      subOrganization: branches.items.map((b) => ({
        "@type": "Church",
        name: `${site.shortName} ${b.country}`,
        address: { "@type": "PostalAddress", streetAddress: b.address, addressCountry: b.country },
        ...(b.contact && { telephone: b.contact }),
      })),
    }),
  };
}

/**
 * Fully static: built from cached content and rebuilt only when an admin
 * publishes a section (or once a day for the copyright year).
 */
export default async function Page() {
  const [content, year] = await Promise.all([getSiteContent(), currentYear()]);
  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so content can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(content)).replace(/</g, "\\u003c") }}
      />
      <HomePage content={content} year={year} />
    </>
  );
}
