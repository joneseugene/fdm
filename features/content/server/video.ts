import "server-only";

import { needsLookup, normalizeVideoUrl, toVideoEmbed, type VideoKind } from "@/lib/embed";
import { logger } from "@/server/core/logger";
import { AppError } from "@/server/core/errors";

/**
 * Checks a live service link for the admin's "Test link" button:
 *  - converts links that can't be embedded as they are (YouTube @handles,
 *    fb.watch and facebook.com/share short links) into ones that can;
 *  - confirms a YouTube video exists and allows embedding;
 *  - tells whether a YouTube channel is live right now.
 *
 * Only Facebook and YouTube hosts are ever fetched.
 */

export type VideoCheck = {
  /** The link to save (converted when `converted` is true). */
  url: string;
  converted: boolean;
  kind: VideoKind;
  title: string | null;
  /** YouTube channels only. */
  live: "live" | "upcoming" | "offline" | null;
};

const HEADERS = {
  "Accept-Language": "en",
  // Skips YouTube's cookie-consent page for servers in the EU.
  Cookie: "SOCS=CAI",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
};
const ALLOWED_HOST = /(^|\.)(youtube\.com|facebook\.com|fb\.watch)$/i;

type Fetched = { ok: boolean; status: number; location: string | null; body: string };

/** Fetch and read the whole body under one time limit. */
async function get(url: string, init?: RequestInit): Promise<Fetched> {
  const host = new URL(url).hostname;
  if (!ALLOWED_HOST.test(host)) throw AppError.validation("Use a Facebook or YouTube link.");
  try {
    const res = await fetch(url, { ...init, headers: HEADERS, signal: AbortSignal.timeout(20_000), cache: "no-store" });
    const body = res.status >= 300 && res.status < 400 ? "" : await res.text();
    return { ok: res.ok, status: res.status, location: res.headers.get("location"), body };
  } catch (error) {
    logger.warn("Video link check failed", { host, message: (error as Error)?.message });
    throw AppError.validation(`Couldn't reach ${host.replace(/^www\./, "")}. Check your connection and try again.`);
  }
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const metaTitle = (html: string) => {
  const t = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  return t ? decode(t) : null;
};

/** youtube.com/@handle, /c/name, /user/name → youtube.com/channel/UC… */
async function resolveYouTubeChannel(url: string): Promise<string> {
  const res = await get(url);
  const html = res.body;
  const id =
    html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1] ??
    html.match(/"externalId":"(UC[\w-]{22})"/)?.[1];
  if (!res.ok || !id) throw AppError.validation("We couldn't find that YouTube channel. Check the link and try again.");
  return `https://www.youtube.com/channel/${id}`;
}

/** fb.watch/… and facebook.com/share/… → the full video link. */
async function resolveFacebookShortLink(url: string): Promise<string> {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    const res = await get(current, { redirect: "manual" });
    const location = res.location;
    if (!location) break;
    current = new URL(location, current).toString();
    if (toVideoEmbed(current)?.kind === "facebook-video") return current;
  }
  throw AppError.validation(
    "Facebook didn't let us open this short link. Open the video on Facebook, then copy the link from the address bar (it contains /videos/ or /watch).",
  );
}

async function checkYouTubeVideo(url: string): Promise<string | null> {
  const id = toVideoEmbed(url)?.src.match(/\/embed\/([\w-]+)/)?.[1];
  if (!id) return null;
  const res = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
  if (res.status === 401 || res.status === 403) {
    throw AppError.validation("This video's owner doesn't allow it on other websites. In YouTube Studio, turn on “Allow embedding”.");
  }
  if (!res.ok) throw AppError.validation("We couldn't find this YouTube video. It may be private or deleted.");
  try {
    return (JSON.parse(res.body) as { title?: string }).title ?? null;
  } catch {
    return null;
  }
}

async function checkYouTubeChannel(url: string): Promise<Pick<VideoCheck, "title" | "live">> {
  const id = toVideoEmbed(url)?.src.match(/channel=(UC[\w-]{22})/)?.[1];
  if (!id) return { title: null, live: null };
  const res = await get(`https://www.youtube.com/channel/${id}/live`);
  if (!res.ok) throw AppError.validation("We couldn't find this YouTube channel. Check the link and try again.");
  const html = res.body;
  const onStream = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=/.test(html);
  const live = !onStream ? "offline" : /"isLive":true/.test(html) ? "live" : "upcoming";
  const channelName =
    html.match(/"ownerChannelName":"([^"]+)"/)?.[1] ??
    (onStream ? (html.match(/"author":"([^"]+)"/)?.[1] ?? null) : metaTitle(html));
  return { title: channelName, live };
}

export async function checkVideoLink(input: string): Promise<VideoCheck> {
  let url = normalizeVideoUrl(input);

  if (needsLookup(url)) {
    const host = new URL(url).hostname;
    url = /youtube/i.test(host) ? await resolveYouTubeChannel(url) : await resolveFacebookShortLink(url);
  }
  const converted = url !== input.trim();

  const embed = toVideoEmbed(url);
  if (!embed) throw AppError.validation("Use a Facebook or YouTube video, live stream, channel or Page link.");

  if (embed.kind === "youtube-video") return { url, converted, kind: embed.kind, title: await checkYouTubeVideo(url), live: null };
  if (embed.kind === "youtube-channel") return { url, converted, kind: embed.kind, ...(await checkYouTubeChannel(url)) };
  // Facebook can't be checked without a Facebook app; the preview shows the result.
  return { url, converted, kind: embed.kind, title: null, live: null };
}
