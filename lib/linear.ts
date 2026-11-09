import { cacheLife, cacheTag } from "next/cache";
import { deriveBoard } from "./board";
import type { BoardModel } from "./types";
import type { Issue, Project } from "./types";
import { resolveLinearMode } from "./mode";
import { createSample } from "./sample";

const ENDPOINT = "https://api.linear.app/graphql";
const PAGE_SIZE = 50;
const MAX_PAGES = 8;

const QUERY = `
  query Board($cursor: String) {
    organization {
      name
      urlKey
    }
    teams(filter: { key: { eq: "VIB" } }) {
      nodes {
        id
        name
        key
        projects(first: 50) {
          nodes {
            id
            name
            progress
            state
            targetDate
          }
        }
      }
    }
    issues(
      first: ${PAGE_SIZE}
      after: $cursor
      filter: {
        team: { key: { eq: "VIB" } }
        or: [
          { state: { type: { in: ["triage", "backlog", "unstarted", "started"] } } }
          { state: { type: { eq: "completed" } }, completedAt: { gte: "-P14D" } }
          { state: { type: { eq: "completed" } }, updatedAt: { gte: "-P14D" } }
        ]
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        identifier
        title
        url
        priority
        priorityLabel
        dueDate
        completedAt
        updatedAt
        assignee { name }
        state { name type color }
        labels { nodes { name color } }
        project { id name }
      }
    }
  }
`;

export type ReadyBoard = {
  kind: "ready";
  sample: boolean;
  workspaceName: string | null;
  workspaceKey: string | null;
  teamName: string | null;
  warning: string | null;
  fetchedAt: string;
  truncated: boolean;
  board: BoardModel;
};

export type BoardLoad =
  | ReadyBoard
  | { kind: "unconfigured"; fetchedAt: string }
  | { kind: "error"; message: string; fetchedAt: string };

type RawLabel = { name?: string | null; color?: string | null };
type RawIssue = {
  id?: string | null;
  identifier?: string | null;
  title?: string | null;
  url?: string | null;
  priority?: number | null;
  priorityLabel?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
  assignee?: { name?: string | null } | null;
  state?: { name?: string | null; type?: string | null; color?: string | null } | null;
  labels?: { nodes?: RawLabel[] | null } | null;
  project?: { id?: string | null; name?: string | null } | null;
};

type RawProject = {
  id?: string | null;
  name?: string | null;
  progress?: number | null;
  state?: string | null;
  targetDate?: string | null;
};

type GqlPayload = {
  data?: {
    organization?: { name?: string | null; urlKey?: string | null } | null;
    teams?: {
      nodes?: {
        name?: string | null;
        key?: string | null;
        projects?: { nodes?: RawProject[] | null } | null;
      }[];
    } | null;
    issues?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      nodes?: RawIssue[];
    } | null;
  } | null;
  errors?: { message?: string }[];
};

