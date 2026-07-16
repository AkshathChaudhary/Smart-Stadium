import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AlertSystem } from '../js/alerts.js';

describe('AlertSystem Unit Tests', () => {
  let alertSystem;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="alertFeed"></div>
      <div id="fullAlertFeed"></div>
      <div id="alertBadge"></div>
      <button id="filterAllAlerts"></button>
      <button id="filterCritical"></button>
      <button id="filterWarning"></button>
      <button id="filterInfo"></button>
      <button id="clearAlertsBtn"></button>
      <div id="toastContainer"></div>
    `;

    alertSystem = new AlertSystem('alertFeed', 'fullAlertFeed');
  });

  test('should display toast alerts and trigger close transitions', () => {
    vi.useFakeTimers();
    alertSystem.showToast('🚨 Fire Warning', 'Please exit', 'critical');
    
    const container = document.getElementById('toastContainer');
    expect(container.children.length).toBe(1);
    expect(container.textContent).toContain('Fire Warning');

    const closeBtn = container.querySelector('.toast-close');
    closeBtn.click();
    
    // Test toast exit classes are applied
    const toast = container.querySelector('.toast');
    expect(toast.classList.contains('toast-exit')).toBe(true);
    
    // Advance timer for auto-delete
    vi.advanceTimersByTime(4000);
    vi.useRealTimers();
  });

  test('should filter feed by severity level', () => {
    const alerts = [
      { id: 1, severity: 'critical', icon: '🔴', title: 'Crit', message: 'M', time: '1m ago' },
      { id: 2, severity: 'warning', icon: '🟠', title: 'Warn', message: 'M', time: '2m ago' },
      { id: 3, severity: 'info', icon: '🔵', title: 'Inf', message: 'M', time: '3m ago' },
    ];

    alertSystem.setAlerts(alerts);
    expect(alertSystem.alerts.length).toBe(3);

    // Default 'all' filter shows all full alerts
    const fullFeed = document.getElementById('fullAlertFeed');
    expect(fullFeed.children.length).toBe(3);

    // Apply critical filter
    alertSystem.filterAlerts('critical');
    expect(fullFeed.children.length).toBe(1);

    // Filter warning
    alertSystem.filterAlerts('warning');
    expect(fullFeed.children.length).toBe(1);

    // Filter info
    alertSystem.filterAlerts('info');
    expect(fullFeed.children.length).toBe(1);
  });

  test('should manage alert badge dynamically (CRUD - Read/Update)', () => {
    const alerts = [
      { id: 1, severity: 'critical', icon: '🔴', title: 'Crit', message: 'M', time: '1m ago' },
      { id: 2, severity: 'warning', icon: '🟠', title: 'Warn', message: 'M', time: '2m ago' },
    ];
    
    alertSystem.setAlerts(alerts);
    const badge = document.getElementById('alertBadge');
    expect(badge.textContent).toBe('2');
    expect(badge.style.display).toBe('inline-block');

    // Set to empty alerts (CRUD - Delete/Clear)
    alertSystem.setAlerts([]);
    expect(badge.textContent).toBe('0');
    expect(badge.style.display).toBe('none');
  });

  test('should clear all alerts on Clear All click', () => {
    alertSystem.setAlerts([
      { id: 1, severity: 'critical', icon: '🔴', title: 'Crit', message: 'M', time: '1' }
    ]);
    
    document.getElementById('clearAlertsBtn').click();
    expect(alertSystem.alerts.length).toBe(0);
  });
});
