// ============================================
// Anthropic → DeepSeek shim
// All LLM calls now go through DeepSeek
// ============================================

export {
  generatePlainEnglishExplanation,
  generateFixPrompt,
} from "./deepseek";