const PRIORITY_LABELS: Record<number, string> = {
  0: "No priority",
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

function cleanMessage(message: string): string {
  return message.replace(/lin_api_[A-Za-z0-9_]+/g, "[redacted]").slice(0, 280);
}

function mapIssue(node: RawIssue): Issue | null {
  if (!node.id || !node.identifier) return null;
  const priority = typeof node.priority === "number" ? node.priority : 0;
  return {
    id: node.id,
    identifier: node.identifier,
    title: node.title?.trim() || node.identifier,
    url: node.url || `https://linear.app/issue/${node.identifier}`,
    priority,
    priorityLabel: node.priorityLabel?.trim() || PRIORITY_LABELS[priority] || "No priority",
    dueDate: node.dueDate ? node.dueDate.slice(0, 10) : null,
    completedAt: node.completedAt ?? null,
    updatedAt: node.updatedAt ?? new Date(0).toISOString(),
    assignee: node.assignee?.name ?? null,
    stateName: node.state?.name ?? "Unknown",
    stateType: node.state?.type ?? "unstarted",
    stateColor: node.state?.color ?? null,
    labels: (node.labels?.nodes ?? [])
      .filter((label): label is RawLabel & { name: string } => Boolean(label.name))
      .map((label) => ({ name: label.name, color: label.color ?? null })),
    projectId: node.project?.id ?? null,
    projectName: node.project?.name ?? null,
  };
}

function mapProject(node: RawProject): Project | null {
  if (!node.id || !node.name) return null;
  return {
    id: node.id,
    name: node.name,
    progress: typeof node.progress === "number" ? node.progress : null,
    state: node.state ?? null,
    targetDate: node.targetDate ? node.targetDate.slice(0, 10) : null,
  };
}

async function linearRequest(key: string, cursor: string | null): Promise<GqlPayload> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: key,
      },
      body: JSON.stringify({ query: QUERY, variables: { cursor } }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new Error(
      timedOut ? "Linear took too long to respond." : "The Linear request did not complete.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("Linear rejected LINEAR_API_KEY. Check that it can read VibrezHq.");
  }
  if (response.status === 429) {
    throw new Error("Linear rate-limited the request. Wait a minute, then refresh.");
  }
  if (!response.ok) {
    throw new Error(`Linear returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as GqlPayload;
  if (payload.errors?.length) {
    const detail = payload.errors
      .map((error) => error.message)
      .filter(Boolean)
      .join(" ");
    throw new Error(cleanMessage(detail || "Linear returned a GraphQL error."));
  }
  return payload;
}

async function fetchLive(now: Date): Promise<BoardLoad> {
  const key = process.env.LINEAR_API_KEY?.trim();
  if (!key) {
    return { kind: "unconfigured", fetchedAt: now.toISOString() };
  }

  try {
    const issues: Issue[] = [];
    const seen = new Set<string>();
    let projects: Project[] = [];
    let workspaceName: string | null = null;
    let workspaceKey: string | null = null;
    let teamName: string | null = null;
    let cursor: string | null = null;
    let truncated = false;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const payload = await linearRequest(key, cursor);
      const data = payload.data;
      if (!data) throw new Error("Linear returned an empty payload.");

      if (page === 0) {
        workspaceName = data.organization?.name ?? null;
        workspaceKey = data.organization?.urlKey ?? null;
        const team = data.teams?.nodes?.[0];
        if (!team) {
          return {
            kind: "error",
            fetchedAt: now.toISOString(),
            message:
              "No Linear team with key VIB was returned. Confirm the personal API key can access the VibrezHq workspace.",
          };
        }
        teamName = team.name ?? "Vibrez";
        projects = (team.projects?.nodes ?? [])
          .map(mapProject)
          .filter((project): project is Project => project !== null);
      }

      for (const node of data.issues?.nodes ?? []) {
        const mapped = mapIssue(node);
        if (!mapped || seen.has(mapped.id)) continue;
        seen.add(mapped.id);
        issues.push(mapped);
      }

      const pageInfo = data.issues?.pageInfo;
      if (!pageInfo?.hasNextPage || !pageInfo.endCursor) {
        truncated = false;
        break;
      }
      cursor = pageInfo.endCursor;
      truncated = page === MAX_PAGES - 1;
    }

    let warning: string | null = null;
    if (workspaceKey && !workspaceKey.toLowerCase().includes("vibrez")) {
      warning = `This key returned the “${workspaceName ?? workspaceKey}” workspace (${workspaceKey}). The board still filters to team VIB.`;
    }

    return {
      kind: "ready",
      sample: false,
      workspaceName,
      workspaceKey,
      teamName,
      warning,
      fetchedAt: now.toISOString(),
      truncated,
      board: deriveBoard(issues, projects, now),
    };
  } catch (error) {
    const message = error instanceof Error ? cleanMessage(error.message) : "Linear request failed.";
    return { kind: "error", message, fetchedAt: now.toISOString() };
  }
}

async function loadCached(mode: "mock" | "live"): Promise<BoardLoad> {
  "use cache: remote";
  cacheTag("linear-board");
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });

  const now = new Date();
  if (mode === "mock") {
    const sample = createSample(now);
    return {
      kind: "ready",
      sample: true,
      workspaceName: sample.workspaceName,
      workspaceKey: sample.workspaceKey,
      teamName: sample.teamName,
      warning: null,
      fetchedAt: now.toISOString(),
      truncated: false,
      board: deriveBoard(sample.issues, sample.projects, now),
    };
  }

  return fetchLive(now);
}

export async function loadBoard(): Promise<BoardLoad> {
  const mode = resolveLinearMode({
    MOCK_LINEAR: process.env.MOCK_LINEAR,
    LINEAR_API_KEY: process.env.LINEAR_API_KEY,
  });
  if (mode === "unconfigured") {
    return { kind: "unconfigured", fetchedAt: new Date().toISOString() };
  }
  return loadCached(mode);
}
