import { overallStatus, type HealthCheck, type HealthStatus } from "@/lib/health";
import { cn } from "cn";

const DOT: Record<HealthStatus, string> = {
  ok: "bg-success",
  warn: "bg-warning",
  fail: "bg-destructive",
};

const WORD: Record<HealthStatus, string> = {
  ok: "OK",
  warn: "Check",
  fail: "Problem",
};

function Dot({ status }: { status: HealthStatus }) {
  return (
    <span aria-hidden="true" className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT[status])} />
  );
}

function summary(checks: HealthCheck[]): string {
  const fails = checks.filter((check) => check.status === "fail").length;
  const warns = checks.filter((check) => check.status === "warn").length;
  if (fails === 0 && warns === 0) return "All systems OK";
  const parts: string[] = [];
  if (fails > 0) parts.push(`${fails} ${fails === 1 ? "problem" : "problems"}`);
  if (warns > 0) parts.push(`${warns} to check`);
  return `Needs a look: ${parts.join(", ")}`;
}

/** "Is it working?" panel. One line when all is well; open when anything needs a look. */
export function HealthPanel({ checks }: { checks: HealthCheck[] }) {
  const overall = overallStatus(checks);

  return (
    <details
      open={overall !== "ok"}
      className="group mb-4 rounded-xl border border-border bg-card text-card-foreground"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
        <Dot status={overall} />
        <span className="min-w-0 flex-1 font-medium">{summary(checks)}</span>
        <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden text-xs text-muted-foreground group-open:inline">Hide</span>
      </summary>
      <ul className="divide-y divide-border border-t border-border">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 px-3 py-2 text-sm">
            <span className="mt-[0.3rem] flex">
              <Dot status={check.status} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium">{check.label}</span>
              <span className="sr-only">: {WORD[check.status]}.</span>{" "}
              {check.href ? (
                <a
                  href={check.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words text-muted-foreground underline underline-offset-2"
                >
                  {check.detail}
                </a>
              ) : (
                <span className="break-words text-muted-foreground">{check.detail}</span>
              )}
            </span>
            <span
              className={cn(
                "shrink-0 text-xs tracking-wide uppercase",
                check.status === "ok" && "text-muted-foreground",
                check.status === "warn" && "text-foreground",
                check.status === "fail" && "text-destructive",
              )}
              aria-hidden="true"
            >
              {WORD[check.status]}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
