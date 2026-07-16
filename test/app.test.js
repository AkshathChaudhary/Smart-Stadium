import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadHTMLTemplate } from './test-utils.js';

describe('AppController Unit Tests', () => {
  let appController;

  beforeEach(async () => {
    loadHTMLTemplate();
    
    // Set mock local storages
    localStorage.setItem('stadiumai_apikey', 'AIzaSyTestApiKey');
    localStorage.setItem('stadiumai_refresh', '5000');
    localStorage.setItem('stadiumai_theme', 'light');

    // Dynamically import app.js to instantiate the app
    const appModule = await import('../js/app.js?t=' + Date.now());
    // The main app is instantiated inside DOMContentLoaded listener, let's manually fetch or trigger it
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('should load persisted local storage parameters on init', () => {
    const app = window.app;
    expect(app).toBeDefined();
    expect(app.settings.apiKey).toBe('AIzaSyTestApiKey');
    expect(app.settings.refreshRate).toBe(5000);
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);
  });

  test('should setup clock ticking', () => {
    vi.useFakeTimers();
    const clock = document.getElementById('headerClock');
    expect(clock.textContent).not.toBe('--:--:--');
    vi.useRealTimers();
  });

  test('should open, close, and save settings from Settings Modal', () => {
    const app = window.app;
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');
    const saveBtn = document.getElementById('saveSettingsBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const refreshRateSelect = document.getElementById('refreshRate');

    // Open settings modal
    settingsBtn.click();
    expect(settingsModal.style.display).toBe('flex');

    // Update settings form input values
    apiKeyInput.value = 'AIzaSyNewTestApiKey';
    refreshRateSelect.value = '10000';

    // Save Settings
    saveBtn.click();
    expect(settingsModal.style.display).toBe('none');
    expect(app.gemini.apiKey).toBe('AIzaSyNewTestApiKey');
    expect(app.simulator.refreshRate).toBe(10000);

    // Close settings modal
    settingsBtn.click();
    closeBtn.click();
    expect(settingsModal.style.display).toBe('none');
  });

  test('should toggle dark and light modes', () => {
    const app = window.app;
    const themeBtn = document.getElementById('themeToggle');
    
    // It's currently light theme, toggle it
    themeBtn.click();
    expect(document.documentElement.classList.contains('light-theme')).toBe(false);
    expect(localStorage.getItem('stadiumai_theme')).toBe('dark');

    // Toggle back
    themeBtn.click();
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);
    expect(localStorage.getItem('stadiumai_theme')).toBe('light');
  });

  test('should manage custom dropdowns states', () => {
    const langDropdown = document.getElementById('langDropdown');
    const trigger = langDropdown.querySelector('.dropdown-trigger');
    const itemEs = langDropdown.querySelector('.dropdown-item[data-value="es"]');

    // Toggle dropdown open
    trigger.click();
    expect(langDropdown.classList.contains('open')).toBe(true);

    // Click item language ES
    itemEs.click();
    expect(langDropdown.classList.contains('open')).toBe(false);
    expect(window.app.i18n.currentLanguage).toBe('es');
  });

  test('should manage sidebar mobile navigations toggles', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    menuToggle.click();
    expect(sidebar.classList.contains('open')).toBe(true);

    // Navigate item click should close mobile sidebar
    const navItem = document.querySelector('.nav-item');
    navItem.click();
    expect(sidebar.classList.contains('open')).toBe(false);
  });

  test('should manage venue dropdown states and updates', () => {
    const app = window.app;
    const venueDropdown = document.getElementById('venueDropdown');
    const trigger = venueDropdown.querySelector('.dropdown-trigger');
    const item = venueDropdown.querySelector('.dropdown-item');

    // Toggle dropdown open
    trigger.click();
    expect(venueDropdown.classList.contains('open')).toBe(true);

    // Click item
    const originalText = item.textContent;
    item.click();
    expect(venueDropdown.classList.contains('open')).toBe(false);
    expect(trigger.querySelector('span').textContent).toBe(originalText);
  });

  test('should close dropdowns on document click outside', () => {
    const langDropdown = document.getElementById('langDropdown');
    const venueDropdown = document.getElementById('venueDropdown');

    langDropdown.classList.add('open');
    venueDropdown.classList.add('open');

    document.dispatchEvent(new Event('click'));

    expect(langDropdown.classList.contains('open')).toBe(false);
    expect(venueDropdown.classList.contains('open')).toBe(false);
  });

  test('should show zone details toast', () => {
    const app = window.app;
    const toastSpy = vi.spyOn(app.alerts, 'showToast');

    app.showZoneDetails('zone-a', { name: 'Gate A — Main Entrance' });

    expect(toastSpy).toHaveBeenCalled();
    expect(toastSpy.mock.calls[0][0]).toContain('Zone Details: Gate A — Main Entrance');
  });

  test('should handle zone hover displaying popups', () => {
    const app = window.app;
    const popup = document.getElementById('zonePopup');
    
    // Hover with valid zone
    app.hoverZone('zone-a', { name: 'Gate A — Main Entrance' });
    expect(popup.classList.contains('visible')).toBe(true);
    expect(document.getElementById('popupZoneName').textContent).toBe('Gate A — Main Entrance');
    
    // Trigger real-time dashboard update while hovered
    app.handleDataSnapshot(app.simulator.generateSnapshot());
    expect(document.getElementById('popupOccupancy').textContent).toContain('%');

    // Hover out
    app.hoverZone(null, null);
    expect(popup.classList.contains('visible')).toBe(false);
  });

  test('should initialize navigation map when navigating to navigate page', () => {
    vi.useFakeTimers();
    const app = window.app;
    const initSpy = vi.spyOn(app.navigationMap, 'init');
    
    app.switchPage('navigate');
    vi.advanceTimersByTime(100);
    
    expect(initSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
