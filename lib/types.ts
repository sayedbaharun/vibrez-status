export type Label = {
  name: string;
  color: string | null;
};

export type TeamKey = "VIB" | "PER";

export type Issue = {
  id: string;
  teamKey: TeamKey;
  identifier: string;
  title: string;
  url: string;
  priority: number;
  priorityLabel: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: string | null;
  stateName: string;
  stateType: string;
  stateColor: string | null;
  labels: Label[];
  projectId: string | null;
  projectName: string | null;
};

export type Project = {
  id: string;
  teamKey: TeamKey;
  name: string;
  progress: number | null;
  state: string | null;
  targetDate: string | null;
};

export type BoardIssue = Issue & {
  overdue: boolean;
};

export type StatusCount = {
  name: string;
  count: number;
  color: string | null;
};

export type ProjectProgress = {
  id: string;
  teamKey: TeamKey;
  name: string;
  percent: number | null;
  state: string | null;
  targetDate: string | null;
};

export type TimelineDay = {
  date: string;
  issues: BoardIssue[];
};

export type BoardModel = {
  counts: {
    open: number;
    overdue: number;
    dueThisWeek: number;
    doneLast7Days: number;
  };
  byStatus: StatusCount[];
  projects: ProjectProgress[];
  needsSayed: BoardIssue[];
  agents: BoardIssue[];
  blocked: BoardIssue[];
  overdueIssues: BoardIssue[];
  timeline: TimelineDay[];
  done: BoardIssue[];
};
