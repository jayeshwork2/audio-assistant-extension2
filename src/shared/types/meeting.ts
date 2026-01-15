export interface MeetingContext {
  meetingType?: string;
  domain?: string;
  formality?: string;
  urgency?: string;
  duration?: number;
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  isDetecting?: boolean;
  meetingId?: string;
  startTime?: string;
}

export interface MeetingDetectionRequest {
  transcript: string;
}

export interface MeetingDetectionResult {
  meetingType: string;
  domain: string;
  formality: string;
  urgency: string;
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  meetingId: string;
}

export interface MeetingNotesRequest {
  meetingId: string;
}

export interface MeetingNotesResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export interface MeetingDetectionError {
  message: string;
  code?: string;
}