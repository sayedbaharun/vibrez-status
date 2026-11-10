import type { Issue, Project, TeamKey } from "./types";

export const SCOPES = [
  { id: "all", label: "All" },
  { id: "vibrez", label: "Vibrez" },
  { id: "personal", label: "Personal" },
] as const;

export type ScopeId = (typeof SCOPES)[number]["id"];

export const TEAM_LABELS: Record<TeamKey, string> = {
  VIB: "Vibrez",
  PER: "Personal",
};

const SCOPE_TEAM: Record<Exclude<ScopeId, "all">, TeamKey> = {
  vibrez: "VIB",
  personal: "PER",
};

export function normalizeScope(value: string | string[] | undefined): ScopeId {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  if (SCOPES.some((scope) => scope.id === raw)) return raw as ScopeId;
  return "all";
}

export function inScope(scope: ScopeId, teamKey: TeamKey): boolean {
  return scope === "all" || SCOPE_TEAM[scope] === teamKey;
}

export function filterByScope<T extends Issue | Project>(items: T[], scope: ScopeId): T[] {
  return items.filter((item) => inScope(scope, item.teamKey));
}

/** Builds a board URL that keeps both the tab and the scope. Defaults are left out. */
export function boardHref(view: string, scope: ScopeId): string {
  const params = new URLSearchParams();
  if (view !== "overview") params.set("view", view);
  if (scope !== "all") params.set("scope", scope);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
