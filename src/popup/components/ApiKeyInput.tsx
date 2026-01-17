import React, { useState } from 'react';

interface Props {
  apiKeys: Record<string, string>;
  onSave: (keys: Record<string, string>) => void;
}

export const ApiKeyInput: React.FC<Props> = ({ apiKeys, onSave }) => {
  const [keys, setKeys] = useState(apiKeys);

  const handleChange = (provider: string, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
  };

  return (
    <div className="api-key-input">
      <h4>API Keys</h4>
      <div className="input-group">
        <label>OpenAI Key</label>
        <input 
          type="password" 
          value={keys.openai || ''} 
          onChange={(e) => handleChange('openai', e.target.value)}
          placeholder="sk-..."
        />
      </div>
      <div className="input-group">
        <label>Claude Key</label>
        <input 
          type="password" 
          value={keys.claude || ''} 
          onChange={(e) => handleChange('claude', e.target.value)}
          placeholder="sk-ant-..."
        />
      </div>
      <div className="input-group">
        <label>Groq Key (Free)</label>
        <input 
          type="password" 
          value={keys.groq || ''} 
          onChange={(e) => handleChange('groq', e.target.value)}
          placeholder="gsk_..."
        />
      </div>
      <button onClick={() => onSave(keys)}>Save Keys</button>
    </div>
  );
};
