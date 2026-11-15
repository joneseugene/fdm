import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

export default function ForbiddenPage() {
  return (
    <div className="grid justify-items-center gap-3 py-20 text-center">
      <ShieldX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="text-sm text-muted-foreground">Ask an administrator if you need it.</p>
      <Button asChild variant="outline" className="mt-2">
        <Link href={routes.admin}>Back to dashboard</Link>
      </Button>
    </div>
  );
}
