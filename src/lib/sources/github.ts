export type GitHubAlert = {
  repo: string;
  type: "security" | "issue" | "build-failure" | "open-pr";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  url: string;
  createdAt: string | null;
};

export type GitHubFetchResult = {
  alerts: GitHubAlert[];
  reposChecked: number;
  reposFailed: number;
  scannedCount: number;
};

// Active and warm repos to monitor
const MONITORED_REPOS = [
  // 🔴 Active
  "roleplaying",
  "chapterhouse",
  "NextChapterHomeschool",
  // 🟡 Warm
  "agentsvercel",
  "arms-of-deliverance",
  "BibleSAAS",
  "talesofoldendays",
  "1stgradescienceexample",
  "FoodHistory",
  "mythology",
  "2026worksheets",
];

const OWNER = "TheAccidentalTeacher";
const BASE = "https://api.github.com";

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Chapterhouse/1.0",
  };
}

async function fetchRepoIssues(
  repo: string,
  token: string
): Promise<GitHubAlert[]> {
  const url = `${BASE}/repos/${OWNER}/${repo}/issues?state=open&per_page=5&sort=updated`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (!res.ok) return [];

  const issues = (await res.json()) as Array<{
    title: string;
    html_url: string;
    created_at: string;
    pull_request?: unknown;
    labels: Array<{ name: string }>;
  }>;

  return issues
    .filter((i) => !i.pull_request) // Exclude PRs from issues list
    .slice(0, 3)
    .map((issue) => ({
      repo,
      type: "issue" as const,
      severity: "low" as const,
      title: issue.title,
      url: issue.html_url,
      createdAt: issue.created_at,
    }));
}

async function fetchDependabotAlerts(
  repo: string,
  token: string
): Promise<GitHubAlert[]> {
  const url = `${BASE}/repos/${OWNER}/${repo}/dependabot/alerts?state=open&per_page=5`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  // 404 = Dependabot not enabled on this repo — fine
  if (!res.ok) return [];

  const alerts = (await res.json()) as Array<{
    number: number;
    html_url: string;
    created_at: string;
    security_advisory: {
      summary: string;
      severity: string;
    };
  }>;

  return alerts.slice(0, 5).map((alert) => {
    const sev = alert.security_advisory?.severity?.toLowerCase();
    const severity: GitHubAlert["severity"] =
      sev === "critical"
        ? "critical"
        : sev === "high"
        ? "high"
        : sev === "moderate" || sev === "medium"
        ? "medium"
        : "low";

    return {
      repo,
      type: "security" as const,
      severity,
      title: `[SECURITY] ${alert.security_advisory?.summary ?? "Dependabot alert"}`,
      url: alert.html_url,
      createdAt: alert.created_at,
    };
  });
}

async function fetchFailedWorkflows(
  repo: string,
  token: string
): Promise<GitHubAlert[]> {
  // Only check runs from the past 48 hours
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const url = `${BASE}/repos/${OWNER}/${repo}/actions/runs?status=failure&per_page=3&created=%3E${since}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    workflow_runs?: Array<{
      name: string;
      html_url: string;
      created_at: string;
    }>;
  };

  return (data.workflow_runs ?? []).slice(0, 2).map((run) => ({
    repo,
    type: "build-failure" as const,
    severity: "high" as const,
    title: `[BUILD FAILED] ${run.name}`,
    url: run.html_url,
    createdAt: run.created_at,
  }));
}

async function checkRepo(
  repo: string,
  token: string
): Promise<{ alerts: GitHubAlert[]; failed: boolean }> {
  try {
    const [issues, security, builds] = await Promise.all([
      fetchRepoIssues(repo, token),
      fetchDependabotAlerts(repo, token),
      fetchFailedWorkflows(repo, token),
    ]);
    return { alerts: [...security, ...builds, ...issues], failed: false };
  } catch {
    return { alerts: [], failed: true };
  }
}

export async function fetchGitHubAlerts(): Promise<GitHubFetchResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      alerts: [],
      reposChecked: 0,
      reposFailed: 0,
      scannedCount: 0,
    };
  }

  const results = await Promise.allSettled(
    MONITORED_REPOS.map((repo) => checkRepo(repo, token))
  );

  let reposFailed = 0;
  const allAlerts: GitHubAlert[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.failed) reposFailed++;
      allAlerts.push(...result.value.alerts);
    } else {
      reposFailed++;
    }
  }

  // Sort: security first, then build failures, then issues; within type, critical/high first
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const typeOrder = { security: 0, "build-failure": 1, issue: 2, "open-pr": 3 };

  allAlerts.sort((a, b) => {
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    alerts: allAlerts,
    reposChecked: MONITORED_REPOS.length,
    reposFailed,
    scannedCount: allAlerts.length,
  };
}

export function formatGitHubAlertsForPrompt(alerts: GitHubAlert[]): string {
  if (alerts.length === 0) {
    return "\n## GitHub Repos\nAll monitored repos are clean — no open security alerts or failed builds.";
  }

  const lines = ["\n## GitHub Repos"];

  const security = alerts.filter((a) => a.type === "security");
  const builds = alerts.filter((a) => a.type === "build-failure");
  const issues = alerts.filter((a) => a.type === "issue");

  if (security.length) {
    lines.push(`\n### 🔴 Security Alerts (${security.length})`);
    for (const a of security) {
      lines.push(`- **${a.repo}**: ${a.title} — ${a.url}`);
    }
  }

  if (builds.length) {
    lines.push(`\n### 🔴 Failed Builds (${builds.length})`);
    for (const a of builds) {
      lines.push(`- **${a.repo}**: ${a.title} — ${a.url}`);
    }
  }

  if (issues.length) {
    lines.push(`\n### 🟡 Open Issues (${issues.length})`);
    for (const a of issues) {
      lines.push(`- **${a.repo}**: ${a.title} — ${a.url}`);
    }
  }

  return lines.join("\n");
}
