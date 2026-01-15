import React, { useState, useMemo } from 'react';
import { SUPPORTED_LANGUAGES } from '../../shared/types/translation';
import './LanguagePairSelector.css';

interface LanguagePairSelectorProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  onSwap: () => void;
  disabled?: boolean;
}

export const LanguagePairSelector: React.FC<LanguagePairSelectorProps> = ({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
  onSwap,
  disabled = false,
}) => {
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  const filteredSourceLanguages = useMemo(() => {
    if (!sourceSearch) return [{ code: 'auto', name: 'Auto-detect', flag: '🔍' }, ...SUPPORTED_LANGUAGES];
    return [
      { code: 'auto', name: 'Auto-detect', flag: '🔍' },
      ...SUPPORTED_LANGUAGES.filter(lang => 
        lang.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
        lang.code.toLowerCase().includes(sourceSearch.toLowerCase())
      )
    ];
  }, [sourceSearch]);

  const filteredTargetLanguages = useMemo(() => {
    if (!targetSearch) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
      lang.code.toLowerCase().includes(targetSearch.toLowerCase())
    );
  }, [targetSearch]);

  const getCurrentLanguage = (code: string, isTarget: boolean = false) => {
    if (code === 'auto') return { code: 'auto', name: 'Auto-detect', flag: '🔍' };
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language || (isTarget ? SUPPORTED_LANGUAGES[0] : { code: 'auto', name: 'Auto-detect', flag: '🔍' });
  };

  const handleSourceSelect = (langCode: string) => {
    onSourceChange(langCode);
    setSourceDropdownOpen(false);
    setSourceSearch('');
  };

  const handleTargetSelect = (langCode: string) => {
    onTargetChange(langCode);
    setTargetDropdownOpen(false);
    setTargetSearch('');
  };

  const handleSwap = () => {
    if (sourceLanguage === 'auto') {
      // If source is auto-detect, we can't swap meaningfully
      return;
    }
    onSwap();
  };

  return (
    <div className="language-pair-selector">
      <div className="language-row">
        {/* Source Language Selector */}
        <div className="language-select-container">
          <label className="select-label">From</label>
          <div className={`dropdown ${sourceDropdownOpen ? 'open' : ''}`}>
            <button
              className="dropdown-button"
              onClick={() => !disabled && setSourceDropdownOpen(!sourceDropdownOpen)}
              disabled={disabled}
              aria-expanded={sourceDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="flag">{getCurrentLanguage(sourceLanguage).flag}</span>
              <span className="language-name">{getCurrentLanguage(sourceLanguage).name}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {sourceDropdownOpen && (
              <div className="dropdown-menu" role="listbox">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search languages..."
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    className="search-input"
                    autoFocus
                  />
                </div>
                <div className="language-list">
                  {filteredSourceLanguages.map((language) => (
                    <button
                      key={language.code}
                      className={`language-option ${sourceLanguage === language.code ? 'selected' : ''}`}
                      onClick={() => handleSourceSelect(language.code)}
                      role="option"
                      aria-selected={sourceLanguage === language.code}
                    >
                      <span className="flag">{language.flag}</span>
                      <span className="language-name">{language.name}</span>
                      <span className="language-code">{language.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <button
          className="swap-button"
          onClick={handleSwap}
          disabled={disabled || sourceLanguage === 'auto'}
          title="Swap languages"
        >
          ⇄
        </button>

        {/* Target Language Selector */}
        <div className="language-select-container">
          <label className="select-label">To</label>
          <div className={`dropdown ${targetDropdownOpen ? 'open' : ''}`}>
            <button
              className="dropdown-button"
              onClick={() => !disabled && setTargetDropdownOpen(!targetDropdownOpen)}
              disabled={disabled}
              aria-expanded={targetDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="flag">{getCurrentLanguage(targetLanguage, true).flag}</span>
              <span className="language-name">{getCurrentLanguage(targetLanguage, true).name}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {targetDropdownOpen && (
              <div className="dropdown-menu" role="listbox">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search languages..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="search-input"
                    autoFocus
                  />
                </div>
                <div className="language-list">
                  {filteredTargetLanguages.map((language) => (
                    <button
                      key={language.code}
                      className={`language-option ${targetLanguage === language.code ? 'selected' : ''}`}
                      onClick={() => handleTargetSelect(language.code)}
                      role="option"
                      aria-selected={targetLanguage === language.code}
                    >
                      <span className="flag">{language.flag}</span>
                      <span className="language-name">{language.name}</span>
                      <span className="language-code">{language.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Pair Display */}
      <div className="current-pair">
        <span className="pair-label">Active pair:</span>
        <span className="pair-languages">
          {getCurrentLanguage(sourceLanguage).flag} {getCurrentLanguage(sourceLanguage).name} →{' '}
          {getCurrentLanguage(targetLanguage, true).flag} {getCurrentLanguage(targetLanguage, true).name}
        </span>
      </div>

      {/* Click outside to close dropdowns */}
      {(sourceDropdownOpen || targetDropdownOpen) && (
        <div 
          className="dropdown-backdrop"
          onClick={() => {
            setSourceDropdownOpen(false);
            setTargetDropdownOpen(false);
            setSourceSearch('');
            setTargetSearch('');
          }}
        />
      )}
    </div>
  );
};