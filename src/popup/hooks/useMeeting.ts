import { useState, useCallback, useEffect } from 'react';
import { MeetingContext, MeetingDetectionRequest, MeetingDetectionResult, MeetingNotesRequest, MeetingNotesResult } from '../../shared/types/meeting';
import { apiClient } from '../../shared/services/api-service';
import { logger } from '../../shared/utils/logger';

export const useMeeting = () => {
  const [meetingType, setMeetingType] = useState<string | undefined>();
  const [domain, setDomain] = useState<string | undefined>();
  const [formality, setFormality] = useState<string | undefined>();
  const [urgency, setUrgency] = useState<string | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | undefined>();
  const [startTime, setStartTime] = useState<string | undefined>();

  const detectMeetingContext = useCallback(async (transcript: string): Promise<void> => {
    setIsDetecting(true);
    setError(null);
    
    try {
      logger.info('Detecting meeting context', {
        transcriptLength: transcript.length,
      });

      const request: MeetingDetectionRequest = {
        transcript,
      };

      const result: MeetingDetectionResult = await apiClient.post('/api/meeting/analyze', request);
      
      // Update state with detection results
      setMeetingType(result.meetingType);
      setDomain(result.domain);
      setFormality(result.formality);
      setUrgency(result.urgency);
      setSummary(result.summary);
      setKeyPoints(result.keyPoints || []);
      setActionItems(result.actionItems || []);
      setMeetingId(result.meetingId);
      setStartTime(new Date().toISOString());
      
      logger.info('Meeting context detected successfully', {
        meetingType: result.meetingType,
        domain: result.domain,
        formality: result.formality,
        urgency: result.urgency,
        meetingId: result.meetingId,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to detect meeting context';
      setError(errorMessage);
      logger.error('Meeting context detection failed', err);
      throw err;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const generateMeetingNotes = useCallback(async (): Promise<void> => {
    if (!meetingId) {
      throw new Error('No meeting ID available. Call detectMeetingContext first.');
    }

    setIsDetecting(true);
    setError(null);
    
    try {
      logger.info('Generating meeting notes', { meetingId });

      const request: MeetingNotesRequest = {
        meetingId,
      };

      const result: MeetingNotesResult = await apiClient.post(`/api/meeting/${meetingId}/notes/generate`, request);
      
      setSummary(result.summary);
      setKeyPoints(result.keyPoints);
      setActionItems(result.actionItems);
      
      logger.info('Meeting notes generated successfully', {
        meetingId,
        keyPointsCount: result.keyPoints.length,
        actionItemsCount: result.actionItems.length,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate meeting notes';
      setError(errorMessage);
      logger.error('Meeting notes generation failed', err);
      throw err;
    } finally {
      setIsDetecting(false);
    }
  }, [meetingId]);

  const updateMeetingType = useCallback(async (type: string): Promise<void> => {
    if (!meetingId) {
      throw new Error('No meeting ID available');
    }

    try {
      logger.info('Updating meeting type', { meetingId, type });
      
      await apiClient.put(`/api/meeting/${meetingId}/type`, { type });
      
      setMeetingType(type);
      
      logger.info('Meeting type updated successfully', { meetingId, type });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update meeting type';
      setError(errorMessage);
      logger.error('Failed to update meeting type', err);
      throw err;
    }
  }, [meetingId]);

  const updateDomain = useCallback(async (domain: string): Promise<void> => {
    if (!meetingId) {
      throw new Error('No meeting ID available');
    }

    try {
      logger.info('Updating meeting domain', { meetingId, domain });
      
      await apiClient.put(`/api/meeting/${meetingId}/domain`, { domain });
      
      setDomain(domain);
      
      logger.info('Meeting domain updated successfully', { meetingId, domain });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update meeting domain';
      setError(errorMessage);
      logger.error('Failed to update meeting domain', err);
      throw err;
    }
  }, [meetingId]);

  const getMeetingContext = useCallback((): MeetingContext => {
    const duration = startTime ? (Date.now() - new Date(startTime).getTime()) / 1000 : undefined;
    
    return {
      meetingType,
      domain,
      formality,
      urgency,
      summary,
      keyPoints,
      actionItems,
      meetingId,
      startTime,
      duration,
    };
  }, [meetingType, domain, formality, urgency, summary, keyPoints, actionItems, meetingId, startTime]);

  const clearMeetingContext = useCallback((): void => {
    setMeetingType(undefined);
    setDomain(undefined);
    setFormality(undefined);
    setUrgency(undefined);
    setSummary(undefined);
    setKeyPoints([]);
    setActionItems([]);
    setMeetingId(undefined);
    setStartTime(undefined);
    setError(null);
    
    logger.info('Meeting context cleared');
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Auto-detect meeting context when transcript is available
  useEffect(() => {
    // This will be called from the parent component when transcript is ready
    // The hook just provides the method, the parent decides when to call it
  }, []);

  return {
    meetingType,
    domain,
    formality,
    urgency,
    summary,
    keyPoints,
    actionItems,
    isDetecting,
    error,
    detectMeetingContext,
    generateMeetingNotes,
    updateMeetingType,
    updateDomain,
    getMeetingContext,
    clearMeetingContext,
    clearError,
  };
};