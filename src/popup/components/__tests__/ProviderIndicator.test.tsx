import React from 'react';
import { ProviderIndicator } from '../ProviderIndicator';
import { AIProviderType } from '../../../shared/types/providers';

// Basic smoke tests - full component testing would require @testing-library/react
describe('ProviderIndicator', () => {
  it('should render without crashing', () => {
    const component = React.createElement(ProviderIndicator, {});
    expect(component).toBeDefined();
  });

  it('should accept STT provider prop', () => {
    const component = React.createElement(ProviderIndicator, {
      sttProvider: 'groq',
    });
    expect(component).toBeDefined();
    expect(component.props.sttProvider).toBe('groq');
  });

  it('should accept AI provider prop', () => {
    const component = React.createElement(ProviderIndicator, {
      aiProvider: AIProviderType.CLAUDE,
    });
    expect(component).toBeDefined();
    expect(component.props.aiProvider).toBe(AIProviderType.CLAUDE);
  });

  it('should accept both providers', () => {
    const component = React.createElement(ProviderIndicator, {
      sttProvider: 'groq',
      aiProvider: AIProviderType.GPT4,
    });
    expect(component).toBeDefined();
    expect(component.props.sttProvider).toBe('groq');
    expect(component.props.aiProvider).toBe(AIProviderType.GPT4);
  });

});
