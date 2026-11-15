/**
 * Turn the link an editor pastes (a Facebook video/page, a YouTube video,
 * live link or channel) into an embeddable player URL. Only Facebook and
 * YouTube are allowed, so the page can never frame an arbitrary site.
 */

const FACEBOOK = /(^|\.)facebook\.com$/i;
const YOUTUBE = /(^|\.)(youtube\.com|youtube-nocookie\.com)$/i;

function parse(url: string): URL | null {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

export function isSupportedVideoUrl(url: string): boolean {
  const u = parse(url);
  return Boolean(u && (FACEBOOK.test(u.hostname) || YOUTUBE.test(u.hostname) || u.hostname === "youtu.be"));
}

export function toEmbedUrl(url: string): string | null {
  const u = parse(url);
  if (!u) return null;

  if (FACEBOOK.test(u.hostname)) {
    if (u.pathname.startsWith("/plugins/")) return u.toString();
    const embed = new URL("https://www.facebook.com/plugins/video.php");
    embed.searchParams.set("href", u.toString());
    embed.searchParams.set("show_text", "false");
    embed.searchParams.set("width", "560");
    return embed.toString();
  }

  let id: string | null = null;
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  else if (YOUTUBE.test(u.hostname)) {
    if (u.pathname.startsWith("/embed/")) return u.toString();
    const channel = u.pathname.match(/^\/channel\/([\w-]+)/)?.[1];
    if (channel) return `https://www.youtube.com/embed/live_stream?channel=${channel}`;
    id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:live|shorts)\/([\w-]+)/)?.[1] ?? null;
  }
  return id && /^[\w-]+$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
}
