import { logger } from '../utils/logger';

export class GroqService {
    private static readonly API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

    static async transcribeAudio(audioBlob: Blob, apiKey: string, language: string = 'en'): Promise<string> {
        if (!apiKey) {
            throw new Error('Groq API Key is missing. Please add it in Settings.');
        }

        const formData = new FormData();
        // Groq requires a file with a name/extension
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('model', 'whisper-large-v3'); // or 'distil-whisper-large-v3-en'
        formData.append('temperature', '0');
        formData.append('response_format', 'json');
        formData.append('language', language.startsWith('en') ? 'en' : language);

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Groq API call failed with status ${response.status}`);
            }

            const data = await response.json();
            return data.text;
        } catch (error) {
            logger.error('Groq Transcription error', error);
            throw error;
        }
    }
}
