import { describe, test, expect, beforeEach } from 'vitest';
import { I18nManager } from '../js/i18n.js';

describe('I18nManager Unit Tests', () => {
  let i18n;

  beforeEach(() => {
    i18n = new I18nManager();
  });

  test('should initialize default settings', () => {
    expect(i18n.currentLanguage).toBe('en');
    expect(i18n.translations).toBeDefined();
    expect(i18n.translations.en).toBeDefined();
    expect(i18n.translations.es).toBeDefined();
    expect(i18n.translations.fr).toBeDefined();
  });

  test('should switch languages correctly', () => {
    i18n.setLanguage('es');
    expect(i18n.currentLanguage).toBe('es');
    i18n.setLanguage('invalid_lang');
    expect(i18n.currentLanguage).toBe('en'); // fallback
  });

  test('should return translations or fallbacks', () => {
    expect(i18n.translate('mode_fan')).toBe('🎫 Fan');
    
    // Switch to es
    i18n.setLanguage('es');
    expect(i18n.translate('mode_fan')).toBe('🎫 Fanático');
    
    // Non-existent key should return the key itself
    expect(i18n.translate('non_existent_key')).toBe('non_existent_key');
  });

  test('should translate elements in DOM', () => {
    document.body.innerHTML = `
      <div data-i18n="mode_fan">Old Text</div>
      <input data-i18n="placeholder_chat" placeholder="old placeholder" />
    `;
    
    i18n.translateDOM();
    expect(document.querySelector('[data-i18n="mode_fan"]').textContent).toBe('🎫 Fan');
    expect(document.querySelector('[data-i18n="placeholder_chat"]').placeholder).toBe('Ask me anything about the stadium...');
  });
});
