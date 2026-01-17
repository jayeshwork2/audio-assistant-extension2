import { AIResponse, ResponseMetadata } from "../types/ai-response";
// Removed unused imports
import { logger } from "../utils/logger";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIService {
  private async callOpenAI(
    messages: any[],
    apiKey: string,
    model: string,
    baseUrl: string = OPENAI_API_URL,
  ): Promise<any> {
    if (!apiKey) {
      throw new Error("API Key is missing.");
    }

    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `API call failed with status ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      logger.error("LLM API call error", error);
      throw error;
    }
  }

  async generateResponse(
    transcript: string,
    conversationId: string,
    style: string,
    apiKey: string,
    provider: string = "openai",
    userContext: string = '',
    responseLanguage: string = 'en-US'
  ): Promise<AIResponse> {
    let systemPrompt = `You are an AI assistant helping with a meeting. 
    Your goal is to provide a helpful response based on the current transcript.
    Response Style: ${style}
    Response Language: ${responseLanguage}
    
    Please provide a concise and relevant response.`;

    if (userContext && userContext.trim()) {
        systemPrompt += `\n\nRecording Context:\n${userContext}`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: transcript },
    ];

    let baseUrl = OPENAI_API_URL;
    let model = "gpt-4o"; // Default for OpenAI

    if (provider === "groq") {
      baseUrl = "https://api.groq.com/openai/v1/chat/completions";
      model = "llama-3.1-8b-instant";
    }

    const data = await this.callOpenAI(messages, apiKey, model, baseUrl);

    const content = data.choices[0].message.content;
    const tokensUsed = data.usage.total_tokens;

    return {
      response: content,
      provider: provider as any,
      tokensUsed,
      timestamp: new Date().toISOString(),
      style,
    };
  }
}

export const openaiService = new OpenAIService();
