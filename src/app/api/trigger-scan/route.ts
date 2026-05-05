// ============================================
// Trigger Scan API — POST /api/scan/trigger
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateOrg, upsertRepo } from "@/lib/db/repositories";
import { runScan } from "@/lib/scan/engine";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let repoUrl: string;
  try {
    const body = await request.json();
    repoUrl = body.repoUrl;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!repoUrl) {
    return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });
  }

  const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+?)(?:\.git)?$/);
  if (!match) {
    return NextResponse.json({
      error: "Invalid GitHub URL. Use format: https://github.com/owner/repo",
    }, { status: 400 });
  }

  const repoFullName = match[1];
  const email = user.emailAddresses[0]?.emailAddress ?? "";

  try {
    const { orgId } = await getOrCreateOrg(userId, email);
    const repo = await upsertRepo({
      org_id: orgId,
      github_repo_id: 0,
      full_name: repoFullName,
      default_branch: "main",
      github_installation_id: null,
    });

    // Run scan immediately
    const result = await runScan(
      repo.id,
      repoFullName,
      "main",
      0
    );

    return NextResponse.json({
      success: true,
      message: `✅ Scanned ${repoFullName}`,
      repoId: repo.id,
      findings: result.findings.length,
      critical: result.findings.filter((f) => f.severity === "critical").length,
      warning: result.findings.filter((f) => f.severity === "warning").length,
    });
  } catch (err: any) {
    console.error("Scan trigger error:", err);
    return NextResponse.json({
      error: err.message || "Failed to scan repository",
    }, { status: 500 });
  }
}
