// RULE-004: API route without rate limiting (heuristic)
// Checks Next.js route handlers and Express/Koa routes for rate limiter middleware

import type { RuleCheckInput, RuleHit } from "../engine";

const RATE_LIMIT_KEYWORDS = [
  "rateLimit",
  "rate_limit",
  "rate-limit",
  "ratelimit",
  "RateLimiter",
  "throttle",
  "Throttle",
  "bottleneck",
  "express-rate-limit",
  "@upstash/ratelimit",
  "@upstash/redis",
  "vercel/kv",
  "lru-cache",
];

export const rule004 = {
  id: "RULE-004",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];

    // Only check API route files
    const isApiRoute =
      input.path.includes("/api/") ||
      input.path.includes("/routes/") ||
      input.path.endsWith("route.ts") ||
      input.path.endsWith("route.js");

    if (!isApiRoute) return hits;

    const content = input.content;
    const lines = content.split("\n");

    // Check if this is a handler function (POST, GET, etc.)
    const hasHandler =
      content.includes("export async function") ||
      content.includes("export function") ||
      content.includes("async function") ||
      content.includes("router.") ||
      content.includes("app.");

    if (!hasHandler) return hits;

    // Check for rate limiting middleware
    const hasRateLimit = RATE_LIMIT_KEYWORDS.some((kw) => content.includes(kw));

    if (!hasRateLimit) {
      // This is a heuristic — LLM-as-judge target
      hits.push({
        ruleId: "RULE-004",
        severity: "warning",
        lineStart: 1,
        lineEnd: Math.min(10, lines.length),
        codeSnippet: lines.slice(0, Math.min(10, lines.length)).join("\n"),
        confidence: 0.4, // Low confidence — needs LLM verification
        explanation: `API route may not have rate limiting protection. Without rate limiting, attackers can brute-force or spam this endpoint.`,
      });
    }

    return hits;
  },
};
