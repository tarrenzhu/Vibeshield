// RULE-008: LLM prompt built by string concatenation with user input (prompt injection)
// LLM-as-judge rule — low-confidence hits should be verified by LLM

import type { RuleCheckInput, RuleHit } from "../engine";

const PROMPT_CONCAT_PATTERNS = [
  // Template literals with user input in prompt context
  /\$\{.*(?:req\.|request\.|body\.|params\.|query\.|input|user|message)\}.*(?:prompt|system|instruction|context|chat)/i,
  // String concatenation for prompts
  /(?:prompt|systemPrompt|system_prompt)\s*(?:\+|\+=)\s*(?:req\.|request\.|body\.|params\.|query\.)/i,
  // LangChain prompt templates with user input
  /PromptTemplate.*\$\{/,
  /ChatPromptTemplate.*\$\{/,
];

export const rule008 = {
  id: "RULE-008",
  async check(input: RuleCheckInput): Promise<RuleHit[]> {
    const hits: RuleHit[] = [];
    const lines = input.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of PROMPT_CONCAT_PATTERNS) {
        if (pattern.test(line)) {
          const contextStart = Math.max(0, i - 3);
          const contextEnd = Math.min(lines.length, i + 5);
          const context = lines.slice(contextStart, contextEnd).join("\n");

          hits.push({
            ruleId: "RULE-008",
            severity: "warning",
            lineStart: i + 1,
            lineEnd: i + 1,
            codeSnippet: context,
            confidence: 0.35, // Low confidence — LLM verification required
            explanation: `User input may be directly concatenated into an LLM prompt. This could allow prompt injection attacks. Verify this is intentional.`,
          });
        }
      }
    }

    return hits;
  },
};
