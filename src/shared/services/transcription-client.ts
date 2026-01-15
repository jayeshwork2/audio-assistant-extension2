import { apiClient } from "./api-service";
import { TranscriptionResult } from "../types/transcription";
import { STTProviderType } from "../types/providers";
import { API_ENDPOINTS, TRANSCRIPTION_CONFIG } from "../utils/constants";
import { logger } from "../utils/logger";

class TranscriptionClient {
  async transcribeAudio(
    audioData: Blob,
    language: string,
    sttProvider: STTProviderType
  ): Promise<TranscriptionResult> {
    let lastError: Error | null = null;

    for (
      let attempt = 0;
      attempt <= TRANSCRIPTION_CONFIG.MAX_RETRIES;
      attempt++
    ) {
      try {
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt} for transcription`);
          await this.delay(TRANSCRIPTION_CONFIG.RETRY_DELAY * attempt);
        }

        // const formData = new FormData();
        // formData.append('audio', audioData, 'recording.webm');
        // formData.append('language', language);
        // formData.append('sttProvider', sttProvider);

        const request = {
          audio: audioData,
          language,
          sttProvider,
        };

        const response = await apiClient.post<TranscriptionResult>(
          API_ENDPOINTS.TRANSCRIBE,
          request,
          //formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: TRANSCRIPTION_CONFIG.TIMEOUT,
          }
        );

        // Convert timestamp string to Date object
        return {
          ...response,
          timestamp: new Date(response.timestamp),
        };
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx except 429)
        if (
          error.response?.status >= 400 &&
          error.response?.status < 500 &&
          error.response?.status !== 429
        ) {
          throw this.handleError(error);
        }

        // Log retry attempt
        if (attempt < TRANSCRIPTION_CONFIG.MAX_RETRIES) {
          logger.warn(
            `Transcription attempt ${attempt + 1} failed, retrying...`,
            error
          );
        }
      }
    }

    // All retries exhausted
    throw this.handleError(lastError!);
  }

  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          return new Error(message || "Invalid audio data or parameters");
        case 401:
          return new Error("Authentication required. Please sign in.");
        case 403:
          return new Error("Access denied. Check your API keys.");
        case 404:
          return new Error("Transcription service not found");
        case 413:
          return new Error("Audio file is too large");
        case 429:
          return new Error("Rate limit exceeded. Please try again later.");
        case 500:
          return new Error(
            "Server error during transcription. Please try again."
          );
        case 503:
          return new Error("Transcription service temporarily unavailable");
        default:
          return new Error(
            message || `Transcription failed with status ${status}`
          );
      }
    } else if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout")
    ) {
      return new Error(
        "Transcription timeout. The audio file may be too long."
      );
    } else if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error")
    ) {
      return new Error("Network error. Please check your connection.");
    } else {
      return new Error(
        error.message || "Transcription failed. Please try again."
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const transcriptionClient = new TranscriptionClient();
