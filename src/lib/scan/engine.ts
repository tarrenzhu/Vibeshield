// ============================================
// Scan Engine — orchestrates rule execution
// ============================================

import { simpleGit } from "simple-git";
import path from "path";
import fs from "fs";
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
// import { rule001 } from "./rules/rule-001-hardcoded-secret";

interface ScanResult {
  findings: Omit<Finding, "id" | "status">[];
}

export async function runScan(
  repoId: string,
  repoFullName: string,
  commitSha: string,
  installationId: number
): Promise<ScanResult> {
  // 1. Create scan record
  const scan = await createScan(repoId, commitSha);

  try {
    // 2. Clone repo (sparse checkout — only source files)
    const repoPath = await sparseClone(repoFullName, commitSha, installationId);

    // 3. Walk source files
    const files = walkSourceFiles(repoPath);

    // 4. Run rules (parallel)
    const allFindings: Omit<Finding, "id" | "status">[] = [];
    const rules = loadRules();

    for (const file of files) {
      const content = fs.readFileSync(file.path, "utf-8");
      for (const rule of rules) {
        try {
          const hits = await rule.check({
            path: file.relativePath,
            content,
            repoPath,
          });

          for (const hit of hits) {
            // LLM verification for low-confidence hits (confidence < 0.8)
            let explanation = hit.explanation ?? null;
            if (hit.confidence < 0.8) {
              try {
                const llmVerdict = await verifyWithLLM(
                  hit.codeSnippet,
                  hit.ruleId,
                  content.slice(0, 1000)
                );
                if (!llmVerdict.isReal) continue;
                explanation = llmVerdict.explanation;
              } catch (err) {
                console.error(`LLM verification failed for ${hit.ruleId}:`, err);
              }
            }

            // Generate plain-English explanation via DeepSeek
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
                console.error(`Explanation generation failed for ${hit.ruleId}:`, err);
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

    // 5. Save findings
    await insertFindings(allFindings);

    // 6. Update scan status
    const critical = allFindings.filter((f) => f.severity === "critical").length;
    const warning = allFindings.filter((f) => f.severity === "warning").length;
    await updateScanStatus(scan.id, "done", {
      total: allFindings.length,
      critical,
      warning,
    });

    // 7. Update repo last_scan_at
    await updateRepoLastScan(repoId);

    // 8. Cleanup
    fs.rmSync(repoPath, { recursive: true, force: true });

    return { findings: allFindings };
  } catch (err) {
    await updateScanStatus(scan.id, "failed");
    console.error("Scan failed:", err);
    throw err;
  }
}

// ============================================
// Helpers
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
}

function walkSourceFiles(rootPath: string): SourceFile[] {
  const files: SourceFile[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      // Skip node_modules, .next, .git, dist
      if (
        entry.isDirectory() &&
        !["node_modules", ".next", ".git", "dist", ".turbo", "build"].includes(
          entry.name
        )
      ) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
      ) {
        files.push({
          path: fullPath,
          relativePath: path.relative(rootPath, fullPath),
        });
      }
    }
  }

  walk(rootPath);
  return files;
}

export interface RuleHit {
  ruleId: string;
  severity: "critical" | "warning" | "info";
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;
  confidence: number; // 0..1
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
    rule001,
    rule002,
    rule003,
    rule004,
    rule005,
    rule006,
    rule007,
    rule008,
    rule009,
    rule010,
  ];
}

async function sparseClone(
  repoFullName: string,
  commitSha: string,
  installationId: number
): Promise<string> {
  const tmpDir = path.join("/tmp", `vibeshield-${commitSha.slice(0, 8)}`);

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // TODO(human): Use GitHub App installation token for clone
  // For now, use a simple clone
  const git = simpleGit();
  await git.clone(
    `https://github.com/${repoFullName}.git`,
    tmpDir,
    ["--depth", "1"]
  );

  return tmpDir;
}
