"use client";

import { Button } from "@/components/ui/button";

export default function BoardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <h1 className="font-serif text-3xl tracking-tight">The board hit a snag</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Try again. If it keeps failing, check that LINEAR_API_KEY and SITE_PASSWORD are set on the
        server.
      </p>
      <Button type="button" className="mt-6 h-11 w-fit" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
