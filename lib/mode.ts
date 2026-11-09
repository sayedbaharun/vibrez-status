export type LinearMode = "mock" | "live" | "unconfigured";

export function resolveLinearMode(env: {
  MOCK_LINEAR?: string;
  LINEAR_API_KEY?: string;
}): LinearMode {
  const mock = env.MOCK_LINEAR?.trim().toLowerCase();
  if (mock === "1" || mock === "true" || mock === "yes") return "mock";
  if (env.LINEAR_API_KEY?.trim()) return "live";
  return "unconfigured";
}
