/* ============================================================
   StadiumAI Command — Alert System
   Renders, updates, and manages AI-generated operational alerts
   ============================================================ */

import { escapeHTML } from './security.js';

export class AlertSystem {
  constructor(alertFeedId, fullFeedId) {
    this.alertFeed = document.getElementById(alertFeedId);
    this.fullFeed = document.getElementById(fullFeedId);
    this.alerts = [];
    this.currentFilter = 'all';

    this.init();
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    // Alert filter buttons
    document.getElementById('filterAllAlerts')?.addEventListener('click', () => this.filterAlerts('all'));
    document.getElementById('filterCritical')?.addEventListener('click', () => this.filterAlerts('critical'));
    document.getElementById('filterWarning')?.addEventListener('click', () => this.filterAlerts('warning'));
    document.getElementById('filterInfo')?.addEventListener('click', () => this.filterAlerts('info'));

    document.getElementById('clearAlertsBtn')?.addEventListener('click', () => {
      this.alerts = [];
      this.render();
      this.showToast('🧹 Clean State', 'All active alerts cleared from dashboard.', 'success');
    });
  }

  showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-slide-in`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'critical') icon = '🚨';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${escapeHTML(title)}</div>
        <div class="toast-message">${escapeHTML(message)}</div>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">✕</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => toast.remove());
    });

    container.appendChild(toast);

    // Auto-remove after 4s
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
      }
    }, 4000);
  }

  setAlerts(alertsList) {
    // Keep alerts updated or append if new. For simplicity, set
    this.alerts = alertsList;
    this.render();
  }

  filterAlerts(severity) {
    this.currentFilter = severity;
    
    // Update filter button styling
    const btns = ['filterAllAlerts', 'filterCritical', 'filterWarning', 'filterInfo'];
    btns.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.className = 'btn btn-secondary';
      }
    });

    const activeBtnId = severity === 'all' ? 'filterAllAlerts' : 
                      severity === 'critical' ? 'filterCritical' :
                      severity === 'warning' ? 'filterWarning' : 'filterInfo';
    
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.className = severity === 'critical' ? 'btn btn-danger' : 'btn btn-primary';
    }

    this.render();
  }

  render() {
    const filtered = this.alerts.filter(a => this.currentFilter === 'all' || a.severity === this.currentFilter);

    // 1. Render to short alert feed (dashboard overview)
    if (this.alertFeed) {
      this.alertFeed.innerHTML = '';
      if (this.alerts.length === 0) {
        this.alertFeed.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🛡️</div>
            <div class="empty-title">All Systems Normal</div>
            <div class="empty-desc">No active anomalies detected by AI.</div>
          </div>
        `;
      } else {
        // Take top 4 for dashboard
        this.alerts.slice(0, 4).forEach(alert => {
          this.alertFeed.appendChild(this.createAlertCard(alert));
        });
      }
    }

    // 2. Render to full alert feed (alert center page)
    if (this.fullFeed) {
      this.fullFeed.innerHTML = '';
      if (filtered.length === 0) {
        this.fullFeed.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <div class="empty-title">No matching alerts</div>
            <div class="empty-desc">No alerts match the selected severity category.</div>
          </div>
        `;
      } else {
        filtered.forEach(alert => {
          this.fullFeed.appendChild(this.createAlertCard(alert));
        });
      }
    }

    // 3. Update alert count badge in navigation
    const countBadge = document.getElementById('alertBadge');
    if (countBadge) {
      const activeCount = this.alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;
      countBadge.textContent = activeCount;
      countBadge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
  }

  createAlertCard(alert) {
    const card = document.createElement('div');
    card.className = `alert-card ${alert.severity} alert-slide-in`;

    card.innerHTML = `
      <div class="alert-icon">${alert.icon}</div>
      <div class="alert-content">
        <div class="alert-title">${escapeHTML(alert.title)}</div>
        <div class="alert-message">${escapeHTML(alert.message)}</div>
        <div class="alert-time">${escapeHTML(alert.time)}</div>
      </div>
    `;
    return card;
  }
}
