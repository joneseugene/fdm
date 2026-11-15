import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = { title: "Set your password", robots: { index: false } };

/** Reached from a reset email or an invitation email. */
export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Choose a password</CardTitle>
        <CardDescription>You&apos;ll use it with your email to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <TokenForm searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function TokenForm({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        This link is incomplete.{" "}
        <Link href={routes.forgotPassword} className="font-medium text-foreground underline-offset-4 hover:underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }
  return <ResetPasswordForm token={token} />;
}
