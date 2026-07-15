/* ============================================================
   StadiumAI Command — Main Application Controller
   Binds modules, router, simulator, maps, and models together
   ============================================================ */

import { DataSimulator } from './data-simulator.js';
import { GeminiService } from './gemini.js';
import { I18nManager } from './i18n.js';
import { ChatManager } from './chat.js';
import { StadiumMap } from './stadium-map.js';
import { WayfindingManager } from './navigation.js';
import { TransportManager } from './transport.js';
import { CrowdAnalytics } from './crowd-analytics.js';
import { SustainabilityAnalytics } from './sustainability.js';
import { AlertSystem } from './alerts.js';

class AppController {
  constructor() {
    this.currentMode = 'fan'; // 'fan' or 'ops'
    this.currentPage = 'chat'; // active sub-page ID
    
    // Services
    this.simulator = new DataSimulator();
    this.gemini = new GeminiService();
    this.i18n = new I18nManager();
    
    // Page/UI instances
    this.chatManager = null;
    this.stadiumHeatmap = null;
    this.navigationMap = null;
    this.wayfinding = null;
    this.transportManager = null;
    this.crowdCharts = null;
    this.sustainabilityCharts = null;
    this.alerts = null;

    // Settings
    this.settings = {
      apiKey: localStorage.getItem("stadiumai_apikey") || "",
      refreshRate: parseInt(localStorage.getItem("stadiumai_refresh")) || 2000,
    };

    // Tracking active hover state for real-time count updates
    this.activeHoverZoneId = null;
    this.activeHoverZoneConfig = null;

    if (this.settings.apiKey) {
      this.gemini.setApiKey(this.settings.apiKey);
      const apiKeyInput = document.getElementById('apiKeyInput');
      if (apiKeyInput) apiKeyInput.value = this.settings.apiKey;
    }

    this.init();
  }

  init() {
    // 1. Initialize UI elements & routing
    this.setupRouter();
    this.setupHeaderClock();
    this.setupSettingsModal();
    this.setupLanguageSelector();
    this.setupMobileMenu();
    this.i18n.translateDOM();

    // 2. Instantiate Managers
    this.chatManager = new ChatManager(this.gemini);
    
    this.stadiumHeatmap = new StadiumMap('stadiumHeatmap', {
      onZoneClick: (id, config) => this.showZoneDetails(id, config),
      onZoneHover: (id, config, e) => this.hoverZone(id, config, e)
    });

    this.navigationMap = new StadiumMap('navigationMap');
    this.wayfinding = new WayfindingManager(this.navigationMap);
    this.transportManager = new TransportManager();
    
    this.crowdCharts = new CrowdAnalytics();
    this.sustainabilityCharts = new SustainabilityAnalytics();
    this.alerts = new AlertSystem('alertFeed', 'fullAlertFeed');

    // 3. Connect Data Stream
    this.simulator.on('snapshot', (data) => this.handleDataSnapshot(data));
    this.simulator.on('alerts', (alertList) => this.alerts.setAlerts(alertList));
    this.simulator.start();

    // 4. Trigger Lucide Icons
    lucide.createIcons();

    // Update active page titles to fit defaults
    this.updateTitles();
    this.switchPage(this.currentPage);
    // Theme toggle with persistence
    const themeToggleBtn = document.getElementById("themeToggle");
    // Restore saved theme
    const savedTheme = localStorage.getItem('stadiumai_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    }
    if (themeToggleBtn) {
      // Set initial icon
      const initIcon = themeToggleBtn.querySelector("i");
      if (document.documentElement.classList.contains("light-theme")) {
        initIcon.dataset.lucide = "moon";
      } else {
        initIcon.dataset.lucide = "sun";
      }
      const toggleTheme = () => {
        document.documentElement.classList.toggle("light-theme");
        const isLight = document.documentElement.classList.contains("light-theme");
        localStorage.setItem('stadiumai_theme', isLight ? 'light' : 'dark');
        // Update the icon based on current theme
        const icon = themeToggleBtn.querySelector("i");
        icon.dataset.lucide = isLight ? "moon" : "sun";
        // Update the icon
        lucide.createIcons();
      };
      themeToggleBtn.addEventListener("click", toggleTheme);
    }
  }

  setupRouter() {
    // Mode Switcher (Fan vs Ops)
    const fanBtn = document.getElementById('fanModeBtn');
    const opsBtn = document.getElementById('opsModeBtn');
    const switcher = document.getElementById('modeSwitcher');
    const fanNav = document.getElementById('fanNav');
    const opsNav = document.getElementById('opsNav');

    fanBtn?.addEventListener('click', () => {
      this.currentMode = 'fan';
      switcher.classList.remove('ops-active');
      fanBtn.classList.add('active');
      opsBtn.classList.remove('active');
      
      fanNav.style.display = 'block';
      opsNav.style.display = 'none';

      // Navigate to default fan page
      this.switchPage('chat');
    });

    opsBtn?.addEventListener('click', () => {
      this.currentMode = 'ops';
      switcher.classList.add('ops-active');
      opsBtn.classList.add('active');
      fanBtn.classList.remove('active');

      fanNav.style.display = 'none';
      opsNav.style.display = 'block';

      // Navigate to default ops page
      this.switchPage('overview');
    });

    // Nav Item Clicks
    const attachNavEvents = (navId) => {
      const container = document.getElementById(navId);
      container?.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (item) {
          const pageId = item.getAttribute('data-page');
          this.switchPage(pageId);
        }
      });
    };

