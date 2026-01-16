export interface ResponseMetadata {
  provider: string;
  tokensUsed: number;
  timestamp: string;
  style: string;
}

export interface AIResponseProvider {
  name: string;
  id: string;
  description: string;
}

export interface ResponseStyle {
  name: string;
  description: string;
  sample: string;
  icon?: string;
}

export interface AIResponse {
  response: string;
  provider: string;
  tokensUsed: number;
  timestamp: string;
  style: string;
  //metadata: ResponseMetadata;
}

export interface GenerateAIRequest {
  transcript: string;
  conversationId: string;
  responseStyle: string;
  aiProvider?: string;
  usersApikey?: string;
}
