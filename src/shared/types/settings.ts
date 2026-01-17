import { AudioMode } from "./audio";
import { STTProviderType, AIProviderType } from "./providers";

export interface UserSettings {
  audioMode: AudioMode;
  language: string;
  responseLanguage: string;
  userContext: string;
  sttProvider: STTProviderType;
  aiProvider: AIProviderType;
  apiKeys: Record<string, string>;
  autoSave: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  audioMode: "tab-only",
  language: "en-US",
  responseLanguage: "en-US",
  userContext: "",
  sttProvider: STTProviderType.GROQ,
  aiProvider: AIProviderType.GROQ,
  apiKeys: {},
  autoSave: true,
};
