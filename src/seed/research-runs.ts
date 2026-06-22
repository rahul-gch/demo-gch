export type ResearchCandidate = {
  source: "network" | "ai";
  id?: string;
  name: string;
  country: string;
  city?: string;
  entityType: string;
  materials?: string[];
  capabilities?: string[];
  moq?: string;
  leadTimeDays?: number;
  certifications?: string[];
  rationale?: string;
  sourceUrl?: string;
  matchScore?: number;
};

export type ResearchRun = {
  id: string;
  orgId: string;
  query: string;
  params: {
    countries: string;
    industry: string;
    entityType: string;
    limit: number;
  };
  createdAt: number;
  status: "running" | "done" | "failed";
  error?: string;
  results: ResearchCandidate[];
};

const KEY = "gch:research-runs:v1";

function load(): ResearchRun[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as ResearchRun[];
  } catch {
    return [];
  }
}

function save(runs: ResearchRun[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(runs));
  window.dispatchEvent(new CustomEvent("gch:research-runs"));
}

export function getRunsForOrg(orgId: string): ResearchRun[] {
  return load()
    .filter((r) => r.orgId === orgId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function createRun(run: ResearchRun) {
  const runs = load();
  runs.push(run);
  save(runs);
}

export function updateRun(id: string, patch: Partial<ResearchRun>) {
  const runs = load().map((r) => (r.id === id ? { ...r, ...patch } : r));
  save(runs);
}

export function deleteRun(id: string) {
  save(load().filter((r) => r.id !== id));
}
