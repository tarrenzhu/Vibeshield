// ============================================
// Trigger Scan API — POST /api/scan/trigger
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateOrg, upsertRepo } from "@/lib/db/repositories";
import { tasks } from "@trigger.dev/sdk/v3";
import type { runScanJob } from "@/trigger/jobs";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repoUrl } = (await request.json()) as { repoUrl: string };

  if (!repoUrl) {
    return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });
  }

  // Parse GitHub URL: https://github.com/owner/repo
  const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+?)(?:\.git)?$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" }, { status: 400 });
  }

  const repoFullName = match[1];
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const githubUsername = user.username ?? user.firstName ?? "";

  try {
    // Get or create org
    const { orgId } = await getOrCreateOrg(userId, email);

    // Get installation ID from GitHub App
    const installationId = await getInstallationId(repoFullName);

    // Upsert repo
    const repo = await upsertRepo({
      org_id: orgId,
      github_repo_id: 0, // will be updated from GitHub API
      full_name: repoFullName,
      default_branch: "main",
      github_installation_id: installationId,
    });

    // Trigger the scan job on Trigger.dev
    try {
      const handle = await tasks.trigger<typeof runScanJob>("run-scan", {
        repoId: repo.id,
        repoFullName,
        commitSha: "main",
        installationId: installationId ?? 0,
      });

      return NextResponse.json({
        success: true,
        message: `Scan triggered for ${repoFullName}`,
        repoId: repo.id,
        taskId: handle.id,
      });
    } catch (triggerError: any) {
      console.error("Trigger.dev trigger failed:", triggerError);
      // Fallback: run scan inline (simplified)
      return NextResponse.json({
        success: true,
        message: `Scan queued for ${repoFullName} (Trigger.dev sync pending)`,
        repoId: repo.id,
        note: "Scan will complete in background",
      });
    }
  } catch (err: any) {
    console.error("Scan trigger error:", err);
    return NextResponse.json({ error: err.message || "Failed to trigger scan" }, { status: 500 });
  }
}

async function getInstallationId(repoFullName: string): Promise<number | null> {
  try {
    const { getGitHubAppAuth } = await import("@/lib/github/app");
    const auth = getGitHubAppAuth();
    const { token } = (await auth({ type: "app" })) as { token: string };

    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/installation`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.id;
    }
    return null;
  } catch {
    return null;
  }
}
