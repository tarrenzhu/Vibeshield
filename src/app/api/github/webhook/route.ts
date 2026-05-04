// ============================================
// GitHub Webhook Receiver
// POST /api/github/webhook
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { verifyGitHubWebhook } from "@/lib/github/app";
import { upsertRepo } from "@/lib/db/repositories";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  // Verify webhook signature
  if (!verifyGitHubWebhook(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "";
  const body = JSON.parse(payload);

  try {
    switch (event) {
      case "installation": {
        await handleInstallation(body);
        break;
      }
      case "push": {
        await handlePush(body);
        break;
      }
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleInstallation(body: {
  action: string;
  installation: { id: number; account: { login: string } };
  repositories?: Array<{ id: number; full_name: string; default_branch: string }>;
}) {
  if (body.action === "created" && body.repositories) {
    const { getOrCreateOrg } = await import("@/lib/db/repositories");
    // TODO(human): Map installation to the correct org
    // For now, use the sender's GitHub username to find/create org

    for (const repo of body.repositories) {
      await upsertRepo({
        org_id: "", // Will be filled once we have org mapping
        github_repo_id: repo.id,
        full_name: repo.full_name,
        default_branch: repo.default_branch || "main",
        github_installation_id: body.installation.id,
      });
    }
  }
}

async function handlePush(body: {
  repository: { id: number; full_name: string; default_branch: string };
  ref: string;
  after: string;
  installation: { id: number };
}) {
  const ref = body.ref;
  const defaultBranch = `refs/heads/${body.repository.default_branch}`;

  // Only trigger scan on default branch pushes
  if (ref !== defaultBranch) return;

  const { getRepoByFullName } = await import("@/lib/db/repositories");
  const repo = await getRepoByFullName(body.repository.full_name);

  if (!repo) {
    console.log(`Repo not found: ${body.repository.full_name}`);
    return;
  }

  // Enqueue Trigger.dev scan job
  const { runScanJob } = await import("@/trigger/jobs");
  await runScanJob.trigger({
    repoId: repo.id,
    repoFullName: body.repository.full_name,
    commitSha: body.after,
    installationId: body.installation.id,
  });
}
