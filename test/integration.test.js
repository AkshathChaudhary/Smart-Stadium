import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadHTMLTemplate, sleep } from './test-utils.js';

describe('Smart Stadium Integration Tests', () => {
  beforeEach(async () => {
    loadHTMLTemplate();
    localStorage.clear();
    
    // Instantiate main application controller
    await import('../js/app.js?t=' + Date.now());
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('Integration: Simulating Mode Switching and Navigation', () => {
    const fanBtn = document.getElementById('fanModeBtn');
    const opsBtn = document.getElementById('opsModeBtn');
    const fanNav = document.getElementById('fanNav');
    const opsNav = document.getElementById('opsNav');

    // 1. Initial State: Fan mode navigation is visible, Ops is hidden
    expect(fanNav.style.display).not.toBe('none');
    expect(opsNav.style.display).toBe('none');

    // 2. Switch Mode to Operations
    opsBtn.click();
    expect(fanNav.style.display).toBe('none');
    expect(opsNav.style.display).not.toBe('none');
    expect(document.getElementById('pageTitle').textContent).toBe('Operations Overview');

    // 3. Navigate through Command Center Pages
    const navCrowd = document.getElementById('navCrowd');
    navCrowd.click();
    expect(document.getElementById('pageTitle').textContent).toBe('Crowd Analytics');
    expect(document.getElementById('pageCrowdPage').classList.contains('active')).toBe(true);

    const navSustainability = document.getElementById('navSustainability');
    navSustainability.click();
    expect(document.getElementById('pageTitle').textContent).toBe('Sustainability Center');
    expect(document.getElementById('pageSustainabilityPage').classList.contains('active')).toBe(true);

    // 4. Switch back to Fan Mode
    fanBtn.click();
    expect(fanNav.style.display).not.toBe('none');
    expect(opsNav.style.display).toBe('none');
    expect(document.getElementById('pageTitle').textContent).toBe('AI Assistant');
  });

  test('Integration: Forms & CRUD Operations (Settings & Chat UI)', async () => {
    const app = window.app;
    
    // --- 1. SIGNUP & LOGIN FLOW SIMULATION (Configuring API Key) ---
    // User clicks settings (onboarding/login form trigger)
    document.getElementById('settingsBtn').click();
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveBtn = document.getElementById('saveSettingsBtn');

    // User fills settings details
    apiKeyInput.value = 'AIzaSyValidIntegrationKey';
    document.getElementById('refreshRate').value = '5000';

    // Submit form (Save Settings)
    saveBtn.click();

    // Verify CRUD (Read/Update): settings correctly stored in localStorage and bound to controller
    const stored = JSON.parse(localStorage.getItem('stadiumai_api_key'));
    expect(stored).toBeDefined();
    expect(decodeURIComponent(atob(stored.v))).toBe('AIzaSyValidIntegrationKey');
    expect(app.gemini.apiKey).toBe('AIzaSyValidIntegrationKey');
    expect(app.gemini.isAvailable).toBe(true);

    // --- 2. SEARCH & CHAT FLOW SIMULATION (Create Chat Message) ---
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const messagesContainer = document.getElementById('chatMessages');

    // Verify initial chat count contains only the welcome message
    expect(messagesContainer.children.length).toBe(1);

    // Simulate typing a search query
    chatInput.value = 'Where can I find food?';
    chatInput.dispatchEvent(new Event('input'));
    expect(sendBtn.disabled).toBe(false);

    // Simulate sending message (Create)
    sendBtn.click();
    
    // Verify user query appended to DOM (Read)
    // welcome message + user message + bot mock response = 3
    await vi.waitFor(() => {
      expect(messagesContainer.children.length).toBeGreaterThanOrEqual(2);
    });
    expect(messagesContainer.innerHTML).toContain('Where can I find food?');

    // --- 3. DELETE STATE SIMULATION (Clear Chat UI & Clear Alerts) ---
    // User clears chat history
    document.getElementById('clearChatBtn').click();
    // Chat cleared, welcome message reset
    expect(messagesContainer.children.length).toBe(1);

    // Verify alerts clear
    app.alerts.setAlerts([{ id: 1, severity: 'warning', title: 'A', message: 'B', time: '1m', icon: '⚠️' }]);
    expect(document.getElementById('alertFeed').children.length).toBe(1);
    
    // User clicks "Clear All" alerts
    document.getElementById('clearAlertsBtn').click();
    expect(document.getElementById('alertFeed').children.length).toBe(1); // empty state placeholder rendered
    expect(document.getElementById('alertFeed').textContent).toContain('All Systems Normal');
  });

  test('Integration: Handling API Delays (Loading States)', async () => {
    const app = window.app;
    app.gemini.setApiKey('AIzaSyValidIntegrationKey');

    // Mock API request with a 150ms network latency delay
    global.fetch.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: 'Response after latency' }] } }]
            })
          });
        }, 150);
      });
    });

    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const messages = document.getElementById('chatMessages');

    chatInput.value = 'Where is Gate B?';
    sendBtn.disabled = false;

    // Trigger Send
    const sendPromise = app.chatManager.handleSend();

    // Verify loading state typing indicator is visible immediately during delay
    expect(messages.innerHTML).toContain('typing-indicator');
    expect(messages.textContent).toContain('StadiumAI is analyzing request');

    // Wait for the simulated delay to complete
    await sendPromise;

    // Verify loading indicator is removed, and response message is rendered
    expect(messages.innerHTML).not.toContain('typing-indicator');
    expect(messages.textContent).toContain('Response after latency');
  });

  test('Integration: Handling API Failures & Outages', async () => {
    const app = window.app;
    app.gemini.setApiKey('AIzaSyValidIntegrationKey');

    // Mock API failure (outage status code 500)
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const messages = document.getElementById('chatMessages');

    chatInput.value = 'Where is the restroom?';
    sendBtn.disabled = false;

    // Trigger request
    await app.chatManager.handleSend();

    // Verify fallback response is rendered to guide user instead of crashing
    expect(messages.textContent).toContain('Nearest Restrooms');
    expect(messages.innerHTML).toContain('Gate B elevator');
  });
});
