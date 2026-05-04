// RULE-009: /api/admin/* paths without auth check

import type { RuleCheckInput, RuleHit } from "../engine";

// Auth-related words that indicate proper auth checks
// Must match whole words, not substrings
const AUTH_WORDS = [
  "authenticate", "withAuth", "requireAuth", "protect",
  "getServerSession", "getSession", "clerkClient", "currentUser",
  "isAuthenticated", "authorize", "permission", "isAdmin",
  "getToken", "verifyToken", "authMiddleware",
];

export const rule009 = {
  id: "RULE-009",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];
    const lines = input.content.split("\n");

    // Only check admin API routes
    const isAdminRoute =
      input.path.includes("/api/admin") ||
      input.path.includes("/admin/api") ||
      input.path.includes("admin/route");

    if (!isAdminRoute) return hits;

    // Check if any auth middleware/check is present as whole words
    const hasAuthCheck = AUTH_WORDS.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`);
      return regex.test(input.content);
    });

    if (!hasAuthCheck) {
      // Find the handler function
      let handlerLine = 1;
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes("export") &&
          (lines[i].includes("async function") || lines[i].includes("function"))
        ) {
          handlerLine = i + 1;
          break;
        }
      }

      hits.push({
        ruleId: "RULE-009",
        severity: "critical",
        lineStart: handlerLine,
        lineEnd: Math.min(handlerLine + 10, lines.length),
        codeSnippet: lines.slice(0, Math.min(15, lines.length)).join("\n"),
        confidence: 0.85,
        explanation: `Admin API route appears to have no authentication check. Anyone can access this endpoint.`,
      });
    }

    return hits;
  },
};
