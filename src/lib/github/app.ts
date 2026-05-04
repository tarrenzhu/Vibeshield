// ============================================
// GitHub App helpers
// ============================================

import { createAppAuth } from "@octokit/auth-app";

export function getGitHubAppAuth() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY");
  }

  return createAppAuth({
    appId,
    privateKey,
  });
}

export async function getInstallationToken(
  installationId: number
): Promise<string> {
  const auth = getGitHubAppAuth();
  const { token } = await auth({ type: "installation", installationId });
  return token;
}

// Verify GitHub webhook signature
import crypto from "crypto";

export function verifyGitHubWebhook(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
