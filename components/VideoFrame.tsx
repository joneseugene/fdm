import type { VideoEmbed } from "@/lib/embed";
import { cn } from "@/utils/twMerge";

/**
 * The live service player. Videos and channels are 16:9; a Facebook Page
 * feed is a tall column (Facebook caps it at 500px wide).
 */
export function VideoFrame({
  embed,
  title,
  lazy,
  className,
}: {
  embed: VideoEmbed;
  title: string;
  lazy?: boolean;
  className?: string;
}) {
  const page = embed.kind === "facebook-page";
  return (
    <div className={cn(page ? "mx-auto h-[600px] w-full max-w-[500px] bg-card" : "aspect-video w-full bg-black", className)}>
      <iframe
        title={title}
        src={embed.src}
        loading={lazy ? "lazy" : undefined}
        className="h-full w-full border-0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
