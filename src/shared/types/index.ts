export * from './audio';
export * from './providers';
export * from './settings';
export * from './transcription';
export * from './ai-response';
export * from './export';

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
