import { useState, useCallback, useRef } from "react";
import {
  AIResponse,
  ResponseMetadata,
  GenerateAIRequest,
} from "../../shared/types/ai-response";
import { apiClient } from "../../shared/services/api-service";
import { logger } from "../../shared/utils/logger";

export const useAIResponse = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ResponseMetadata | null>(null);
  const lastRequestRef = useRef<GenerateAIRequest | null>(null);

  const generateResponse = useCallback(
    async (
      transcript: string,
      conversationId: string,
      responseStyle: string,
      aiProvider?: string,
      usersApikey?: string
    ): Promise<void> => {
      setIsGenerating(true);
      setError(null);

      const request: GenerateAIRequest = {
        transcript,
        conversationId,
        responseStyle,
        aiProvider,
        usersApikey,
      };

      // Store the request for retry functionality
      lastRequestRef.current = request;

      try {
        logger.info("Generating AI response", {
          transcriptLength: transcript.length,
          conversationId,
          responseStyle,
          aiProvider,
          usersApikey,
        });

        const result: AIResponse = await apiClient.post(
          "/api/response/generate",
          request
        );

        setResponse(result.response);
        //setMetadata(result.metadata);

        // logger.info("AI response generated successfully", {
        //   provider: result.metadata.provider,
        //   tokensUsed: result.metadata.tokensUsed,
        //   style: result.metadata.style,
        // });
        logger.info("AI response generated successfully", {
          provider: result.provider,
          tokensUsed: result.tokensUsed,
          style: result.style,
        });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to generate AI response";
        setError(errorMessage);
        logger.error("AI response generation failed", err);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const retryGeneration = useCallback(async (): Promise<void> => {
    if (!lastRequestRef.current) {
      throw new Error("No previous generation attempt to retry");
    }

    logger.info("Retrying AI response generation");

    // Retry with exponential backoff (max 2 retries)
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        setIsGenerating(true);
        setError(null);

        const result: AIResponse = await apiClient.post(
          "/api/response/generate",
          lastRequestRef.current
        );

        setResponse(result.response);
        //setMetadata(result.metadata);

        // logger.info("AI response generated successfully on retry", {
        //   provider: result.metadata.provider,
        //   tokensUsed: result.metadata.tokensUsed,
        //   style: result.metadata.style,
        //   attempt: retries + 1,
        // });
        logger.info("AI response generated successfully on retry", {
          provider: result.provider,
          tokensUsed: result.tokensUsed,
          style: result.style,
          attempt: retries + 1,
        });

        return;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to generate AI response";

        if (retries >= maxRetries) {
          setError(errorMessage);
          logger.error("AI response generation failed after retries", err);
          throw err;
        }

        retries++;

        // Exponential backoff - wait before retrying
        const delay = Math.pow(2, retries - 1) * 1000; // 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, delay));
      } finally {
        setIsGenerating(false);
      }
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const clearResponse = useCallback((): void => {
    setResponse("");
    setMetadata(null);
    setError(null);
    lastRequestRef.current = null;
  }, []);

  return {
    isGenerating,
    response,
    error,
    metadata,
    generateResponse,
    retryGeneration,
    clearError,
    clearResponse,
  };
};
