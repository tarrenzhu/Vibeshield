// RULE-006: SQL string concatenation with user input (potential SQL injection)

import type { RuleCheckInput, RuleHit } from "../engine";

const SQL_CONCAT_PATTERNS = [
  // Template literals with SQL keywords
  /`\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s+/i,
  // String concatenation with SQL
  /["']\s*(SELECT|INSERT|UPDATE|DELETE)\s.*\+/i,
  // Direct string building
  /\.(query|execute|raw)\s*\(\s*[`"'].*(SELECT|INSERT|UPDATE|DELETE)/i,
  // ORM raw queries with template
  /\.(raw|queryRaw|executeRaw|query_raw)\s*\(\s*`/i,
  // Prisma $queryRaw with template
  /\$queryRaw\s*`/i,
  /\$executeRaw\s*`/i,
];

export const rule006 = {
  id: "RULE-006",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];
    const lines = input.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of SQL_CONCAT_PATTERNS) {
        if (pattern.test(line)) {
          // Check if it uses parameterized queries
          const contextStart = Math.max(0, i - 3);
          const contextEnd = Math.min(lines.length, i + 4);
          const context = lines.slice(contextStart, contextEnd).join("\n");

          // Skip if it uses parameterized patterns
          if (
            context.includes("$1") ||
            context.includes("$2") ||
            context.includes("?") ||
            context.includes(":param") ||
            context.includes("Params") ||
            context.includes("parametrize")
          ) {
            continue;
          }

          hits.push({
            ruleId: "RULE-006",
            severity: "critical",
            lineStart: i + 1,
            lineEnd: i + 1,
            codeSnippet: context,
            confidence: 0.7,
            explanation: `SQL query built via string concatenation at ${input.path}:${i + 1}. This may allow SQL injection if user input is interpolated.`,
          });
        }
      }
    }

    return hits;
  },
};
