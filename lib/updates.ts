const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type BotUpdate = {
  date: string;
  source: string;
  title: string;
  detail: string;
  link?: string;
};

export function parseUpdates(value: unknown): BotUpdate[] {
  if (!Array.isArray(value)) return [];

  const entries: BotUpdate[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.date !== "string" ||
      !ISO_DATE.test(row.date) ||
      typeof row.source !== "string" ||
      row.source.trim() === "" ||
      typeof row.title !== "string" ||
      row.title.trim() === "" ||
      typeof row.detail !== "string" ||
      row.detail.trim() === ""
    ) {
      continue;
    }

    const link =
      typeof row.link === "string" && row.link.trim() !== "" ? row.link.trim() : undefined;
    entries.push({
      date: row.date,
      source: row.source.trim(),
      title: row.title.trim(),
      detail: row.detail.trim(),
      link,
    });
  }

  return entries.sort(
    (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
  );
}
