import { AudioMode } from "./audio";
import { STTProviderType, AIProviderType } from "./providers";

export interface UserSettings {
  audioMode: AudioMode;
  language: string;
  sttProvider: STTProviderType;
  aiProvider: AIProviderType;
  apiKeys: Record<string, string>;
  autoSave: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  audioMode: "mic-only",
  language: "en-US",
  sttProvider: STTProviderType.BROWSER,
  aiProvider: AIProviderType.GPT4,
  apiKeys: {},
  autoSave: true,
};
