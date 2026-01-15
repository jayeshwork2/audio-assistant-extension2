import React from 'react';

interface PermissionRequestProps {
  permissionError?: string | null;
  onRetry: () => void | Promise<any>;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  permissionError,
  onRetry,
}) => {
  return (
    <div className="permission-request">
      <div className="permission-icon">🎤</div>
      <h3>Microphone Access Needed</h3>
      <p>
        Audio Assistant needs microphone access to record and transcribe your audio.
      </p>
      
      {permissionError && (
        <div className="permission-error">
          <p>{permissionError}</p>
          <div className="help-text">
            <strong>How to enable:</strong>
            <ol>
              <li>Click the lock icon (🔒) in the address bar</li>
              <li>Toggle <strong>Microphone</strong> to <strong>Allow</strong></li>
              <li>Refresh the extension</li>
            </ol>
          </div>
        </div>
      )}

      <button className="primary-button" onClick={onRetry}>
        {permissionError ? 'Try Again' : 'Grant Permission'}
      </button>
    </div>
  );
};
