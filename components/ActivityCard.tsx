import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";

import type { ImageAsset } from "@/features/content/schemas";

interface ActivityCardProps {
  image: ImageAsset;
  title: string;
  date: string;
  location: string;
  desc: string;
}

export function ActivityCard({ image, title, date, location, desc }: ActivityCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={image.src}
          alt={title}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          placeholder={image.blurDataURL ? "blur" : "empty"}
          blurDataURL={image.blurDataURL || undefined}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
          {date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold text-foreground">{title}</h3>
        {desc && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
    </article>
  );
}
