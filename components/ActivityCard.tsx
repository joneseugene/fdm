import Image, { StaticImageData } from "next/image";
import { Calendar, MapPin } from "lucide-react";

interface ActivityCardProps {
  image: string | StaticImageData;
  title: string;
  date: string;
  location: string;
  desc: string;
}

export function ActivityCard({
  image,
  title,
  date,
  location,
  desc,
}: ActivityCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </span>

          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-foreground">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {desc}
        </p>
      </div>
    </article>
  );
}