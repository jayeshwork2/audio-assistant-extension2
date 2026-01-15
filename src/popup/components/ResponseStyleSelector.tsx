import React, { useState, useEffect } from 'react';
import { ResponseStyle } from '../../shared/types/ai-response';
import './ResponseStyleSelector.css';

interface ResponseStyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  loading?: boolean;
  availableStyles?: ResponseStyle[];
}

const DEFAULT_STYLES: ResponseStyle[] = [
  {
    name: 'formal',
    description: 'Formal/Professional',
    sample: 'I would be pleased to provide you with a comprehensive analysis of the current market conditions and strategic recommendations for your consideration.',
    icon: '💼'
  },
  {
    name: 'casual',
    description: 'Casual/Conversational',
    sample: 'Hey! So I was thinking about what you said, and honestly, it makes total sense. Here\'s what I\'m thinking...',
    icon: '😊'
  },
  {
    name: 'technical',
    description: 'Technical/Detailed',
    sample: 'Based on the empirical data analysis and algorithmic performance metrics, the optimal solution requires implementing a distributed microservices architecture with containerization.',
    icon: '⚙️'
  },
  {
    name: 'eli5',
    description: 'ELI5 (Explain Like I\'m 5)',
    sample: 'Think of it like this: imagine you have a really big toy box, and you want to find your favorite toy. You could look in every single place, or you could make a map! That\'s what computers do - they make maps to find things super fast.',
    icon: '🧸'
  },
  {
    name: 'funny',
    description: 'Funny/Creative',
    sample: 'Well, isn\'t that just like a cat deciding to walk across your keyboard right when you\'re typing an important email? Life\'s got a sense of humor, and this is one of its jokes! 🤪',
    icon: '😄'
  },
  {
    name: 'bullet',
    description: 'Bullet Points/Summary',
    sample: '• Key point one with actionable insight\n• Important consideration that affects the outcome\n• Next steps to move forward effectively',
    icon: '📝'
  }
];

export const ResponseStyleSelector: React.FC<ResponseStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  loading = false,
  availableStyles = DEFAULT_STYLES,
}) => {
  const [previewStyle, setPreviewStyle] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleStyleSelect = (styleName: string) => {
    if (!loading) {
      onStyleChange(styleName);
    }
  };

  const handlePreview = (styleName: string) => {
    setPreviewStyle(styleName);
    setShowPreview(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent, styleName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStyleSelect(styleName);
    } else if (event.key === 'p' && event.ctrlKey) {
      event.preventDefault();
      handlePreview(styleName);
    }
  };

  const getCurrentStyle = () => {
    return availableStyles.find(style => style.name === selectedStyle) || availableStyles[0];
  };

  const currentStyle = getCurrentStyle();

  return (
    <div className="response-style-selector">
      <div className="selector-header">
        <h4>Response Style</h4>
        <span className="current-style">
          {currentStyle.icon} {currentStyle.description}
        </span>
      </div>

      <div className="style-grid" role="radiogroup" aria-label="Response styles">
        {availableStyles.map((style) => (
          <div
            key={style.name}
            className={`style-option ${selectedStyle === style.name ? 'selected' : ''}`}
            role="radio"
            aria-checked={selectedStyle === style.name}
            tabIndex={selectedStyle === style.name ? 0 : -1}
            onClick={() => handleStyleSelect(style.name)}
            onKeyDown={(e) => handleKeyDown(e, style.name)}
            onMouseEnter={() => handlePreview(style.name)}
            onMouseLeave={() => setShowPreview(false)}
          >
            <div className="style-icon">{style.icon}</div>
            <div className="style-content">
              <div className="style-name">{style.description}</div>
              {selectedStyle === style.name && (
                <div className="selected-badge">Selected</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && previewStyle && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h5>
                {availableStyles.find(s => s.name === previewStyle)?.icon} {' '}
                {availableStyles.find(s => s.name === previewStyle)?.description} Preview
              </h5>
              <button 
                className="close-preview"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <div className="preview-content">
              <p>{availableStyles.find(s => s.name === previewStyle)?.sample}</p>
            </div>
          </div>
        </div>
      )}

      <div className="selector-footer">
        <div className="usage-hint">
          💡 Click any style to apply • Press Enter to select • Ctrl+P for preview
        </div>
      </div>
    </div>
  );
};