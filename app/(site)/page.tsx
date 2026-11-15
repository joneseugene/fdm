import { cacheLife } from "next/cache";

import { HomePage } from "@/components/page/HomePage";
import { getSiteContent } from "@/features/content/server/service";

/** For the footer's copyright line; checked daily. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/**
 * Fully static: built from cached content and rebuilt only when an admin
 * saves a section (or once a day for the copyright year).
 */
export default async function Page() {
  const [content, year] = await Promise.all([getSiteContent(), currentYear()]);
  return <HomePage content={content} year={year} />;
}
