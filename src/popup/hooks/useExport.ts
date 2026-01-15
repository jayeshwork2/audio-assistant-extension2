import { useState, useCallback, useEffect } from 'react';
import { ExportHistoryItem, ExportFormat, ExportRequest, ExportResult, EmailExportRequest } from '../../shared/types/export';
import { apiClient } from '../../shared/services/api-service';
import { storage } from '../../shared/utils/storage';
import { logger } from '../../shared/utils/logger';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExportUrl, setLastExportUrl] = useState<string | undefined>();
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');

  const exportAsPdf = useCallback(async (meetingId: string): Promise<string> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      logger.info('Exporting meeting as PDF', { meetingId });

      const result: ExportResult = await apiClient.post(`/api/export/pdf/${meetingId}`);
      
      if (result.success && result.url) {
        setLastExportUrl(result.url);
        
        // Add to history
        const historyItem: ExportHistoryItem = {
          id: Date.now().toString(),
          meetingId,
          format: 'pdf',
          url: result.url,
          timestamp: new Date().toISOString(),
          success: true,
        };
        
        const newHistory = [historyItem, ...exportHistory].slice(0, 20); // Keep max 20 items
        setExportHistory(newHistory);
        
        // Save to storage
        await storage.set('export_history', newHistory);
        
        logger.info('PDF export completed successfully', { meetingId, url: result.url });
        return result.url;
      } else {
        throw new Error(result.errorMessage || 'PDF export failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'PDF export failed';
      setExportError(errorMessage);
      logger.error('PDF export failed', err);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [exportHistory]);

  const exportAsMarkdown = useCallback(async (meetingId: string): Promise<string> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      logger.info('Exporting meeting as Markdown', { meetingId });

      const result: ExportResult = await apiClient.post(`/api/export/markdown/${meetingId}`);
      
      if (result.success && result.url) {
        setLastExportUrl(result.url);
        
        // Add to history
        const historyItem: ExportHistoryItem = {
          id: Date.now().toString(),
          meetingId,
          format: 'markdown',
          url: result.url,
          timestamp: new Date().toISOString(),
          success: true,
        };
        
        const newHistory = [historyItem, ...exportHistory].slice(0, 20);
        setExportHistory(newHistory);
        await storage.set('export_history', newHistory);
        
        logger.info('Markdown export completed successfully', { meetingId, url: result.url });
        return result.url;
      } else {
        throw new Error(result.errorMessage || 'Markdown export failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Markdown export failed';
      setExportError(errorMessage);
      logger.error('Markdown export failed', err);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [exportHistory]);

  const exportAsText = useCallback(async (meetingId: string): Promise<string> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      logger.info('Exporting meeting as Text', { meetingId });

      const result: ExportResult = await apiClient.post(`/api/export/text/${meetingId}`);
      
      if (result.success && result.url) {
        setLastExportUrl(result.url);
        
        // Add to history
        const historyItem: ExportHistoryItem = {
          id: Date.now().toString(),
          meetingId,
          format: 'text',
          url: result.url,
          timestamp: new Date().toISOString(),
          success: true,
        };
        
        const newHistory = [historyItem, ...exportHistory].slice(0, 20);
        setExportHistory(newHistory);
        await storage.set('export_history', newHistory);
        
        logger.info('Text export completed successfully', { meetingId, url: result.url });
        return result.url;
      } else {
        throw new Error(result.errorMessage || 'Text export failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Text export failed';
      setExportError(errorMessage);
      logger.error('Text export failed', err);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [exportHistory]);

  const emailExport = useCallback(async (
    meetingId: string,
    email: string,
    format: ExportFormat
  ): Promise<void> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      logger.info('Sending email export', { meetingId, email, format });

      const request: EmailExportRequest = {
        meetingId,
        email,
        format,
      };

      const result: ExportResult = await apiClient.post('/api/export/email', request);
      
      if (result.success) {
        // Add to history
        const historyItem: ExportHistoryItem = {
          id: Date.now().toString(),
          meetingId,
          format: 'email',
          timestamp: new Date().toISOString(),
          success: true,
        };
        
        const newHistory = [historyItem, ...exportHistory].slice(0, 20);
        setExportHistory(newHistory);
        await storage.set('export_history', newHistory);
        
        logger.info('Email export sent successfully', { meetingId, email, format });
      } else {
        throw new Error(result.errorMessage || 'Email export failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Email export failed';
      setExportError(errorMessage);
      logger.error('Email export failed', err);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [exportHistory]);

  const clearExportError = useCallback((): void => {
    setExportError(null);
  }, []);

  const openFile = useCallback((url: string): void => {
    try {
      window.open(url, '_blank');
      logger.info('Opened export file', { url });
    } catch (err) {
      logger.error('Failed to open export file', err);
      throw new Error('Failed to open export file');
    }
  }, []);

  const getExportHistory = useCallback((): ExportHistoryItem[] => {
    return exportHistory;
  }, [exportHistory]);

  const loadExportHistory = useCallback(async (): Promise<void> => {
    try {
      const storedHistory = await storage.get<ExportHistoryItem[]>('export_history');
      if (storedHistory) {
        setExportHistory(storedHistory);
      }
    } catch (err) {
      logger.warn('Failed to load export history from storage', err);
    }
  }, []);

  // Load history on mount
  useEffect(() => {
    loadExportHistory();
  }, [loadExportHistory]);

  return {
    isExporting,
    exportError,
    lastExportUrl,
    exportHistory,
    selectedFormat,
    exportAsPdf,
    exportAsMarkdown,
    exportAsText,
    emailExport,
    clearExportError,
    openFile,
    getExportHistory,
    setSelectedFormat,
  };
};