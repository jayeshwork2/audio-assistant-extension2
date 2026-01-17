import React, { useState } from 'react';
import { ExportHistoryItem, ExportFormat } from '../../shared/types/export';
import './ExportPanel.css';

interface ExportPanelProps {
  meetingId?: string;
  transcriptText: string;
  isExporting: boolean;
  exportError?: string;
  lastExportUrl?: string;
  onExportMarkdown: () => Promise<void>;
  onExportText: () => Promise<void>;
  exportHistory?: ExportHistoryItem[];
  onSelectHistoryItem?: (item: ExportHistoryItem) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  meetingId,
  transcriptText,
  isExporting,
  exportError,
  lastExportUrl,
  onExportMarkdown,
  onExportText,
  exportHistory = [],
  onSelectHistoryItem,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleExport = async (format: 'markdown' | 'text') => {
    if (!meetingId) {
      alert('No meeting ID available. Please start a new recording.');
      return;
    }

    try {
      switch (format) {
        case 'markdown':
          await onExportMarkdown();
          break;
        case 'text':
          await onExportText();
          break;
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const copyLastExportUrl = async () => {
    if (lastExportUrl) {
      try {
        await navigator.clipboard.writeText(lastExportUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'markdown': return '📝';
      case 'text': return '📋';
      default: return '📄';
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case 'markdown': return 'Markdown';
      case 'text': return 'Text';
      default: return format;
    }
  };

  if (!transcriptText) {
    return (
      <div className="export-panel empty-state">
        <h4>Export</h4>
        <p className="empty-message">Transcribe some audio first to enable export</p>
      </div>
    );
  }

  return (
    <div className="export-panel">
      <div className="panel-header">
        <h4>Export</h4>
        {exportHistory.length > 0 && (
          <button 
            className={`history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Export History"
          >
            📜 {showHistory ? 'Hide' : 'Show'} History
          </button>
        )}
      </div>

      <div className="export-content">
        {/* Export Format Buttons */}
        <div className="export-formats">
          <h5>Choose Format</h5>
          <div className="format-buttons">
            <button
              className="format-button markdown"
              onClick={() => handleExport('markdown')}
              disabled={isExporting || !meetingId}
              title="Export as Markdown"
            >
              <span className="format-icon">📝</span>
              <span className="format-label">Markdown</span>
            </button>

            <button
              className="format-button text"
              onClick={() => handleExport('text')}
              disabled={isExporting || !meetingId}
              title="Export as Plain Text"
            >
              <span className="format-icon">📋</span>
              <span className="format-label">Text</span>
            </button>
          </div>
        </div>

        {/* Export Status */}
        {isExporting && (
          <div className="export-status">
            <div className="status-spinner"></div>
            <span>Exporting...</span>
          </div>
        )}

        {/* Last Export Success */}
        {lastExportUrl && !isExporting && !exportError && (
          <div className="export-success">
            <div className="success-message">
              <span className="success-icon">✅</span>
              <span>Export completed successfully!</span>
            </div>
            <div className="export-link">
              <button 
                className="copy-link-button"
                onClick={copyLastExportUrl}
                title="Copy download link"
              >
                {copySuccess ? '✓ Copied!' : '📋 Copy Link'}
              </button>
              <a 
                href={lastExportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
              >
                Download File
              </a>
            </div>
          </div>
        )}

        {/* Export Error */}
        {exportError && (
          <div className="export-error">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{exportError}</p>
            <button 
              className="retry-export-button"
              onClick={() => {
                // Retry logic would be handled by parent component
                console.log('Retry export requested');
              }}
            >
              Retry Export
            </button>
          </div>
        )}

        {/* Export History */}
        {showHistory && exportHistory.length > 0 && (
          <div className="export-history">
            <h5>Recent Exports</h5>
            <div className="history-list">
              {exportHistory.map((item) => (
                <div 
                  key={item.id}
                  className={`history-item ${item.success ? 'success' : 'error'}`}
                  onClick={() => onSelectHistoryItem?.(item)}
                >
                  <div className="history-format">
                    <span className="format-icon">{getFormatIcon(item.format)}</span>
                    <span className="format-name">{getFormatLabel(item.format)}</span>
                  </div>
                  <div className="history-preview">
                    {item.url ? (
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Download
                      </a>
                    ) : (
                      <span className="status-text">
                        {item.success ? 'Sent' : 'Failed'}
                      </span>
                    )}
                  </div>
                  <div className="history-meta">
                    <span className="history-time">
                      {formatTimestamp(item.timestamp)}
                    </span>
                    {item.errorMessage && (
                      <span className="error-text">{item.errorMessage}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};