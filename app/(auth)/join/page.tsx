import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/config/access";
import { routes } from "@/config/routes";
import { JoinFlow } from "@/features/auth/components/join-flow";
import { displayName } from "@/features/users/schemas";
import { invitationFromToken } from "@/server/auth/invitations";

export const metadata: Metadata = { title: "Set up your account", robots: { index: false } };

/** Reached from the invitation email's link. */
export default function JoinPage({ searchParams }: PageProps<"/join">) {
  return (
    <Card>
      <Suspense fallback={<Skeleton className="m-6 h-80" />}>
        <Join searchParams={searchParams} />
      </Suspense>
    </Card>
  );
}

async function Join({ searchParams }: Pick<PageProps<"/join">, "searchParams">) {
  const { token } = await searchParams;
  const user = typeof token === "string" ? await invitationFromToken(token).catch(() => null) : null;

  if (!user || typeof token !== "string") {
    return (
      <>
        <CardHeader className="text-center">
          <LinkIcon className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <CardTitle className="text-xl">This link doesn&apos;t work</CardTitle>
          <CardDescription>
            It may have expired, been replaced by a newer email, or already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-center text-sm text-muted-foreground">
          <p>Ask your Super Admin to send you a new invitation link.</p>
          <p>
            Already set up your account?{" "}
            <Link href={routes.login} className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome, {user.firstName || "there"}</CardTitle>
        <CardDescription>Choose a password to activate your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <JoinFlow
          token={token}
          invitation={{
            name: displayName({ ...user, otherName: null }),
            email: user.email,
            roleLabel: ROLE_LABELS[user.role],
            duty: user.churchRole,
          }}
        />
      </CardContent>
    </>
  );
}
