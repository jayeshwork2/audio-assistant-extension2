export interface ExportHistoryItem {
  id: string;
  meetingId?: string;
  format: ExportFormat;
  url?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export type ExportFormat = 'pdf' | 'markdown' | 'text' | 'email';

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

export interface EmailExportRequest {
  meetingId: string;
  email: string;
  format: ExportFormat;
}