import Image from "next/image";
import Link from "next/link";

import { Toaster } from "@/components/ui/sonner";
import logo from "@/public/logo.png";

/** Centered card layout for sign-in and password recovery (public pages). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-ui flex flex-1 flex-col items-center justify-center gap-6 bg-cream px-4 py-12">
      <Link href="/" aria-label="Back to the website">
        <Image src={logo} alt="" width={56} height={56} className="size-14 rounded-xl" preload />
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="text-xs text-muted-foreground">Website administration</p>
      <Toaster position="top-center" />
    </main>
  );
}
