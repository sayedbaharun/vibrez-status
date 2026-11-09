export const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "sayed", label: "Needs Sayed" },
  { id: "agents", label: "Agents" },
  { id: "blocked", label: "Blocked" },
  { id: "timeline", label: "Timeline" },
  { id: "done", label: "Done" },
  { id: "updates", label: "Updates" },
] as const;

export type ViewId = (typeof VIEWS)[number]["id"];

export function normalizeView(value: string | string[] | undefined): ViewId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (VIEWS.some((view) => view.id === raw)) return raw as ViewId;
  return "overview";
}
