import Link from "next/link";
import { logout, refreshBoard } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deriveBoard } from "@/lib/board";
import { formatLondonStamp } from "@/lib/dates";
import { buildHealth, type HealthCheck } from "@/lib/health";
import type { BoardLoad } from "@/lib/linear";
import type { BoardIssue, BoardModel } from "@/lib/types";
import type { BotUpdate } from "@/lib/updates";
import { SCOPES, boardHref, filterByScope, type ScopeId } from "@/lib/scope";
import { VIEWS, type ViewId } from "@/lib/views";
import { HealthPanel } from "./health-panel";
import { EmptyNote, IssueList } from "./issue-list";
import { Overview } from "./overview";
import { LogOut } from "lucide-react";
import { RefreshButton } from "./refresh-button";
import { SectionNav } from "./section-nav";
import { ThemeToggle } from "./theme-toggle";
import { Timeline } from "./timeline";
import { UpdatesFeed } from "./updates-feed";

const SCOPE_TEXT: Record<ScopeId, string> = {
  all: "teams VIB and PER",
  vibrez: "team VIB (Vibrez)",
  personal: "team PER (Personal)",
};

function healthFor(load: BoardLoad): HealthCheck[] {
  const now = new Date(load.fetchedAt);
  if (load.kind === "ready") {
    return buildHealth({ ok: true, issues: [...load.issues, ...load.alarms] }, now);
  }
  if (load.kind === "error") return buildHealth({ ok: false, error: load.message }, now);
  return buildHealth({ ok: false, error: "LINEAR_API_KEY is not set on the server." }, now);
}

