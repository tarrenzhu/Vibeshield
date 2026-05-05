// ============================================
// Scan Engine — orchestrates rule execution
// Uses GitHub API instead of git clone (Vercel-compatible)
// ============================================

import { createScan, updateScanStatus, insertFindings, updateRepoLastScan, type Finding } from "@/lib/db/repositories";
import { verifyWithLLM } from "@/lib/llm/deepseek";
import { generateExplanation } from "@/lib/llm/deepseek";

// Import all 10 security rules
import { rule001 } from "./rules/rule-001-hardcoded-secret";
import { rule002 } from "./rules/rule-002-supabase-rls";
import { rule003 } from "./rules/rule-003-stripe-webhook";
import { rule004 } from "./rules/rule-004-rate-limiting";
import { rule005 } from "./rules/rule-005-cors";
import { rule006 } from "./rules/rule-006-sql-injection";
import { rule007 } from "./rules/rule-007-eval";
import { rule008 } from "./rules/rule-008-prompt-injection";
import { rule009 } from "./rules/rule-009-admin-api";
import { rule010 } from "./rules/rule-010-public-bucket";

interface ScanResult {
  findings: Omit<Finding, "id" | "status">[];
}

export async function runScan(
  repoId: string,
  repoFullName: string,
  commitSha: string,
  installationId: number
): Promise<ScanResult> {
  const scan = await createScan(repoId, commitSha);

  try {
    // Fetch source files via GitHub API (no git required)
    const files = await fetchRepoFiles(repoFullName, commitSha, installationId);

    const allFindings: Omit<Finding, "id" | "status">[] = [];
    const rules = loadRules();

    for (const file of files) {
      for (const rule of rules) {
        try {
          const hits = await rule.check({
            path: file.relativePath,
            content: file.fileContent,
            repoPath: "",
          });

          for (const hit of hits) {
            let explanation = hit.explanation ?? null;
            if (hit.confidence < 0.8) {
              try {
                const llmVerdict = await verifyWithLLM(
                  hit.codeSnippet,
                  hit.ruleId,
                  file.fileContent.slice(0, 1000)
                );
                if (!llmVerdict.isReal) continue;
                explanation = llmVerdict.explanation;
              } catch (err) {
                console.error(`LLM verification failed for ${hit.ruleId}:`, err);
              }
            }

            let humanExplanation = explanation;
            if (!humanExplanation) {
              try {
                humanExplanation = await generateExplanation(
                  hit.ruleId,
                  hit.codeSnippet,
                  file.relativePath,
                  hit.lineStart
                );
              } catch (err) {
                console.error(`Explanation generation failed:`, err);
              }
            }

            allFindings.push({
              scan_id: scan.id,
              rule_id: hit.ruleId,
              severity: hit.severity,
              file_path: file.relativePath,
              line_start: hit.lineStart,
              line_end: hit.lineEnd,
              code_snippet: hit.codeSnippet,
              explanation_md: humanExplanation,
              fix_prompt_md: hit.fixPrompt ?? null,
            });
          }
        } catch (err) {
          console.error(`Rule ${rule.id} failed on ${file.relativePath}:`, err);
        }
      }
    }

    await insertFindings(allFindings);

    const critical = allFindings.filter((f) => f.severity === "critical").length;
    const warning = allFindings.filter((f) => f.severity === "warning").length;
    await updateScanStatus(scan.id, "done", {
      total: allFindings.length,
      critical,
      warning,
    });

    await updateRepoLastScan(repoId);

    return { findings: allFindings };
  } catch (err) {
    await updateScanStatus(scan.id, "failed");
    console.error("Scan failed:", err);
    throw err;
  }
}

// ============================================
// GitHub API file fetcher (no git required)
// ============================================

const SOURCE_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".py",
  ".env", ".env.local", ".env.example",
  ".yml", ".yaml", ".toml",
  ".tf", ".hcl",
];

interface SourceFile {
  path: string;
  relativePath: string;
  fileContent: string;
}

async function fetchRepoFiles(
  repoFullName: string,
  commitSha: string,
  installationId: number
): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  const apiBase = `https://api.github.com/repos/${repoFullName}`;

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "VibeShield/1.0",
    };

    if (installationId) {
      try {
        const { getInstallationToken } = await import("@/lib/github/app");
        const token = await getInstallationToken(installationId);
        headers.Authorization = `Bearer ${token}`;
      } catch { /* proceed without auth */ }
    }

    // Get recursive tree
    const treeUrl = `${apiBase}/git/trees/${commitSha}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers });

    if (!treeRes.ok) {
      throw new Error(`GitHub tree API error: ${treeRes.status}`);
    }

    const treeData: any = await treeRes.json();

    // Filter source files and batch download
    const sourceItems = (treeData.tree || []).filter(
      (item: any) =>
        item.type === "blob" &&
        SOURCE_EXTENSIONS.some((ext) => item.path.endsWith(ext)) &&
        !item.path.includes("node_modules/") &&
        !item.path.includes(".next/") &&
        !item.path.includes("dist/") &&
        !item.path.includes(".turbo/")
    );

    // Download files in parallel (limit concurrency)
    const batch = sourceItems.slice(0, 50); // Limit to 50 files for speed

    await Promise.all(
      batch.map(async (item: any) => {
        try {
          const blobUrl = `${apiBase}/git/blobs/${item.sha}`;
          const blobRes = await fetch(blobUrl, { headers });
          if (!blobRes.ok) return;
          const blobData = await blobRes.json();
          const content = Buffer.from(blobData.content, "base64").toString("utf-8");

          files.push({
            path: `/tmp/${item.path}`,
            relativePath: item.path,
            fileContent: content,
          });
        } catch { /* skip failed files */ }
      })
    );
  } catch (err) {
    console.error("GitHub API fetch failed:", err);
  }

  return files;
}

// ============================================
// Types & Rules
// ============================================

export interface RuleHit {
  ruleId: string;
  severity: "critical" | "warning" | "info";
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;
  confidence: number;
  explanation?: string;
  fixPrompt?: string;
}

export interface RuleCheckInput {
  path: string;
  content: string;
  repoPath: string;
}

interface Rule {
  id: string;
  check: (input: RuleCheckInput) => Promise<RuleHit[]>;
}

function loadRules(): Rule[] {
  return [
    rule001, rule002, rule003, rule004, rule005,
    rule006, rule007, rule008, rule009, rule010,
  ];
}
