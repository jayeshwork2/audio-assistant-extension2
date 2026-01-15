import { STTProviderType, AIProviderType } from "../types/providers";

export const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "es-MX", name: "Spanish (Mexico)" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "it-IT", name: "Italian" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)" },
  { code: "nl-NL", name: "Dutch" },
  { code: "ru-RU", name: "Russian" },
  { code: "ja-JP", name: "Japanese" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ko-KR", name: "Korean" },
  { code: "ar-SA", name: "Arabic" },
  { code: "hi-IN", name: "Hindi" },
  { code: "tr-TR", name: "Turkish" },
  { code: "vi-VN", name: "Vietnamese" },
  { code: "pl-PL", name: "Polish" },
  { code: "sv-SE", name: "Swedish" },
  { code: "da-DK", name: "Danish" },
  { code: "fi-FI", name: "Finnish" },
  { code: "no-NO", name: "Norwegian" },
  { code: "cs-CZ", name: "Czech" },
  { code: "hu-HU", name: "Hungarian" },
  { code: "ro-RO", name: "Romanian" },
  { code: "uk-UA", name: "Ukrainian" },
  { code: "el-GR", name: "Greek" },
  { code: "he-IL", name: "Hebrew" },
  { code: "id-ID", name: "Indonesian" },
  { code: "ms-MY", name: "Malay" },
  { code: "th-TH", name: "Thai" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
  { code: "kn-IN", name: "Kannada" },
  { code: "ml-IN", name: "Malayalam" },
  { code: "bn-IN", name: "Bengali" },
  { code: "gu-IN", name: "Gujarati" },
  { code: "mr-IN", name: "Marathi" },
  { code: "pa-IN", name: "Punjabi" },
  { code: "af-ZA", name: "Afrikaans" },
  { code: "sq-AL", name: "Albanian" },
  { code: "am-ET", name: "Amharic" },
  { code: "hy-AM", name: "Armenian" },
  { code: "az-AZ", name: "Azerbaijani" },
  { code: "eu-ES", name: "Basque" },
  { code: "be-BY", name: "Belarusian" },
  { code: "bs-BA", name: "Bosnian" },
  { code: "bg-BG", name: "Bulgarian" },
  { code: "ca-ES", name: "Catalan" },
  { code: "hr-HR", name: "Croatian" },
];

export const STT_PROVIDERS = [
  {
    id: STTProviderType.BROWSER,
    name: "Browser (Default)",
    description: "Built-in Speech API",
    isFree: true,
  },
  {
    id: STTProviderType.GROQ,
    name: "Groq",
    description: "Fast & Free",
    isFree: true,
  },
  {
    id: STTProviderType.WHISPER_CPP,
    name: "Whisper.cpp",
    description: "Local",
    isFree: true,
  },
  {
    id: STTProviderType.OPENAI,
    name: "OpenAI",
    description: "Paid",
    isFree: false,
  },
  {
    id: STTProviderType.CLAUDE,
    name: "Claude",
    description: "Paid",
    isFree: false,
  },
];

export const AI_PROVIDERS = [
  {
    id: AIProviderType.CLAUDE,
    name: "Claude",
    models: ["claude-3-opus", "claude-3-sonnet"],
  },
  { id: AIProviderType.GPT4, name: "GPT-4", models: ["gpt-4", "gpt-4-turbo"] },
  { id: AIProviderType.GEMINI, name: "Gemini", models: ["gemini-pro"] },
  {
    id: AIProviderType.GROQ,
    name: "Groq",
    models: ["llama3-70b", "mixtral-8x7b"],
  },
];

//export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
export const API_BASE_URL = "https://localhost:7020";

// Transcription API constants
export const API_ENDPOINTS = {
  TRANSCRIBE: "/api/transcription",
};

export const TRANSCRIPTION_CONFIG = {
  TIMEOUT: 60000, // 60 seconds
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second
  MAX_HISTORY_ITEMS: 20,
};
