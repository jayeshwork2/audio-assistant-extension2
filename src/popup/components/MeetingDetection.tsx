import React, { useState } from 'react';
import { MeetingContext } from '../../shared/types/meeting';
import './MeetingDetection.css';

interface MeetingDetectionProps {
  meetingType?: string;
  domain?: string;
  formality?: string;
  urgency?: string;
  duration?: number;
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  isDetecting?: boolean;
  onUpdate?: (updates: Partial<MeetingContext>) => void;
}

const MEETING_TYPES = [
  { value: 'meeting', label: 'Meeting', icon: '👥' },
  { value: 'interview', label: 'Interview', icon: '💼' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'training', label: 'Training', icon: '📚' },
];

const DOMAINS = [
  { value: 'technical', label: 'Technical', icon: '⚙️' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'legal', label: 'Legal', icon: '⚖️' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
];

export const MeetingDetection: React.FC<MeetingDetectionProps> = ({
  meetingType,
  domain,
  formality,
  urgency,
  duration,
  summary,
  keyPoints = [],
  actionItems = [],
  isDetecting = false,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    meetingType: meetingType || '',
    domain: domain || '',
    formality: formality || '',
    urgency: urgency || '',
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = (urgencyLevel?: string) => {
    switch (urgencyLevel?.toLowerCase()) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getUrgencyIcon = (urgencyLevel?: string) => {
    switch (urgencyLevel?.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      meetingType: meetingType || '',
      domain: domain || '',
      formality: formality || '',
      urgency: urgency || '',
    });
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editForm);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      meetingType: meetingType || '',
      domain: domain || '',
      formality: formality || '',
      urgency: urgency || '',
    });
  };

  const getMeetingTypeInfo = (type?: string) => {
    return MEETING_TYPES.find(t => t.value === type) || MEETING_TYPES[0];
  };

  const getDomainInfo = (domainType?: string) => {
    return DOMAINS.find(d => d.value === domainType) || DOMAINS[0];
  };

  if (isDetecting && !meetingType) {
    return (
      <div className="meeting-detection detecting-state">
        <div className="detecting-content">
          <div className="detecting-spinner"></div>
          <h4>Analyzing meeting context...</h4>
          <p>Extracting meeting type, domain, and key insights</p>
        </div>
      </div>
    );
  }

  if (!meetingType && !domain && !formality && !urgency) {
    return null;
  }

  return (
    <div className="meeting-detection">
      <div className="detection-header">
        <h4>Meeting Context</h4>
        {!isEditing && onUpdate && (
          <button 
            className="edit-button"
            onClick={handleEdit}
            title="Edit meeting context"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>Meeting Type</label>
            <select 
              value={editForm.meetingType} 
              onChange={(e) => setEditForm({...editForm, meetingType: e.target.value})}
            >
              <option value="">Select type</option>
              {MEETING_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Domain</label>
            <select 
              value={editForm.domain} 
              onChange={(e) => setEditForm({...editForm, domain: e.target.value})}
            >
              <option value="">Select domain</option>
              {DOMAINS.map(domainItem => (
                <option key={domainItem.value} value={domainItem.value}>
                  {domainItem.icon} {domainItem.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Formality</label>
            <select 
              value={editForm.formality} 
              onChange={(e) => setEditForm({...editForm, formality: e.target.value})}
            >
              <option value="">Select formality</option>
              <option value="formal">📋 Formal</option>
              <option value="informal">😊 Informal</option>
              <option value="mixed">🔄 Mixed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Urgency</label>
            <select 
              value={editForm.urgency} 
              onChange={(e) => setEditForm({...editForm, urgency: e.target.value})}
            >
              <option value="">Select urgency</option>
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          <div className="edit-actions">
            <button className="save-button" onClick={handleSave}>
              ✓ Save
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="detection-content">
          <div className="detection-badges">
            {meetingType && (
              <div className="badge meeting-type">
                <span className="badge-icon">{getMeetingTypeInfo(meetingType).icon}</span>
                <span className="badge-text">{getMeetingTypeInfo(meetingType).label}</span>
              </div>
            )}

            {domain && (
              <div className="badge domain">
                <span className="badge-icon">{getDomainInfo(domain).icon}</span>
                <span className="badge-text">{getDomainInfo(domain).label}</span>
              </div>
            )}

            {formality && (
              <div className="badge formality">
                <span className="badge-icon">
                  {formality === 'formal' ? '📋' : formality === 'informal' ? '😊' : '🔄'}
                </span>
                <span className="badge-text">
                  {formality.charAt(0).toUpperCase() + formality.slice(1)}
                </span>
              </div>
            )}

            {urgency && (
              <div className="badge urgency" style={{ borderColor: getUrgencyColor(urgency) }}>
                <span className="badge-icon">{getUrgencyIcon(urgency)}</span>
                <span className="badge-text">
                  {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority
                </span>
              </div>
            )}
          </div>

          <div className="detection-metrics">
            {duration && (
              <div className="metric">
                <span className="metric-label">Duration:</span>
                <span className="metric-value">{formatDuration(duration)}</span>
              </div>
            )}
          </div>

          {summary && (
            <div className="meeting-summary">
              <h5>Summary</h5>
              <p>{summary}</p>
            </div>
          )}

          {keyPoints.length > 0 && (
            <div className="key-points">
              <h5>Key Points</h5>
              <ul>
                {keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {actionItems.length > 0 && (
            <div className="action-items">
              <h5>Action Items</h5>
              <ul>
                {actionItems.map((item, index) => (
                  <li key={index}>
                    <input type="checkbox" disabled />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};