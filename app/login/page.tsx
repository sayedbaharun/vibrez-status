import { Suspense } from "react";
import { connection } from "next/server";
import { login } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-sm text-muted-foreground">Loading…</p>}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const error = first(params.error);
  const nextPath = safeNextPath(first(params.next));
  const configured = Boolean(process.env.SITE_PASSWORD);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Vibrez</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Private status for Sayed Baharun. The board is read-only and not public.
          </p>
        </div>
        <ThemeToggle />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Unlock</CardTitle>
          <CardDescription>
            {configured
              ? "Enter the site password. It stays in an httpOnly cookie on this device."
              : "SITE_PASSWORD is not set on the server, so the board cannot be opened."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <p className="text-sm leading-6 text-muted-foreground" role="status">
              Add SITE_PASSWORD in the Vercel project environment, or in .env.local for local use,
              then restart. Also set LINEAR_API_KEY, or MOCK_LINEAR=1 for sample data.
            </p>
          ) : (
            <form action={login} className="space-y-4">
              {error === "invalid" ? (
                <p className="text-sm text-destructive" role="alert">
                  That password does not match.
                </p>
              ) : null}
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11"
                />
              </div>
              <Button type="submit" className="h-11 w-full">
                Unlock
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
