"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormContext, useWatch, type FieldValues } from "react-hook-form";
import { CheckCircle2, CircleAlert, ExternalLink, Info, Radio, Search } from "lucide-react";
import { toast } from "sonner";

import { VideoFrame } from "@/components/VideoFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { needsLookup, normalizeVideoUrl, toVideoEmbed, type VideoKind } from "@/lib/embed";
import { cn } from "@/utils/twMerge";
import { checkVideoLinkAction } from "../actions";

type Check = Awaited<ReturnType<typeof checkVideoLinkAction>>;
type CheckState = { url: string; result: Check } | null;

/** What each kind of link does on the website, in plain words. */
const KIND: Record<VideoKind, { label: string; how: string; tone: "good" | "note" }> = {
  "youtube-channel": {
    label: "YouTube channel",
    how: "Set once: the player always shows whatever this channel is streaming live. When you're not live it shows your next scheduled stream or a short message.",
    tone: "good",
  },
  "youtube-video": {
    label: "YouTube video",
    how: "Shows this one video or stream. Paste the new link before each service — or use your channel link (youtube.com/@yourchurch) so it updates by itself.",
    tone: "note",
  },
  "facebook-video": {
    label: "Facebook video",
    how: "Shows this one video or stream. Facebook gives every live stream a new link, so paste the new one before each service. The video must be Public.",
    tone: "note",
  },
  "facebook-page": {
    label: "Facebook Page",
    how: "Shows your Page's latest posts; a live stream appears at the top while you're live. The Page must be public. For a full-size player, paste the live video's own link.",
    tone: "good",
  },
};

const LIVE_BADGE = {
  live: { label: "Live now", className: "bg-red-600 text-white hover:bg-red-600" },
  upcoming: { label: "Stream scheduled", className: "bg-amber-500 text-white hover:bg-amber-500" },
  offline: { label: "Not live right now", className: "" },
} as const;

/**
 * The live service link: paste a link, see the player exactly as visitors
 * will, and "Test link" to convert short links and check it on YouTube.
 */
export function LiveVideoField({ name }: { name: string }) {
  const form = useFormContext<FieldValues>();
  const value = (useWatch({ control: form.control, name }) as string | undefined) ?? "";
  const visible = useWatch({ control: form.control, name: "visible" }) as boolean | undefined;
  const [check, setCheck] = useState<CheckState>(null);
  const [checking, startCheck] = useTransition();

  // Wait for typing to settle before (re)loading the player.
  const [previewUrl, setPreviewUrl] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setPreviewUrl(value.trim()), 600);
    return () => clearTimeout(t);
  }, [value]);
  const embed = previewUrl ? toVideoEmbed(previewUrl) : null;
  const current = check && check.url === value.trim() ? check.result : null;

  function test(url = value) {
    const link = url.trim();
    if (!link) {
      form.setError(name, { type: "manual", message: "Paste a link first" });
      return;
    }
    startCheck(async () => {
      let result: Check;
      try {
        result = await checkVideoLinkAction({ url: link });
      } catch {
        toast.error("Couldn't test the link. Check your connection and try again.");
        return;
      }
      if (!result.ok) {
        form.setError(name, { type: "manual", message: result.error.message });
        setCheck(null);
        return;
      }
      const saved = result.data.url;
      if (saved !== link) {
        form.setValue(name, saved, { shouldDirty: true, shouldValidate: true });
        setPreviewUrl(saved);
        toast.success("Link converted so it can be shown on the website.");
      } else {
        form.clearErrors(name);
      }
      setCheck({ url: saved, result });
    });
  }

  const ok = current?.ok ? current.data : null;
  const kind = ok?.kind ?? embed?.kind;

  return (
    <div className="grid grid-cols-1 gap-4">
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Facebook or YouTube link</FormLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <FormControl>
                <Input
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="https://www.youtube.com/@yourchurch"
                  {...field}
                  value={field.value ?? ""}
                  onBlur={() => {
                    field.onBlur();
                    // Short links can't be shown as they are: convert them straight away.
                    if (needsLookup(value) && !checking) test();
                  }}
                />
              </FormControl>
              <Button type="button" variant="outline" className="shrink-0" loading={checking} onClick={() => test()}>
                <Search /> Test link
              </Button>
            </div>
            <FormDescription>
              Best: your YouTube channel (youtube.com/@yourchurch) — set it once and the live stream shows automatically every
              service. Facebook video, live and Page links work too. Leave empty to hide the live section and buttons.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {kind && (
        <div
          className={cn(
            "grid gap-2 rounded-lg border p-3 text-sm",
            KIND[kind].tone === "good" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5",
          )}
        >
          <div className="flex flex-wrap items-center gap-2 font-medium">
            {ok ? (
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
            ) : (
              <Info className="size-4 text-muted-foreground" aria-hidden />
            )}
            {KIND[kind].label}
            {ok?.live && (
              <Badge className={cn("gap-1", LIVE_BADGE[ok.live].className)} variant={ok.live === "offline" ? "outline" : "default"}>
                {ok.live === "live" && <Radio className="size-3" />}
                {LIVE_BADGE[ok.live].label}
              </Badge>
            )}
            {ok && <span className="font-normal text-muted-foreground">· link works</span>}
          </div>
          {ok?.title && <p className="truncate text-muted-foreground">“{ok.title}”</p>}
          <p className="text-muted-foreground">{KIND[kind].how}</p>
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Preview</span>
          {embed && (
            <a
              href={normalizeVideoUrl(previewUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open on {embed.kind.startsWith("youtube") ? "YouTube" : "Facebook"} <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        {embed ? (
          <div className={cn("overflow-hidden rounded-lg border bg-muted", embed.kind === "facebook-page" && "mx-auto w-full max-w-[500px]")}>
            <VideoFrame key={embed.src} embed={embed} title="Live service preview" />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {previewUrl ? (
              <span className="inline-flex items-center gap-2">
                <CircleAlert className="size-4 shrink-0" />
                {needsLookup(previewUrl) ? "Click “Test link” to convert this link." : "This link can't be shown. Try another one."}
              </span>
            ) : (
              "Paste a link above to see the player here."
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          This is exactly what visitors see.
          {visible === false && " The section is hidden right now — turn on “Show this section” to put it on the website."}
        </p>
      </div>
    </div>
  );
}