    attachNavEvents('fanNav');
    attachNavEvents('opsNav');
  }

  switchPage(pageId) {
    this.currentPage = pageId;

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Highlight active nav item
    const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Hide all pages
    document.querySelectorAll('.content-area .page').forEach(page => {
      page.classList.remove('active');
    });

    // Show selected page
    const pageEl = document.getElementById(`page${pageId.charAt(0).toUpperCase() + pageId.slice(1)}Page`);
    if (pageEl) {
      pageEl.classList.add('active');
      pageEl.classList.add('page-enter');
      // Remove animation class after run to allow repeats
      setTimeout(() => pageEl.classList.remove('page-enter'), 500);
    }

    // Refresh map layouts if displayed
    if (pageId === 'overview') {
      setTimeout(() => this.stadiumHeatmap.init(), 100);
    }
    if (pageId === 'navigate') {
      setTimeout(() => {
        this.navigationMap.init();
        if (this.wayfinding.currentDest) {
          this.wayfinding.navigateTo(this.wayfinding.currentDest);
        }
      }, 100);
    }

    this.updateTitles();
  }

  updateTitles() {
    const titleKey = `title_${this.currentPage}`;
    const subtitleKey = `subtitle_${this.currentPage}`;

    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');

    if (titleEl) titleEl.textContent = this.i18n.translate(titleKey);
    if (subtitleEl) subtitleEl.textContent = this.i18n.translate(subtitleKey);
  }

  handleDataSnapshot(data) {
    // 1. Update general tickers
    const clockVal = document.getElementById('tickerCapacity');
    if (clockVal) clockVal.textContent = `${data.match.attendance.toLocaleString()} / ${data.match.maxCapacity.toLocaleString()}`;
    
    const timeVal = document.getElementById('matchTime');
    if (timeVal) timeVal.textContent = `${data.match.minute}'`;

    const scoreVal = document.getElementById('matchScore');
    if (scoreVal) scoreVal.textContent = `${data.match.score[0]} — ${data.match.score[1]}`;

    const energyVal = document.getElementById('tickerEnergy');
    if (energyVal) energyVal.textContent = `${data.energy.total} MW`;

    const generalIncidents = document.getElementById('tickerIncidents');
    if (generalIncidents) generalIncidents.textContent = data.incidents;

    // 2. Update Heatmaps
    this.stadiumHeatmap.updateHeatmap(data.zones);
    this.navigationMap.updateHeatmap(data.zones);

    // 3. Update charts
    this.crowdCharts.updateCharts(data);
    this.sustainabilityCharts.updateCharts(data);

    // 4. Update transport panel
    this.transportManager.updateTransport(data);

    // 5. Update Gate List
    this.updateGateGrid(data.gates);

    // 6. Update wait times list
    this.updateWaitTimesList(data.waitTimes);

    // 7. Update Overview Stat cards
    const totalAttCard = document.getElementById('statAttendance');
    if (totalAttCard) totalAttCard.textContent = data.match.attendance.toLocaleString();

    const safetyCard = document.getElementById('statSafety');
    if (safetyCard) safetyCard.textContent = `${data.safetyScore}%`;

    const energyCard = document.getElementById('statEnergy');
    if (energyCard) energyCard.textContent = `${data.energy.total} MW`;

    const aiCard = document.getElementById('statAiActions');
    if (aiCard) aiCard.textContent = data.aiActions;

    // 8. Update Sustainability page stats
    const susEnergy = document.getElementById('susEnergy');
    if (susEnergy) susEnergy.textContent = `${data.energy.total} MW`;

    const susWater = document.getElementById('susWater');
    if (susWater) susWater.textContent = `${(data.water.total / 1000).toFixed(1)}K L`;

    const susCO2 = document.getElementById('susCO2');
    if (susCO2) susCO2.textContent = `${data.co2.total} t`;

    // 9. Auto-scroll transcription window if visible
    const transWindow = document.getElementById('paTranscription');
    if (transWindow) transWindow.scrollTop = transWindow.scrollHeight;

    // 10. Update AI Crowd Predictions
    this.updateCrowdPredictions(this.simulator.generateCrowdPredictions());

    // 11. If a zone is currently being hovered, update the popup values in real-time
    if (this.activeHoverZoneId && this.activeHoverZoneConfig) {
      const activeZone = data.zones.find(z => z.id === this.activeHoverZoneId);
      if (activeZone) {
        document.getElementById('popupOccupancy').textContent = `${activeZone.occupancy}%`;
        
        const popupPeople = document.getElementById('popupPeople');
        if (popupPeople) popupPeople.textContent = `${activeZone.people.toLocaleString()} fans`;

        document.getElementById('popupDensity').textContent = activeZone.density.toUpperCase();
        document.getElementById('popupTrend').textContent = activeZone.trend.toUpperCase();

        const waitTime = Math.max(0, Math.floor((activeZone.occupancy / 100) * 15));
        const incidents = activeZone.density === 'critical' ? 2 : activeZone.density === 'high' ? 1 : 0;

        const popupWait = document.getElementById('popupWait');
        if (popupWait) popupWait.textContent = `~${Math.round(waitTime)} min`;

        const popupInc = document.getElementById('popupIncidents');
        if (popupInc) popupInc.textContent = incidents > 0 ? `${incidents} Active` : `None`;
      }
    }
  }

  updateWaitTimesList(times) {
    const list = document.getElementById('waitTimesList');
    if (!list) return;

    list.innerHTML = times.map(t => {
      const waitColor = t.time <= 4 ? 'text-emerald' : t.time <= 9 ? 'text-gold' : 'text-coral';
      return `
        <div class="wait-item">
          <span class="wait-name">${t.name}</span>
          <span class="wait-time ${waitColor}">~${t.time} min</span>
        </div>
      `;
    }).join('');
  }

  updateGateGrid(gates) {
    const grid = document.getElementById('gateGrid');
    if (!grid) return;

    grid.innerHTML = gates.map(gate => {
      const barColor = gate.status === 'critical' ? 'var(--color-status-red)' :
                       gate.status === 'high' ? 'var(--color-status-orange)' : 'var(--color-accent-cyan)';
      return `
        <div class="gate-card">
          <div class="gate-name">${gate.name}</div>
          <div class="gate-flow">${gate.currentFlow}</div>
          <div class="gate-label">people/min</div>
          <div class="gate-bar">
            <div class="gate-bar-fill" style="width: ${gate.utilization}%; background-color: ${barColor};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCrowdPredictions(predictions) {
    const container = document.getElementById('crowdPredictions');
    if (!container) return;

    container.innerHTML = predictions.map(p => {
      const severityClass = p.type === 'warning' ? 'warning' : p.type === 'success' ? 'success' : 'info';
      return `
        <div class="alert-card ${severityClass}">
          <div class="alert-icon">${p.icon}</div>
          <div class="alert-content">
            <div class="alert-title">${p.title}</div>
            <div class="alert-message">${p.message}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  setupHeaderClock() {
    const clock = document.getElementById('headerClock');
    const tick = () => {
      const now = new Date();
      if (clock) {
        clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      }
    };
    tick();
    setInterval(tick, 1000);
  }

  setupSettingsModal() {
    const btn = document.getElementById('settingsBtn');
    const modal = document.getElementById('settingsModal');
    const close = document.getElementById('closeSettings');
    const save = document.getElementById('saveSettingsBtn');
    const rate = document.getElementById('refreshRate');
    const key = document.getElementById('apiKeyInput');

    btn?.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    close?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Close on click outside
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    save?.addEventListener('click', () => {
      if (key.value) {
        this.gemini.setApiKey(key.value);
      }
      this.simulator.setRefreshRate(parseInt(rate.value));
      modal.style.display = 'none';
      this.alerts.showToast('💾 Settings Saved', 'StadiumAI settings updated successfully.', 'success');
    });
  }

  setupLanguageSelector() {
    const sel = document.getElementById('langSelector');
    sel?.addEventListener('change', (e) => {
      const lang = e.target.value;
      this.i18n.setLanguage(lang);
      this.chatManager.setLanguage(lang);
      this.chatManager.addWelcomeMessage();
      this.updateTitles();
    this.switchPage(this.currentPage);
      this.i18n.translateDOM();
    });
  }

  setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    toggle?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close on navigation in mobile
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        sidebar.classList.remove('open');
      });
    });
  }

  showZoneDetails(id, config) {
    const zone = this.simulator.generateSnapshot().zones.find(z => z.id === id);
    if (!zone) return;

    this.alerts.showToast(
      `🏟️ Zone Details: ${config.name}`,
      `Occupancy: ${zone.occupancy}% (${zone.people.toLocaleString()} fans) | Status: ${zone.density.toUpperCase()}`,
      zone.density === 'critical' ? 'critical' : zone.density === 'high' ? 'warning' : 'success'
    );
  }

  hoverZone(id, config, e) {
    const popup = document.getElementById('zonePopup');
    if (!popup) return;

    if (!id || !config) {
      this.activeHoverZoneId = null;
      this.activeHoverZoneConfig = null;
      popup.classList.remove('visible');
      return;
    }

    this.activeHoverZoneId = id;
    this.activeHoverZoneConfig = config;

    const zone = this.simulator.generateSnapshot().zones.find(z => z.id === id);
    if (!zone) return;

    document.getElementById('popupZoneName').textContent = config.name;
    document.getElementById('popupOccupancy').textContent = `${zone.occupancy}%`;
    
    const popupPeople = document.getElementById('popupPeople');
    if (popupPeople) popupPeople.textContent = `${zone.people.toLocaleString()} fans`;

    document.getElementById('popupDensity').textContent = zone.density.toUpperCase();
    document.getElementById('popupTrend').textContent = zone.trend.toUpperCase();
    
    // Add extra details
    const waitTime = Math.max(0, Math.floor((zone.occupancy / 100) * 15));
    const incidents = zone.density === 'critical' ? 2 : zone.density === 'high' ? 1 : 0;
    
    const popupWait = document.getElementById('popupWait');
    if (popupWait) popupWait.textContent = `~${Math.round(waitTime)} min`;
    
    const popupInc = document.getElementById('popupIncidents');
    if (popupInc) popupInc.textContent = incidents > 0 ? `${incidents} Active` : `None`;


    // Position popup in a fixed corner of the container so it doesn't block the map
    popup.style.top = '16px';
    popup.style.right = '16px';
    popup.style.left = 'auto'; // ensure left is cleared
    popup.style.bottom = 'auto';
    popup.classList.add('visible');
  }
}

// Instantiate
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
