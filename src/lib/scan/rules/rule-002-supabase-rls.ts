// RULE-002: Supabase RLS not enabled OR service_role used in client code

import type { RuleCheckInput, RuleHit } from "../engine";

export const rule002 = {
  id: "RULE-002",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];
    const lines = input.content.split("\n");

    // Only check client-side files
    const isClientFile =
      input.path.endsWith(".tsx") ||
      input.path.endsWith(".jsx") ||
      (input.path.includes("/components/") &&
        (input.path.endsWith(".ts") || input.path.endsWith(".js")));

    if (!isClientFile) return hits;

    // Check whole-file patterns (not per-line)
    const hasServiceRole = input.content.includes("SUPABASE_SERVICE_ROLE_KEY");
    const hasServiceRoleToken = input.content.includes("service_role");
    const hasCreateClient = input.content.includes("createClient");

    // Check 1: service_role key used in client file
    if ((hasServiceRole || hasServiceRoleToken) && hasCreateClient) {
      // Find the line with the issue
      let hitLine = 1;
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes("SUPABASE_SERVICE_ROLE_KEY") ||
          (lines[i].includes("service_role") && lines[i].includes("eyJ"))
        ) {
          hitLine = i + 1;
          break;
        }
      }

      hits.push({
        ruleId: "RULE-002",
        severity: "critical",
        lineStart: hitLine,
        lineEnd: hitLine,
        codeSnippet: getSnippet(lines, Math.max(0, hitLine - 1)),
        confidence: 0.95,
        explanation: `Supabase service_role key used in client-side code. This gives full database access to anyone who views the page.`,
      });
    }

    // Check 2: NEXT_PUBLIC_ exposure in env files
    if (input.path.includes(".env") && !input.path.includes(".example")) {
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes("SUPABASE_SERVICE_ROLE_KEY") &&
          lines[i].includes("NEXT_PUBLIC_")
        ) {
          hits.push({
            ruleId: "RULE-002",
            severity: "critical",
            lineStart: i + 1,
            lineEnd: i + 1,
            codeSnippet: getSnippet(lines, i),
            confidence: 0.95,
            explanation: `Supabase service_role key exposed via NEXT_PUBLIC_ prefix.`,
          });
        }
      }
    }

    return hits;
  },
};

function getSnippet(lines: string[], idx: number): string {
  const start = Math.max(0, idx - 2);
  const end = Math.min(lines.length, idx + 3);
  return lines.slice(start, end).join("\n");
}
