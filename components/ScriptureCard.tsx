import { Quote } from "lucide-react";

interface ScriptureCardProps {
  reference: string;
  text: string;
}

export function ScriptureCard({ reference, text }: ScriptureCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
      <Quote className="h-8 w-8 text-primary" />
      <p className="mt-4 flex-1 font-display text-lg leading-relaxed text-foreground">{text}</p>
      <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{reference}</p>
    </div>
  );
}
