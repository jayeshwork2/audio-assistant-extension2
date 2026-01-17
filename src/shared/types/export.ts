export interface ExportHistoryItem {
  id: string;
  meetingId?: string;
  format: ExportFormat;
  url?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export type ExportFormat = 'markdown' | 'text';

export interface ExportRequest {
  meetingId: string;
  format: ExportFormat;
  email?: string;
}

export interface ExportResult {
  url?: string;
  success: boolean;
  errorMessage?: string;
}