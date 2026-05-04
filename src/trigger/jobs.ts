// ============================================
// Trigger.dev Jobs
// ============================================

import { task } from "@trigger.dev/sdk/v3";

export const runScanJob = task({
  id: "run-scan",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    repoId: string;
    repoFullName: string;
    commitSha: string;
    installationId: number;
  }) => {
    const { runScan } = await import("@/lib/scan/engine");

    const result = await runScan(
      payload.repoId,
      payload.repoFullName,
      payload.commitSha,
      payload.installationId
    );

    return {
      findingsCount: result.findings.length,
      critical: result.findings.filter((f) => f.severity === "critical").length,
      warning: result.findings.filter((f) => f.severity === "warning").length,
    };
  },
});

export const autoFixPrJob = task({
  id: "auto-fix-pr",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { findingId: string }) => {
    // TODO(human): Implement auto-fix PR logic in Phase 5
    // 1. Clone repo
    // 2. Run Claude-powered patcher
    // 3. Apply patch to new branch
    // 4. Push and open PR via Octokit
    return { prUrl: null };
  },
});
