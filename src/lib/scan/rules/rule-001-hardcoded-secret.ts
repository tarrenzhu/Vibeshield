// RULE-001: Hardcoded secrets (API keys, tokens, passwords)
// Combines regex patterns + Shannon entropy detection

import type { RuleCheckInput, RuleHit } from "../engine";

// Known secret patterns
const SECRET_PATTERNS: Array<{ name: string; regex: RegExp; severity: "critical" }> = [
  // Supabase
  { name: "Supabase service_role key", regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, severity: "critical" },
  // Stripe
  { name: "Stripe secret key", regex: /sk_live_[A-Za-z0-9]{24,}/, severity: "critical" },
  { name: "Stripe test key", regex: /sk_test_[A-Za-z0-9]{24,}/, severity: "critical" },
  // OpenAI
  { name: "OpenAI API key", regex: /sk-[A-Za-z0-9]{32,}/, severity: "critical" },
  { name: "OpenAI project key", regex: /sk-proj-[A-Za-z0-9_-]{32,}/, severity: "critical" },
  // AWS
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/, severity: "critical" },
  { name: "AWS Secret Key", regex: /["'](?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z0-9+\/]{40}["']/, severity: "critical" },
  // GitHub
  { name: "GitHub token", regex: /ghp_[A-Za-z0-9]{36}/, severity: "critical" },
  { name: "GitHub PAT", regex: /github_pat_[A-Za-z0-9_]{22,}/, severity: "critical" },
  // Generic
  { name: "Generic API key assignment", regex: /(api[_-]?key|apikey|secret[_-]?key|access[_-]?key)\s*[:=]\s*["'][A-Za-z0-9_-]{20,}["']/i, severity: "critical" },
  { name: "Password in code", regex: /(password|passwd|pwd)\s*[:=]\s*["'][^"'\s]{4,}["']/i, severity: "critical" },
  { name: "JWT token", regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, severity: "critical" },
];

// Shannon entropy calculation
function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((sum, count) => {
    const p = count / len;
    return sum + p * Math.log2(p);
  }, 0);
}

function getCodeSnippet(lines: string[], lineIdx: number): string {
  const start = Math.max(0, lineIdx - 2);
  const end = Math.min(lines.length, lineIdx + 3);
  return lines.slice(start, end).join("\n");
}

export const rule001 = {
  id: "RULE-001",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];
    const lines = input.content.split("\n");

    // Skip common false-positive files
    if (
      input.path.endsWith(".d.ts") ||
      input.path.includes("node_modules") ||
      input.path.endsWith("package-lock.json") ||
      input.path.endsWith("pnpm-lock.yaml")
    ) {
      return hits;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip comments
      const trimmed = line.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("--")
      ) {
        continue;
      }

      // Check known patterns
      for (const pattern of SECRET_PATTERNS) {
        const match = pattern.regex.exec(line);
        if (match) {
          // Avoid false positives: skip .env.example and test fixtures
          if (
            input.path.includes(".env.example") ||
            input.path.includes(".example") ||
            input.path.includes("test/") ||
            input.path.includes("__tests__") ||
            input.path.includes("fixture")
          ) {
            continue;
          }

          hits.push({
            ruleId: "RULE-001",
            severity: pattern.severity,
            lineStart: i + 1,
            lineEnd: i + 1,
            codeSnippet: getCodeSnippet(lines, i),
            confidence: 0.9,
            explanation: `Found ${pattern.name} in ${input.path}:${i + 1}`,
          });
          break; // One hit per line
        }
      }

      // High-entropy string detection (for unknown secret formats)
      // Only check strings that are long enough
      const stringMatch = line.match(/["'][A-Za-z0-9+/=_-]{32,}["']/);
      if (stringMatch && !SECRET_PATTERNS.some((p) => p.regex.test(line))) {
        const entropy = shannonEntropy(stringMatch[0].slice(1, -1));
        if (entropy > 4.5) {
          // Check if variable name suggests it's a secret
          const varNameMatch = line.match(
            /(?:const|let|var|export)?\s*(\w*(?:key|secret|token|password|auth)\w*)\s*[:=]/i
          );
          const confidence = varNameMatch ? 0.7 : 0.5;

          hits.push({
            ruleId: "RULE-001",
            severity: "critical",
            lineStart: i + 1,
            lineEnd: i + 1,
            codeSnippet: getCodeSnippet(lines, i),
            confidence,
            explanation: `High-entropy string detected (entropy: ${entropy.toFixed(2)}). May be a hardcoded secret.`,
          });
        }
      }
    }

    return hits;
  },
};
