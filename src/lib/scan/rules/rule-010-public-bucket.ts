// RULE-010: Public S3 / GCS bucket in IaC config files

import type { RuleCheckInput, RuleHit } from "../engine";

const PUBLIC_BUCKET_PATTERNS = [
  // AWS S3 public access
  /acl\s*=\s*["']public-read["']/i,
  /acl\s*=\s*["']public-read-write["']/i,
  /"Effect"\s*:\s*"Allow".*"Principal"\s*:\s*"\*"/s,
  /block_public_access\s*=\s*false/i,
  /restrict_public_buckets\s*=\s*false/i,
  /ignore_public_acls\s*=\s*false/i,
  // GCS public access
  /allUsers/i,
  /allAuthenticatedUsers/i,
  /"role"\s*:\s*"READER".*allUsers/s,
  // Terraform patterns
  /grant\s*\{[^}]*uri\s*=\s*["']http:\/\/acs\.amazonaws\.com\/groups\/global\/AllUsers/i,
  // CDK patterns
  /access_control\s*=\s*['"]public['"]/i,
  /BucketAccessControl\.PUBLIC_READ/i,
];

const CONFIG_FILE_EXTS = [".tf", ".hcl", ".yml", ".yaml", ".json", ".cdk", ".pulumi"];

export const rule010 = {
  id: "RULE-010",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];

    // Only check IaC config files
    const isConfigFile =
      CONFIG_FILE_EXTS.some((ext) => input.path.endsWith(ext)) ||
      input.path.includes("terraform") ||
      input.path.includes("cloudformation") ||
      input.path.includes("cdk") ||
      input.path.includes("pulumi");

    if (!isConfigFile) return hits;

    const lines = input.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of PUBLIC_BUCKET_PATTERNS) {
        if (pattern.test(line)) {
          const contextStart = Math.max(0, i - 3);
          const contextEnd = Math.min(lines.length, i + 3);
          const context = lines.slice(contextStart, contextEnd).join("\n");

          hits.push({
            ruleId: "RULE-010",
            severity: "warning",
            lineStart: i + 1,
            lineEnd: i + 1,
            codeSnippet: context,
            confidence: 0.8,
            explanation: `S3 or GCS bucket configured with public access at ${input.path}:${i + 1}. This could expose sensitive data to the internet.`,
          });
        }
      }
    }

    return hits;
  },
};
