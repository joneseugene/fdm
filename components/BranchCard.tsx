import { MapPin, Phone, Clock } from "lucide-react";

interface BranchCardProps {
  country: string;
  role: string;
  address: string;
  contact: string;
  time: string;
}

export function BranchCard({ country, role, address, contact, time }: BranchCardProps) {
  const isHQ = role === "Headquarters";
  return (
    <div className={`rounded-2xl border p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${isHQ ? "border-primary/50 bg-accent" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">{country}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isHQ ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
          {role}
        </span>
      </div>
      <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground/70" /> {address}</li>
        <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary-foreground/70" /> {contact}</li>
        <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-primary-foreground/70" /> {time}</li>
      </ul>
    </div>
  );
}
