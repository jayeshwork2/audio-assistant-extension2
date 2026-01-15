export enum STTProviderType {
  BROWSER = 'browser',
  GROQ = 'groq',
  WHISPER_CPP = 'whisper_cpp',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  CUSTOM = 'custom'
}

export enum AIProviderType {
  CLAUDE = 'claude',
  GPT4 = 'gpt4',
  GEMINI = 'gemini',
  GROQ = 'groq',
  CUSTOM = 'custom'
}

export interface STTProvider {
  id: STTProviderType;
  name: string;
  description: string;
  isFree: boolean;
}

export interface AIProvider {
  id: AIProviderType;
  name: string;
  description: string;
  models: string[];
}
