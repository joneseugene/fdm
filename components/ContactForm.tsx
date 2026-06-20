import { useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const field =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input required placeholder="Full name" className={field} />
        <input required type="email" placeholder="Email address" className={field} />
      </div>
      <input type="tel" placeholder="Phone number" className={field} />
      <textarea required rows={5} placeholder="Your message" className={field} />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-95 sm:w-auto"
      >
        <Send className="h-4 w-4" />
        {submitted ? "Message sent!" : "Send Message"}
      </button>
    </form>
  );
}
