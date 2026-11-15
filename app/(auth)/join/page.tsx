import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JoinFlow } from "@/features/auth/components/join-flow";
import { invitedUserFromTicket } from "@/server/auth/invitations";

export const metadata: Metadata = { title: "Accept invitation", robots: { index: false } };

/** Reached from the invitation email: confirm the code, then set up the account. */
export default function JoinPage({ searchParams }: PageProps<"/join">) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Join the website admin</CardTitle>
        <CardDescription>Confirm your email, then set up your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Join searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function Join({ searchParams }: Pick<PageProps<"/join">, "searchParams">) {
  const [{ email }, jar] = await Promise.all([searchParams, cookies()]);
  // Came back after confirming the code (e.g. a page refresh): skip to the profile step.
  const ticket = jar.get("fdm_join")?.value;
  const confirmed = ticket ? await invitedUserFromTicket(ticket).catch(() => null) : null;
  return (
    <JoinFlow
      initialEmail={typeof email === "string" ? email : ""}
      confirmedEmail={confirmed?.email ?? null}
    />
  );
}
