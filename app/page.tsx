import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { StatusBoard } from "@/components/status-board";
import { getUpdates } from "@/lib/feed";
import { loadBoard } from "@/lib/linear";
import { hasValidSession } from "@/lib/session";
import { normalizeScope } from "@/lib/scope";
import { normalizeView } from "@/lib/views";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[]; scope?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<BoardFallback />}>
      <Board searchParams={searchParams} />
    </Suspense>
  );
}

async function Board({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[]; scope?: string | string[] }>;
}) {
  await connection();
  const [signedIn, params] = await Promise.all([hasValidSession(), searchParams]);
  if (!signedIn) redirect("/login");

  const load = await loadBoard();
  const updates = getUpdates();

  return (
    <StatusBoard
      view={normalizeView(params.view)}
      scope={normalizeScope(params.scope)}
      load={load}
      updates={updates}
    />
  );
}

function BoardFallback() {
  return (
    <div className="safe-x mx-auto max-w-3xl py-8" aria-busy="true" aria-live="polite">
      <p className="font-serif text-3xl tracking-tight">Vibrez</p>
      <p className="mt-2 text-sm text-muted-foreground">Loading the board…</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["Open", "Overdue", "Due this week", "Done"].map((label) => (
          <div key={label} className="h-20 motion-safe:animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
