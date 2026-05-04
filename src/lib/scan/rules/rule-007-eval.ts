// RULE-007: eval() / new Function() with user input

import type { RuleCheckInput, RuleHit } from "../engine";

export const rule007 = {
  id: "RULE-007",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];
    const lines = input.content.split("\n");

    // Skip test files and node_modules
    if (input.path.includes("test") || input.path.includes("spec")) return hits;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

      // Check for eval()
      if (/\beval\s*\(/.test(trimmed)) {
        // Check if the argument could contain user input
        const contextStart = Math.max(0, i - 3);
        const contextEnd = Math.min(lines.length, i + 4);
        const context = lines.slice(contextStart, contextEnd).join("\n");

        const hasUserInput =
          context.includes("req.") ||
          context.includes("request.") ||
          context.includes("body.") ||
          context.includes("params.") ||
          context.includes("query.") ||
          context.includes("input") ||
          context.includes("user") ||
          context.includes("ctx.");

        hits.push({
          ruleId: "RULE-007",
          severity: "critical",
          lineStart: i + 1,
          lineEnd: i + 1,
          codeSnippet: context,
          confidence: hasUserInput ? 0.95 : 0.6,
          explanation: hasUserInput
            ? `eval() used with user-controlled input. This allows arbitrary code execution (RCE).`
            : `eval() detected. Review if the argument is user-controlled. eval() with untrusted input is a critical remote code execution vector.`,
        });
      }

      // Check for new Function()
      if (/\bnew\s+Function\s*\(/.test(trimmed)) {
        const contextStart = Math.max(0, i - 2);
        const contextEnd = Math.min(lines.length, i + 4);
        const context = lines.slice(contextStart, contextEnd).join("\n");

        const hasUserInput =
          context.includes("req.") || context.includes("request.") ||
          context.includes("params.") || context.includes("query.");

        hits.push({
          ruleId: "RULE-007",
          severity: "critical",
          lineStart: i + 1,
          lineEnd: i + 1,
          codeSnippet: context,
          confidence: hasUserInput ? 0.95 : 0.6,
          explanation: `new Function() used with potentially user-controlled input. Equivalent to eval() — allows arbitrary code execution.`,
        });
      }
    }

    return hits;
  },
};
