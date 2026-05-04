// RULE-005: CORS Access-Control-Allow-Origin: * on auth/admin endpoints

import type { RuleCheckInput, RuleHit } from "../engine";

const SENSITIVE_PATH_PATTERNS = [
  "/api/auth",
  "/api/admin",
  "/api/user",
  "/api/users",
  "/api/billing",
  "/api/webhook",
  "/api/settings",
];

const CORS_STAR_PATTERNS = [
  /Access-Control-Allow-Origin\s*:\s*\*/i,
  /'access-control-allow-origin'\s*,\s*'\*'/i,
  /"access-control-allow-origin"\s*,\s*"\*"/i,
  /allow_origin\s*=\s*["']\*["']/i,
  /cors\s*\(\s*\{\s*origin\s*:\s*["']\*["']/i,
  /origin:\s*["']\*["']/i,
];

export const rule005 = {
  id: "RULE-005",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];
    const lines = input.content.split("\n");

    // Check if this is a sensitive endpoint
    const isSensitive = SENSITIVE_PATH_PATTERNS.some((p) =>
      input.path.includes(p)
    );

    // Also check for CORS config files
    const isCorsConfig =
      input.path.includes("middleware") ||
      input.path.includes("cors") ||
      input.path.includes("config") ||
      input.path.endsWith(".yml") ||
      input.path.endsWith(".yaml");

    if (!isSensitive && !isCorsConfig) return hits;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of CORS_STAR_PATTERNS) {
        if (pattern.test(line)) {
          // Check if it's explicitly for localhost (lower risk)
          if (line.includes("localhost") || line.includes("127.0.0.1")) {
            continue;
          }

          hits.push({
            ruleId: "RULE-005",
            severity: "warning",
            lineStart: i + 1,
            lineEnd: i + 1,
            codeSnippet: lines.slice(Math.max(0, i - 2), i + 3).join("\n"),
            confidence: isSensitive ? 0.9 : 0.6,
            explanation: isSensitive
              ? `CORS configured with wildcard (*) on a sensitive endpoint (${input.path}). This allows any website to make authenticated requests to your API.`
              : `CORS configured with wildcard (*). Review if this is intentional.`,
          });
        }
      }
    }

    return hits;
  },
};
