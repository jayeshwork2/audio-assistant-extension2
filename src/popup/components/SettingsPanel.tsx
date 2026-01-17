import React from 'react';
import { UserSettings } from '../../shared/types/settings';
import { ProviderSelector } from './ProviderSelector';
import { ApiKeyInput } from './ApiKeyInput';
import { LanguageSelector } from './LanguageSelector';

interface Props {
  settings: UserSettings;
  onUpdate: (settings: Partial<UserSettings>) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<Props> = ({
  settings,
  onUpdate,
  onClose
}) => {
  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Settings</h3>
        <button onClick={onClose}>Close</button>
      </div>
      
      <div className="settings-content">
        <div className="language-section">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Transcription Language (Input)</label>
            <LanguageSelector 
              selectedLanguage={settings.language}
              onLanguageChange={(lang) => onUpdate({ language: lang })}
            />
        </div>

        <div className="language-section" style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>AI Response Language (Output)</label>
             <LanguageSelector 
              selectedLanguage={settings.responseLanguage || 'en-US'}
              onLanguageChange={(lang) => onUpdate({ responseLanguage: lang })}
            />
        </div>

        <div className="context-section" style={{ marginTop: '16px' }}>
             <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Recording Context / Topic</label>
             <textarea
                style={{ 
                    width: '100%', 
                    minHeight: '80px', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    fontFamily: 'inherit',
                    resize: 'vertical' 
                }}
                placeholder="E.g., Online team meeting, Interview with candidate, Lecture on History, etc."
                value={settings.userContext || ''}
                onChange={(e) => onUpdate({ userContext: e.target.value })}
             />
             <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Provide details about what this recording is (e.g., meeting type, topic) to help the AI understand better.
             </small>
        </div>

        <ProviderSelector 
          selectedSTT={settings.sttProvider}
          selectedAI={settings.aiProvider}
          onSTTChange={(stt) => onUpdate({ sttProvider: stt })}
          onAIChange={(ai) => onUpdate({ aiProvider: ai })}
        />

        <ApiKeyInput 
          apiKeys={settings.apiKeys}
          onSave={(keys) => onUpdate({ apiKeys: keys })}
        />

        <div className="advanced-settings">
          <label>
            <input 
              type="checkbox" 
              checked={settings.autoSave}
              onChange={(e) => onUpdate({ autoSave: e.target.checked })}
            />
            Auto-save transcripts
          </label>
        </div>
      </div>
    </div>
  );
};