export function StatusBoard({
  view,
  scope,
  load,
  updates,
}: {
  view: ViewId;
  scope: ScopeId;
  load: BoardLoad;
  updates: BotUpdate[];
}) {
  const board =
    load.kind === "ready"
      ? deriveBoard(
          filterByScope(load.issues, scope),
          filterByScope(load.projects, scope),
          new Date(load.fetchedAt),
        )
      : null;
  const showTeam = scope === "all";
  const health = healthFor(load);

  return (
    <div className="min-h-dvh">
      <a
        href="#board"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to the board
      </a>
      <header className="safe-x mx-auto max-w-3xl pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-3xl leading-none tracking-tight">Vibrez</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Status · Europe/London
                {load.kind === "ready" ? (
                  <>
                    {" "}
                    · {load.workspaceName ?? "VibrezHq"}
                  </>
                ) : (
                  " · VibrezHq"
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <form action={refreshBoard}>
                <RefreshButton />
              </form>
              <ThemeToggle />
              <form action={logout}>
                <Button
                  type="submit"
                  variant="outline"
                  className="size-11 p-0 sm:w-auto sm:px-3"
                  aria-label="Log out"
                >
                  <LogOut className="size-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </form>
            </div>
          </div>
          {load.kind === "ready" ? (
            <p className="text-xs text-muted-foreground">
              As of {formatLondonStamp(new Date(load.fetchedAt))}. Refreshes about every 5 minutes.
              {load.sample ? (
                <>
                  {" "}
                  <Badge variant="outline">Sample</Badge>
                </>
              ) : null}
            </p>
          ) : null}
          <nav aria-label="Scope" className="flex gap-1 self-start rounded-full bg-secondary p-1">
            {SCOPES.map((item) => {
              const current = item.id === scope;
              return (
                <Link
                  key={item.id}
                  href={boardHref(view, item.id)}
                  aria-current={current ? "page" : undefined}
                  className={
                    current
                      ? "inline-flex h-9 items-center rounded-full bg-card px-3 text-sm font-medium text-foreground shadow-sm"
                      : "inline-flex h-9 items-center rounded-full px-3 text-sm text-secondary-foreground"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="sticky top-0 z-20 mt-2 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="safe-x mx-auto max-w-3xl">
          <SectionNav>
            {VIEWS.map((item) => {
              const current = item.id === view;
              const count = countFor(item.id, board);
              return (
                <Link
                  key={item.id}
                  href={boardHref(item.id, scope)}
                  aria-current={current ? "page" : undefined}
                  className={
                    current
                      ? "inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-3 text-sm text-primary-foreground"
                      : "inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-secondary px-3 text-sm text-secondary-foreground"
                  }
                >
                  {item.label}
                  {count != null ? <span className="tabular-nums">{count}</span> : null}
                </Link>
              );
            })}
          </SectionNav>
        </div>
      </div>

      <main id="board" className="safe-x safe-bottom mx-auto max-w-3xl pt-6">
        <HealthPanel checks={health} />
        {load.kind === "ready" && load.sample ? (
          <p
            role="status"
            className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm leading-6 text-foreground"
          >
            <strong>Sample data.</strong> MOCK_LINEAR is on, so these issues are fictional and are
            not from the Vibrez Linear workspace. Turn it off and set LINEAR_API_KEY to read live
            work.
          </p>
        ) : null}
        {load.kind === "ready" && load.warning ? (
          <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm leading-6">{load.warning}</p>
        ) : null}
        {load.kind === "ready" && load.truncated ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Showing the first {load.issueLimit} matching issues.
          </p>
        ) : null}

        {view === "updates" ? (
          <UpdatesFeed updates={updates} />
        ) : load.kind === "unconfigured" ? (
          <ConnectionMessage kind="unconfigured" />
        ) : load.kind === "error" ? (
          <ConnectionMessage kind="error" message={load.message} />
        ) : !board ? null : view === "overview" ? (
          <Overview board={board} scopeText={SCOPE_TEXT[scope]} showTeam={showTeam} />
        ) : view === "sayed" ? (
          <IssueSection
            title="Needs Sayed"
            hint="Open issues labelled needs-sayed or human-only, soonest due date first. Overdue rows are marked."
            empty="Nothing is waiting on Sayed."
            showTeam={showTeam}
            issues={board.needsSayed}
          />
        ) : view === "agents" ? (
          <IssueSection
            title="Agents can finish"
            hint="Open issues labelled agent-can-finish, with their current status."
            empty="No open issues are labelled agent-can-finish."
            showTeam={showTeam}
            issues={board.agents}
          />
        ) : view === "blocked" ? (
          <IssueSection
            title="Blocked / Needs Review"
            hint="Issues whose status is blocked, or exactly Needs Review."
            empty="Nothing is blocked or in Needs Review."
            showTeam={showTeam}
            issues={board.blocked}
          />
        ) : view === "timeline" ? (
          <Timeline days={board.timeline} now={load.fetchedAt} showTeam={showTeam} />
        ) : (
          <IssueSection
            title="Recently done"
            hint="Completed in the last 7 London days. Accepted counts, and so does any other state of type completed."
            empty="Nothing was completed in the last 7 days."
            showTeam={showTeam}
            issues={board.done}
          />
        )}
      </main>
    </div>
  );
}

function countFor(view: ViewId, board: BoardModel | null): number | null {
  if (!board) return null;
  if (view === "sayed") return board.needsSayed.length;
  if (view === "agents") return board.agents.length;
  if (view === "blocked") return board.blocked.length;
  if (view === "done") return board.done.length;
  return null;
}

function IssueSection({
  title,
  hint,
  empty,
  issues,
  showTeam,
}: {
  title: string;
  hint: string;
  empty: string;
  issues: BoardIssue[];
  showTeam: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{hint}</p>
      </div>
      {issues.length === 0 ? <EmptyNote>{empty}</EmptyNote> : <IssueList issues={issues} showTeam={showTeam} />}
    </div>
  );
}

function ConnectionMessage({
  kind,
  message,
}: {
  kind: "unconfigured" | "error";
  message?: string;
}) {
  if (kind === "unconfigured") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linear is not connected</CardTitle>
          <CardDescription>
            Set LINEAR_API_KEY on the server to a Linear personal API key that can read the
            VibrezHq workspace, teams VIB and PER. The key stays on the server and is never sent to the
            browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          To preview the layout without a key, set MOCK_LINEAR=1. That shows fictional sample data
          and labels it as sample. Bot updates still work from the Updates tab.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linear did not load</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        Use Refresh to ask again. If the key was just added, redeploy first so the server can see
        it.
      </CardContent>
    </Card>
  );
}
