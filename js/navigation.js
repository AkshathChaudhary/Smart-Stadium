/* ============================================================
   StadiumAI Command — Wayfinding & Navigation Manager
   Links UI commands to path drawing on the stadium map
   ============================================================ */

export class WayfindingManager {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.accessibleMode = false;
    this.currentNode = 'gateA'; // default start position (user at Gate A)

    this.init();
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    const toggle = document.getElementById('accessibleRouteToggle');
    toggle?.addEventListener('change', (e) => {
      this.accessibleMode = e.target.checked;
      // Redraw current route if active
      if (this.currentDest) {
        this.navigateTo(this.currentDest);
      }
    });

    // Setup quick navigate buttons
    const navButtons = document.querySelectorAll('#quickNavList button');
    const destMapping = {
      'restroom': 'restroomSec100',
      'food': 'foodConcourseC',
      'first aid': 'firstAidLevel1',
      'elevator': 'elevatorSec102',
      'merch': 'merchStoreMain',
      'animal': 'serviceAnimalGateD'
    };

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.textContent.toLowerCase();
        let targetKey = null;

        for (const [key, val] of Object.entries(destMapping)) {
          if (text.includes(key)) {
            targetKey = val;
            break;
          }
        }

        if (targetKey) {
          this.navigateTo(targetKey);
          // Highlight selected chip
          navButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }

  navigateTo(destNodeKey) {
    this.currentDest = destNodeKey;
    this.map.drawRoute(this.currentNode, destNodeKey, this.accessibleMode);

    // Show path confirmation toast
    const container = document.getElementById('toastContainer');
    if (container) {
      const toast = document.createElement('div');
      toast.className = 'toast toast-slide-in';
      toast.innerHTML = `
        <div class="toast-icon">🧭</div>
        <div class="toast-content">
          <div class="toast-title">Route Plotted</div>
          <div class="toast-message">Path shown to destination (${this.accessibleMode ? 'Accessible Route' : 'Fastest Route'}).</div>
        </div>
        <button class="toast-close">✕</button>
      `;
      toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }
}
