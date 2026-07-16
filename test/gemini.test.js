import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { GeminiService } from '../js/gemini.js';

describe('GeminiService Unit Tests', () => {
  let service;

  beforeEach(() => {
    localStorage.clear();
    service = new GeminiService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should initialize mock mode by default without API key', () => {
    expect(service.isAvailable).toBe(false);
    expect(service.apiKey).toBe('');
  });

  test('should initialize active mode when API key is set', () => {
    service.setApiKey('AIzaSyValidApiKeyForGeminiTesting');
    expect(service.isAvailable).toBe(true);
    expect(service.apiKey).toBe('AIzaSyValidApiKeyForGeminiTesting');
    const stored = JSON.parse(localStorage.getItem('stadiumai_api_key'));
    expect(stored).toBeDefined();
    expect(stored.s).toBe(true);
    expect(decodeURIComponent(atob(stored.v))).toBe('AIzaSyValidApiKeyForGeminiTesting');
  });

  test('should fallback to mock key length is short', () => {
    service.setApiKey('short');
    expect(service.isAvailable).toBe(false);
  });

  test('should update venue text context', () => {
    expect(service.systemPrompt).toContain('MetLife Stadium');
    service.setVenueContext('SoFi Stadium');
    expect(service.systemPrompt).toContain('SoFi Stadium');
    expect(service.systemPrompt).not.toContain('MetLife Stadium —');
  });

  test('should fetch response from live Gemini API on success', async () => {
    service.setApiKey('AIzaSyValidApiKeyForGeminiTesting');
    
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'Live response message' }]
        }
      }]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const res = await service.sendMessage('Who are you?', 'en');
    expect(res.text).toBe('Live response message');
    expect(res.source).toBe('gemini');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('should fallback to mock responses on API failure or non-ok connection', async () => {
    service.setApiKey('AIzaSyValidApiKeyForGeminiTesting');

    // Make fetch throw or return error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const res = await service.sendMessage('Where is the nearest restroom?', 'en');
    expect(res.source).toBe('mock');
    expect(res.text).toContain('Nearest Restrooms');
  });

  test('should throw error or fallback if response structure is invalid', async () => {
    service.setApiKey('AIzaSyValidApiKeyForGeminiTesting');
    
    // Missing parts text content
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [] })
    });

    const res = await service.sendMessage('Tell me about the weather', 'en');
    expect(res.source).toBe('mock');
    expect(res.text).toContain('Venue Conditions');
  });

  test('should handle language inputs and update system Prompt instructs', async () => {
    service.setApiKey('AIzaSyValidApiKeyForGeminiTesting');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Hola' }] } }]
      })
    });

    await service.sendMessage('Hola', 'es');
    const calls = global.fetch.mock.calls;
    const callArgs = calls[calls.length - 1];
    const body = JSON.parse(callArgs[1].body);
    expect(body.contents[0].parts[0].text).toContain('[Respond in Spanish]');
    expect(body.systemInstruction.parts[0].text).toContain('CRITICAL: The user has selected Spanish');
  });
});
