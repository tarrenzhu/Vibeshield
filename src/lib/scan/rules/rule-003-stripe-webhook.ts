// RULE-003: Stripe webhook missing constructEvent signature verification

import type { RuleCheckInput, RuleHit } from "../engine";

export const rule003 = {
  id: "RULE-003",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];

    // Check by content, not just path
    const hasStripeImport =
      input.content.includes("from") &&
      (input.content.includes('"stripe"') || input.content.includes("'stripe'"));
    // Check for actual constructEvent usage (in code, not comments)
    const hasConstructEvent =
      input.content.includes("constructEvent(") ||
      input.content.includes("constructEventAsync(") ||
      input.content.includes(".constructEvent") ||
      input.content.includes(".constructEventAsync");

    // Only flag files that import Stripe but don't verify webhooks
    if (hasStripeImport && !hasConstructEvent) {
      const lines = input.content.split("\n");
      let firstLine = 1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("import") && lines[i].includes("stripe")) {
          firstLine = i + 1;
          break;
        }
      }

      hits.push({
        ruleId: "RULE-003",
        severity: "critical",
        lineStart: firstLine,
        lineEnd: Math.min(firstLine + 10, lines.length),
        codeSnippet: lines.slice(0, Math.min(15, lines.length)).join("\n"),
        confidence: 0.9,
        explanation: `Stripe webhook handler doesn't verify the webhook signature using constructEvent(). This allows anyone to forge Stripe events.`,
      });
    }

    return hits;
  },
};
