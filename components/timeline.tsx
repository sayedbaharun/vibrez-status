import { addCalendarDays, formatLondonDay, londonDate } from "@/lib/dates";
import type { TimelineDay } from "@/lib/types";
import { EmptyNote, IssueList } from "./issue-list";

export function Timeline({
  days,
  now,
  showTeam = false,
}: {
  days: TimelineDay[];
  now: string;
  showTeam?: boolean;
}) {
  const today = londonDate(new Date(now));
  const tomorrow = addCalendarDays(today, 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Next 14 days</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Open issues with a due date from today through the next two weeks, London dates. Past-due
          work stays on Overview.
        </p>
      </div>
      {days.length === 0 ? (
        <EmptyNote>Nothing is due in the next 14 days.</EmptyNote>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day.date}>
              <h3 className="mb-1 text-sm font-medium">
                {day.date === today ? "Today · " : day.date === tomorrow ? "Tomorrow · " : ""}
                {formatLondonDay(day.date)}
              </h3>
              <IssueList issues={day.issues} showTeam={showTeam} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
