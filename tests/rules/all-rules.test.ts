import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { rule001 } from "../../src/lib/scan/rules/rule-001-hardcoded-secret";
import { rule002 } from "../../src/lib/scan/rules/rule-002-supabase-rls";
import { rule003 } from "../../src/lib/scan/rules/rule-003-stripe-webhook";
import { rule006 } from "../../src/lib/scan/rules/rule-006-sql-injection";
import { rule007 } from "../../src/lib/scan/rules/rule-007-eval";
import { rule005 } from "../../src/lib/scan/rules/rule-005-cors";
import { rule009 } from "../../src/lib/scan/rules/rule-009-admin-api";

const FIXTURES = path.join(__dirname, "..", "fixtures");

function readFixture(name: string): { content: string; input: { path: string; content: string; repoPath: string } } {
  const content = fs.readFileSync(path.join(FIXTURES, name), "utf-8");
  return {
    content,
    input: { path: name, content, repoPath: "/tmp/test-repo" },
  };
}

describe("RULE-001: Hardcoded Secrets", () => {
  it("detects Supabase service_role key", async () => {
    const { input } = readFixture("hardcoded-secret.ts");
    const hits = await rule001.check(input);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.some((h) => h.explanation?.includes("Supabase"))).toBe(true);
  });

  it("returns no hits on clean code", async () => {
    const { input } = readFixture("clean.ts");
    const hits = await rule001.check(input);
    expect(hits.length).toBe(0);
  });
});

describe("RULE-002: Supabase RLS", () => {
  it("detects service_role in client code", async () => {
    const { input } = readFixture("supabase-leak.tsx");
    const hits = await rule002.check(input);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.some((h) => h.severity === "critical")).toBe(true);
  });

  it("returns no hits on clean code", async () => {
    const { input } = readFixture("clean.ts");
    const hits = await rule002.check(input);
    expect(hits.length).toBe(0);
  });
});

describe("RULE-003: Stripe Webhook Signature", () => {
  it("detects missing constructEvent", async () => {
    const { input } = readFixture("stripe-no-verify.ts");
    const hits = await rule003.check(input);
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });

  it("passes when constructEvent is used", async () => {
    const { input } = readFixture("stripe-verified.ts");
    const hits = await rule003.check(input);
    expect(hits.length).toBe(0);
  });
});

describe("RULE-006: SQL Injection", () => {
  it("detects SQL string concatenation", async () => {
    const { input } = readFixture("sql-injection.ts");
    const hits = await rule006.check(input);
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });

  it("returns no hits on clean code", async () => {
    const { input } = readFixture("clean.ts");
    const hits = await rule006.check(input);
    expect(hits.length).toBe(0);
  });
});

describe("RULE-007: eval() / new Function()", () => {
  it("detects eval with user input", async () => {
    const { input } = readFixture("eval-injection.ts");
    const hits = await rule007.check(input);
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits.some((h) => h.severity === "critical")).toBe(true);
  });

  it("returns no hits on clean code", async () => {
    const { input } = readFixture("clean.ts");
    const hits = await rule007.check(input);
    expect(hits.length).toBe(0);
  });
});

describe("RULE-005: CORS Wildcard", () => {
  it("detects CORS * on API routes", async () => {
    const { input } = readFixture("cors-star.ts");
    // Override path to be an API route
    const hits = await rule005.check({ ...input, path: "/api/auth/route.ts" });
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });
});

describe("RULE-009: Admin API Auth", () => {
  it("detects admin route without auth", async () => {
    const { input } = readFixture("admin-no-auth.ts");
    const hits = await rule009.check({ ...input, path: "/api/admin/users/route.ts" });
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0].severity).toBe("critical");
  });
});
