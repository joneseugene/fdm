/**
 * Turn the link an editor pastes (a Facebook video or Page, a YouTube video,
 * live link or channel) into an embeddable player. Only Facebook and YouTube
 * are allowed, so the page can never frame an arbitrary site.
 *
 * Pure and synchronous: used by the website, the admin preview and the
 * content schema. Links that need a network lookup first (YouTube @handles,
 * fb.watch short links) are reported by `needsLookup` and converted by the
 * server (features/content/server/video.ts).
 */

export type VideoKind = "youtube-channel" | "youtube-video" | "facebook-video" | "facebook-page";
export type VideoEmbed = { kind: VideoKind; src: string };

const FACEBOOK = /(^|\.)facebook\.com$/i;
const YOUTUBE = /(^|\.)(youtube\.com|youtube-nocookie\.com)$/i;
const CHANNEL_ID = /^UC[\w-]{22}$/;
const ID = /^[\w-]+$/;

/** Accepts links pasted without https:// (or with http://); only https is ever framed. */
function parse(url: string): URL | null {
  const v = url.trim();
  if (!v || /\s/.test(v)) return null;
  try {
    const u = new URL(/^[a-z][a-z\d+.-]*:/i.test(v) ? v : `https://${v}`);
    if (u.protocol === "http:") u.protocol = "https:";
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

const isFacebook = (u: URL) => FACEBOOK.test(u.hostname);
const isYouTube = (u: URL) => YOUTUBE.test(u.hostname) || u.hostname === "youtu.be";

/** Facebook paths that are not Pages. */
const FB_RESERVED = new Set(["watch", "plugins", "share", "groups", "events", "reel", "story.php", "photo.php", "login", "home.php"]);

function facebookEmbed(u: URL): VideoEmbed | null {
  const parts = u.pathname.split("/").filter(Boolean);

  if (parts[0] === "plugins") {
    if (parts[1] === "video.php") return { kind: "facebook-video", src: u.toString() };
    if (parts[1] === "page.php") return { kind: "facebook-page", src: u.toString() };
    return null;
  }

  const video =
    (parts[0] === "watch" && u.searchParams.get("v")) ||
    (parts[0] === "reel" && parts[1]) ||
    (parts[1] === "videos" && parts.at(-1) && /^\d+$/.test(parts.at(-1)!) ? parts.at(-1) : null) ||
    (parts[0] === "video.php" && u.searchParams.get("v"));
  if (video) {
    const embed = new URL("https://www.facebook.com/plugins/video.php");
    embed.searchParams.set("href", `https://www.facebook.com${u.pathname}${u.search}`);
    embed.searchParams.set("show_text", "false");
    embed.searchParams.set("width", "1280");
    return { kind: "facebook-video", src: embed.toString() };
  }

  // A Page: facebook.com/yourpage, /yourpage/live, /yourpage/videos, /profile.php?id=…
  const isProfile = parts[0] === "profile.php" && u.searchParams.get("id");
  const isPage =
    parts.length >= 1 &&
    parts.length <= 2 &&
    !FB_RESERVED.has(parts[0]) &&
    !parts[0].endsWith(".php") &&
    (parts.length === 1 || ["live", "live_videos", "videos"].includes(parts[1]));
  if (isProfile || isPage) {
    const href = isProfile
      ? `https://www.facebook.com/profile.php?id=${u.searchParams.get("id")}`
      : `https://www.facebook.com/${parts[0]}`;
    const embed = new URL("https://www.facebook.com/plugins/page.php");
    embed.searchParams.set("href", href);
    embed.searchParams.set("tabs", "timeline");
    embed.searchParams.set("width", "500");
    embed.searchParams.set("height", "700");
    embed.searchParams.set("small_header", "true");
    embed.searchParams.set("adapt_container_width", "true");
    embed.searchParams.set("hide_cta", "true");
    return { kind: "facebook-page", src: embed.toString() };
  }
  return null;
}

function youtubeEmbed(u: URL): VideoEmbed | null {
  if (u.hostname === "youtu.be") {
    const id = u.pathname.slice(1);
    return ID.test(id) ? { kind: "youtube-video", src: `https://www.youtube.com/embed/${id}` } : null;
  }
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts[0] === "embed") {
    if (parts[1] === "live_stream" && CHANNEL_ID.test(u.searchParams.get("channel") ?? "")) {
      return { kind: "youtube-channel", src: u.toString() };
    }
    return parts[1] && ID.test(parts[1]) ? { kind: "youtube-video", src: u.toString() } : null;
  }
  if (parts[0] === "channel" && CHANNEL_ID.test(parts[1] ?? "")) {
    return { kind: "youtube-channel", src: `https://www.youtube.com/embed/live_stream?channel=${parts[1]}` };
  }
  const id = (parts[0] === "watch" && u.searchParams.get("v")) || (["live", "shorts", "v"].includes(parts[0]) && parts[1]);
  return id && ID.test(id) ? { kind: "youtube-video", src: `https://www.youtube.com/embed/${id}` } : null;
}

/** The player for a pasted link, or null when it can't be embedded as is. */
export function toVideoEmbed(url: string): VideoEmbed | null {
  const u = parse(url);
  if (!u) return null;
  if (isFacebook(u)) return facebookEmbed(u);
  if (isYouTube(u)) return youtubeEmbed(u);
  return null;
}

export const toEmbedUrl = (url: string) => toVideoEmbed(url)?.src ?? null;

/** The link as a full https URL (unchanged if it isn't one). */
export const normalizeVideoUrl = (url: string) => parse(url)?.toString() ?? url.trim();

/** Links the server can convert into an embeddable one (see server/video.ts). */
export function needsLookup(url: string): boolean {
  const u = parse(url);
  if (!u) return false;
  if (u.hostname === "fb.watch") return true;
  if (isFacebook(u)) return u.pathname.startsWith("/share/");
  if (YOUTUBE.test(u.hostname)) return /^\/(@[^/]+|c\/[^/]+|user\/[^/]+)/.test(u.pathname);
  return false;
}

/** Why a link can't be used; null when it's fine (or empty). */
export function videoUrlProblem(url: string): string | null {
  const v = url.trim();
  if (!v) return null;
  if (toVideoEmbed(v)) return null;
  if (needsLookup(v)) return "Click “Test link” to convert this link before saving.";
  if (!parse(v)) return "That doesn't look like a link. Copy it from your browser's address bar.";
  return "Use a Facebook or YouTube video, live stream, channel or Page link.";
}
