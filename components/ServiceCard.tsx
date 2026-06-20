import * as Icons from "lucide-react";

interface ServiceCardProps {
  icon: string;
  title: string;
  desc: string;
  time: string;
}

export function ServiceCard({ icon, title, desc, time }: ServiceCardProps) {
  const Icon = (Icons[icon as keyof typeof Icons] ?? Icons.Church) as Icons.LucideIcon;
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary-foreground transition-colors group-hover:bg-primary">
        <Icon className="h-6 w-6 text-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <p className="mt-4 text-sm font-semibold text-foreground/80">{time}</p>
    </div>
  );
}
