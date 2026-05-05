// ============================================
// Run Scan API — POST /api/scan/run
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getReposByOrg, getOrCreateOrg } from "@/lib/db/repositories";
import { runScan } from "@/lib/scan/engine";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let repoId: string;
  try {
    const body = await request.json();
    repoId = body.repoId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!repoId) {
    return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
  }

  try {
    const email = user.emailAddresses[0]?.emailAddress ?? "";
    const { orgId } = await getOrCreateOrg(userId, email);
    const repos = await getReposByOrg(orgId);
    const repo = repos.find((r) => r.id === repoId);

    if (!repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }

    // Run the scan
    const result = await runScan(
      repo.id,
      repo.full_name,
      repo.default_branch || "main",
      repo.github_installation_id ?? 0
    );

    return NextResponse.json({
      success: true,
      message: `Scanned ${repo.full_name}`,
      findings: result.findings.length,
      critical: result.findings.filter((f) => f.severity === "critical").length,
      warning: result.findings.filter((f) => f.severity === "warning").length,
    });
  } catch (err: any) {
    console.error("Scan run error:", err);
    return NextResponse.json({
      error: err.message || "Scan failed",
    }, { status: 500 });
  }
}
