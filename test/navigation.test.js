import { describe, test, expect, beforeEach, vi } from 'vitest';
import { WayfindingManager } from '../js/navigation.js';

describe('WayfindingManager Unit Tests', () => {
  let wayfinding;
  let mockMap;

  beforeEach(() => {
    document.body.innerHTML = `
      <label class="toggle-switch">
        <input type="checkbox" id="accessibleRouteToggle" />
      </label>
      <div id="quickNavList">
        <button class="quick-btn">🚻 Nearest Restroom → 45m (Gate B)</button>
        <button class="quick-btn">🍔 Nearest Food → 60m (Concourse C)</button>
      </div>
      <div id="toastContainer"></div>
    `;

    mockMap = {
      drawRoute: vi.fn(),
    };

    wayfinding = new WayfindingManager(mockMap);
  });

  test('should initialize values', () => {
    expect(wayfinding.currentNode).toBe('gateA');
    expect(wayfinding.accessibleMode).toBe(false);
  });

  test('should update accessibility toggle and redraw route', () => {
    const toggle = document.getElementById('accessibleRouteToggle');
    wayfinding.currentDest = 'restroomSec100';

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(wayfinding.accessibleMode).toBe(true);
    expect(mockMap.drawRoute).toHaveBeenCalledWith('gateA', 'restroomSec100', true);
  });

  test('should draw path and show toast on navigateTo', () => {
    wayfinding.navigateTo('foodConcourseC');
    
    expect(wayfinding.currentDest).toBe('foodConcourseC');
    expect(mockMap.drawRoute).toHaveBeenCalledWith('gateA', 'foodConcourseC', false);

    const toast = document.querySelector('#toastContainer .toast');
    expect(toast).toBeDefined();
    expect(toast.textContent).toContain('Route Plotted');
  });

  test('should trigger route navigation on quick actions clicks', () => {
    const button = document.querySelector('#quickNavList button'); // restroom
    button.click();

    expect(wayfinding.currentDest).toBe('restroomSec100');
    expect(button.classList.contains('active')).toBe(true);
  });
});
