// ============================================
// OpenAI → DeepSeek shim
// All LLM calls now go through DeepSeek
// ============================================

export {
  default,
  verifyWithLLM,
  generateExplanation,
} from "./deepseek";
