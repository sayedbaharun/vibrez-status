import { Badge } from "@/components/ui/badge";
import { formatLondonDay } from "@/lib/dates";
import type { BotUpdate } from "@/lib/updates";
import { EmptyNote } from "./issue-list";

export function UpdatesFeed({ updates }: { updates: BotUpdate[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Bot updates</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Short notes committed in data/updates.json. They are not pulled from Linear.
        </p>
      </div>
      {updates.length === 0 ? (
        <EmptyNote>No updates yet. Add one to data/updates.json and deploy.</EmptyNote>
      ) : (
        <ol className="space-y-4">
          {updates.map((update) => (
            <li key={`${update.date}-${update.title}`} className="rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <time dateTime={update.date}>{formatLondonDay(update.date)}</time>
                <span aria-hidden="true">·</span>
                <span>{update.source}</span>
                {update.source.toLowerCase() === "example" ? (
                  <Badge variant="outline">Example</Badge>
                ) : null}
              </div>
              <h3 className="mt-2 text-base font-medium">{update.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{update.detail}</p>
              {update.link ? (
                <a
                  href={update.link}
                  className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open link
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
