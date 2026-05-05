import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  if (!_client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase URL and service role key are required");
    }
    _client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

// ============================================
// Types
// ============================================

export interface Repo {
  id: string;
  org_id: string;
  github_repo_id: number;
  full_name: string;
  default_branch: string;
  github_installation_id: number | null;
  last_scan_at: string | null;
}

export interface Scan {
  id: string;
  repo_id: string;
  commit_sha: string;
  status: "pending" | "running" | "done" | "failed";
  started_at: string;
  finished_at: string | null;
  total_findings: number;
  critical_count: number;
  warning_count: number;
}

export interface Finding {
  id: string;
  scan_id: string;
  rule_id: string;
  severity: "critical" | "warning" | "info";
  file_path: string;
  line_start: number;
  line_end: number;
  code_snippet: string | null;
  explanation_md: string | null;
  fix_prompt_md: string | null;
  status: "open" | "fixed" | "false_positive" | "wont_fix";
}

// ============================================
// Repos
// ============================================

export async function getRepoById(repoId: string): Promise<Repo | null> {
  const { data } = await db().from("repos").select("*").eq("id", repoId).single();
  return data;
}

export async function getReposByOrg(orgId: string): Promise<Repo[]> {
  const { data } = await db().from("repos").select("*").eq("org_id", orgId)
    .order("last_scan_at", { ascending: false });
  return data ?? [];
}

export async function getRepoByFullName(fullName: string): Promise<Repo | null> {
  const { data } = await db().from("repos").select("*").eq("full_name", fullName).single();
  return data;
}

export async function upsertRepo(repo: Omit<Repo, "id" | "last_scan_at">) {
  // Check if repo already exists by full_name
  const existing = await getRepoByFullName(repo.full_name);
  if (existing) return existing;

  const { data, error } = await db().from("repos").insert({
    github_repo_id: repo.github_repo_id,
    org_id: repo.org_id,
    full_name: repo.full_name,
    default_branch: repo.default_branch,
    github_installation_id: repo.github_installation_id,
  }).select().single();

  if (error) throw error;
  return data;
}

export async function updateRepoLastScan(repoId: string) {
  await db().from("repos").update({ last_scan_at: new Date().toISOString() }).eq("id", repoId);
}

// ============================================
// Scans
// ============================================

export async function createScan(repoId: string, commitSha: string): Promise<Scan> {
  const { data, error } = await db().from("scans").insert({
    repo_id: repoId,
    commit_sha: commitSha,
    status: "running",
  }).select().single();

  if (error) throw error;
  return data;
}

export async function updateScanStatus(
  scanId: string,
  status: Scan["status"],
  counts?: { total: number; critical: number; warning: number }
) {
  const update: Record<string, unknown> = { status };
  if (status === "done" || status === "failed") {
    update.finished_at = new Date().toISOString();
  }
  if (counts) {
    update.total_findings = counts.total;
    update.critical_count = counts.critical;
    update.warning_count = counts.warning;
  }
  await db().from("scans").update(update).eq("id", scanId);
}

export async function getScansByRepo(repoId: string): Promise<Scan[]> {
  const { data } = await db().from("scans").select("*").eq("repo_id", repoId)
    .order("started_at", { ascending: false });
  return data ?? [];
}

// ============================================
// Findings
// ============================================

export async function insertFindings(findings: Omit<Finding, "id" | "status">[]) {
  if (findings.length === 0) return [];
  const { data, error } = await db().from("findings").insert(findings).select();
  if (error) throw error;
  return data;
}

export async function getFindingsByScan(scanId: string): Promise<Finding[]> {
  const { data } = await db().from("findings").select("*").eq("scan_id", scanId)
    .order("severity", { ascending: true })
    .order("file_path");
  return data ?? [];
}

export async function updateFindingStatus(findingId: string, status: Finding["status"]) {
  await db().from("findings").update({ status }).eq("id", findingId);
}

// ============================================
// Orgs / Users
// ============================================

export async function getOrCreateOrg(clerkId: string, email: string): Promise<{ orgId: string }> {
  let { data: user } = await db().from("users").select("id").eq("clerk_id", clerkId).single();

  if (!user) {
    const { data: newUser } = await db().from("users").insert({
      clerk_id: clerkId,
      email,
    }).select("id").single();
    user = newUser;
  }

  if (!user) throw new Error("Failed to create user");

  const { data: member } = await db().from("org_members").select("org_id")
    .eq("user_id", user.id).single();

  if (member) return { orgId: member.org_id };

  const { data: org } = await db().from("orgs").insert({
    name: email.split("@")[0],
    plan: "free",
  }).select("id").single();

  if (!org) throw new Error("Failed to create org");

  await db().from("org_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
  });

  return { orgId: org.id };
}
