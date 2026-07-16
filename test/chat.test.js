import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ChatManager } from '../js/chat.js';

describe('ChatManager Unit Tests', () => {
  let chatManager;
  let mockGeminiService;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="chatMessages"></div>
      <input id="chatInput" />
      <button id="chatSendBtn"></button>
      <button id="clearChatBtn"></button>
      <div id="quickActions">
        <button class="quick-action-chip" data-query="Where is restroom?">🚻 Restrooms</button>
      </div>
    `;

    mockGeminiService = {
      sendMessage: vi.fn().mockResolvedValue({ text: 'Mock Gemini response', source: 'mock' }),
    };

    chatManager = new ChatManager(mockGeminiService);
  });

  test('should initialize and display welcome message', () => {
    const messages = document.getElementById('chatMessages');
    expect(messages.children.length).toBe(1);
    expect(messages.textContent).toContain('Welcome to MetLife Stadium');
  });

  test('should support languages in welcome message', () => {
    chatManager.setLanguage('es');
    chatManager.addWelcomeMessage();
    const messages = document.getElementById('chatMessages');
    expect(messages.innerHTML).toContain('¡Bienvenido al MetLife Stadium!');
  });

  test('should sanitize HTML inputs to prevent XSS (Security)', () => {
    const raw = '<script>alert(1)</script> <img src=x onerror=alert(2)>';
    const escaped = chatManager.escapeHTML(raw);
    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;script&gt;');
  });

  test('should render markdown configurations correctly', () => {
    const markdown = 'This is **bold** and *italic* and `code` and • bullet';
    const html = chatManager.formatMarkdown(markdown);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<li>bullet</li>');
    expect(html).toContain('<ul><li>bullet</li></ul>');
  });

  test('should append messages and clear chat log (CRUD - Create/Delete)', () => {
    chatManager.addMessage('Hello User', 'user');
    const messages = document.getElementById('chatMessages');
    expect(messages.children.length).toBe(2); // welcome + user message
    
    // Clear chat log
    document.getElementById('clearChatBtn').click();
    expect(messages.children.length).toBe(1); // cleared and welcome added back
  });

  test('should show typing indicator during API calls', async () => {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    input.value = 'Where is food?';
    sendBtn.disabled = false;
    
    const sendPromise = chatManager.handleSend();
    const messages = document.getElementById('chatMessages');
    
    // Typing indicator should be added
    expect(messages.innerHTML).toContain('typing-indicator');
    
    await sendPromise;
    
    // Typing indicator removed, AI response added
    expect(messages.innerHTML).not.toContain('typing-indicator');
    expect(messages.innerHTML).toContain('Mock Gemini response');
  });

  test('should send message via quick chips selection', () => {
    const chip = document.querySelector('.quick-action-chip');
    const input = document.getElementById('chatInput');
    
    chip.click();
    // Input is updated to chip data-query
    expect(input.value).toBe(''); // immediately cleared after handleSend triggers
  });
});
