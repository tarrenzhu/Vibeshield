// ============================================
// Vibeshield DeepSeek Client
// Unified LLM module — replaces OpenAI + Anthropic
// DeepSeek API is OpenAI-compatible
// ============================================

import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

// Default model — v4 pro for quality, v4 flash for cheap ops
const DEFAULT_MODEL = "deepseek-chat";
const FAST_MODEL = "deepseek-chat"; // Both map to v4; use same model for now

export default deepseek;

// ============================================
// 1. LLM Verification (high-accuracy, cheap)
// Used when rule confidence < 0.8
// ============================================

export async function verifyWithLLM(
  codeSnippet: string,
  ruleId: string,
  fileContext: string
): Promise<{ isReal: boolean; explanation: string }> {
  const prompt = `You are a security analyst. Verify if this code contains a real security issue matching rule ${ruleId}.

Code:
\`\`\`
${codeSnippet.slice(0, 2000)}
\`\`\`

File context:
\`\`\`
${fileContext.slice(0, 1000)}
\`\`\`

Respond with JSON:
{
  "isReal": true/false,
  "explanation": "1-2 sentence plain-English explanation of the issue"
}

Is this a real security issue?`;

  const response = await deepseek.chat.completions.create({
    model: FAST_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0]?.message?.content ?? "{}");
  return {
    isReal: result.isReal ?? true,
    explanation: result.explanation ?? "Potential security issue detected.",
  };
}

// ============================================
// 2. Plain-English Explanation (chatty, friendly)
// White-glove explanation for non-technical founders
// ============================================

export async function generateExplanation(
  ruleId: string,
  codeSnippet: string,
  filePath: string,
  lineStart: number
): Promise<string> {
  const prompt = `You are a friendly security coach for non-technical founders. Explain this security issue in VERY simple language — like you're talking to a product designer who learned to code last month. No jargon.

Rule: ${ruleId}
File: ${filePath}:${lineStart}
Code:
\`\`\`
${codeSnippet.slice(0, 2000)}
\`\`\`

Write a 2-4 sentence plain-English explanation. Start with "You have..." or "Your code...". Keep it friendly and actionable.`;

  const response = await deepseek.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content ?? "Security issue detected.";
}

// ============================================
// 3. Rich Explanation with Real-World Context
// Used for the Finding Detail panel
// ============================================

export async function generatePlainEnglishExplanation(
  ruleId: string,
  ruleName: string,
  codeSnippet: string,
  filePath: string,
  lineStart: number
): Promise<string> {
  const prompt = `You are a friendly security coach. Explain this finding in extremely simple, plain English. Imagine you're explaining to someone who has never done security before.

**Rule**: ${ruleName} (${ruleId})
**Location**: ${filePath}:${lineStart}

**The concerning code**:
\`\`\`
${codeSnippet.slice(0, 2000)}
\`\`\`

Write a 3-5 sentence explanation that:
1. Says what the problem is in plain English (no jargon)
2. Says why it's dangerous (what could go wrong)
3. Gives a real-world example of what could happen

Start with "You have..." or "Your code..."`;

  const response = await deepseek.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? "Security issue detected.";
}

// ============================================
// 4. Cursor Fix Prompt Generator
// Generates a copy-paste prompt for Cursor AI
// ============================================

export async function generateFixPrompt(
  ruleId: string,
  filePath: string,
  explanation: string,
  codeSnippet: string
): Promise<string> {
  const prompt = `You are a senior engineer writing a Cursor AI prompt. Generate a 5-10 line prompt that a non-technical founder can paste directly into Cursor Chat to fix this security issue.

**Rule**: ${ruleId}
**File**: ${filePath}
**Issue**: ${explanation}

**Code**:
\`\`\`
${codeSnippet.slice(0, 2000)}
\`\`\`

Generate a prompt in this exact format:

@${filePath}

This file has a critical security issue: [one-line description].

Please fix by:
1. [step 1]
2. [step 2]
3. [step 3]

Do not change any other logic in this file.

Be specific about WHAT to change. No vague instructions.`;

  const response = await deepseek.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
    temperature: 0.2,
  });

  return (
    response.choices[0]?.message?.content ??
    `@${filePath}\n\nFix the security issue detected by ${ruleId}.`
  );
}
