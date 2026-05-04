// ============================================
// Cursor Prompt Generator
// Generates the structured prompt users paste into Cursor
// ============================================

import type { Finding } from "@/lib/db/repositories";

export function generateCursorPrompt(finding: {
  file_path: string;
  rule_id: string;
  explanation_md: string | null;
}): string {
  const fileRef = `@${finding.file_path}`;

  const lines: string[] = [
    fileRef,
    "",
    `This file has a security issue detected by VibeShield (${finding.rule_id}).`,
  ];

  if (finding.explanation_md) {
    // Strip markdown formatting for the prompt
    const plainExplanation = finding.explanation_md
      .replace(/[#*`]/g, "")
      .replace(/\n{2,}/g, "\n");
    lines.push("");
    lines.push(plainExplanation);
  }

  lines.push("");
  lines.push(
    "Please fix this security issue. Do not change any other logic in this file."
  );

  return lines.join("\n");
}

export async function generatePlainExplanation(
  finding: {
    rule_id: string;
    file_path: string;
    line_start: number;
    code_snippet: string | null;
  }
): Promise<string> {
  // TODO: Call Claude 3.5 Sonnet to generate a plain-English explanation
  // For now, return a placeholder
  return `**${finding.rule_id}** detected in \`${finding.file_path}:${finding.line_start}\`

This pattern is commonly found in AI-generated code and can lead to security vulnerabilities.`;
}

export async function generateFixPromptWithAI(
  finding: {
    rule_id: string;
    file_path: string;
    explanation_md: string | null;
  }
): Promise<string> {
  // TODO: Call Claude 3.5 Sonnet to generate a structured fix prompt
  return generateCursorPrompt(finding);
}
