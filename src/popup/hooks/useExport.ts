import { useState, useCallback, useEffect } from 'react';
import { ExportHistoryItem, ExportFormat, ExportRequest, ExportResult } from '../../shared/types/export';
import { storage } from '../../shared/utils/storage';
import { logger } from '../../shared/utils/logger';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExportUrl, setLastExportUrl] = useState<string | undefined>();
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');

  const exportAsMarkdown = useCallback(async (meetingId: string, content?: string): Promise<string> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      if (!content) throw new Error("No content to export");
      
      logger.info('Exporting meeting as Markdown', { meetingId });

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      setLastExportUrl(url);
        
      // Add to history
      const historyItem: ExportHistoryItem = {
          id: Date.now().toString(),
          meetingId,
          format: 'markdown',
          url: url,
          timestamp: new Date().toISOString(),
          success: true,
      };
        
      const newHistory = [historyItem, ...exportHistory].slice(0, 20);
      setExportHistory(newHistory);
      await storage.set('export_history', newHistory);
        
      logger.info('Markdown export completed successfully', { meetingId, url });
      return url;
    } catch (err: any) {
      const errorMessage = err.message || 'Markdown export failed';
      setExportError(errorMessage);
      logger.error('Markdown export failed', err);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [exportHistory]);

  const exportAsText = useCallback(async (meetingId: string, content?: string): Promise<string> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      if (!content) throw new Error("No content to export");

      logger.info('Exporting meeting as Text', { meetingId });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      setLastExportUrl(url);
        
      // Add to history
      const historyItem: ExportHistoryItem = {
          id: Date.now().toString(),
          meetingId,
          format: 'text',
          url: url,
          timestamp: new Date().toISOString(),
          success: true,
      };
        
      const newHistory = [historyItem, ...exportHistory].slice(0, 20);
      setExportHistory(newHistory);
      await storage.set('export_history', newHistory);
        
      logger.info('Text export completed successfully', { meetingId, url });
      return url;

    } catch (err: any) {
      const errorMessage = err.message || 'Text export failed';
      setExportError(errorMessage);
      logger.error('Text export failed', err);
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
    exportAsMarkdown,
    exportAsText,
    clearExportError,
    openFile,
    getExportHistory,
    setSelectedFormat,
  };
};