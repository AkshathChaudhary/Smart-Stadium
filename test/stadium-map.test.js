import { describe, test, expect, beforeEach, vi } from 'vitest';
import { StadiumMap } from '../js/stadium-map.js';

describe('StadiumMap Unit Tests', () => {
  let stadiumMap;

  beforeEach(() => {
    document.body.innerHTML = `
      <svg id="stadiumMap"></svg>
    `;
    stadiumMap = new StadiumMap('stadiumMap');
  });

  test('should draw base paths and text markers on init', () => {
    expect(stadiumMap.svg.children.length).toBeGreaterThan(1);
    
    // Check outerTrack rectangle is drawn
    const rect = stadiumMap.svg.querySelector('rect');
    expect(rect).toBeDefined();
    
    // Check nodes configuration
    expect(stadiumMap.nodes.gateA).toBeDefined();
    expect(stadiumMap.nodes.elevatorSec102).toBeDefined();
  });

  test('should update heatmap occupancy, colors, and counts', () => {
    const zonesData = [
      { id: 'zone-a', occupancy: 95, density: 'critical', people: 12000 },
      { id: 'zone-b', occupancy: 20, density: 'low', people: 2000 }
    ];

    stadiumMap.updateHeatmap(zonesData);
    
    const zoneAPath = stadiumMap.svg.querySelector('#zone-a');
    expect(zoneAPath.getAttribute('class')).toContain('density-critical');
    expect(zoneAPath.getAttribute('class')).toContain('heatmap-pulse');

    const labelA = stadiumMap.svg.querySelector('#label-zone-a');
    expect(labelA.innerHTML).toContain('12,000');
  });

  test('should draw standard route path and marker points', () => {
    stadiumMap.drawRoute('gateA', 'gateD', false);
    
    const paths = stadiumMap.svg.querySelectorAll('.wayfinding-path');
    expect(paths.length).toBe(2); // glow path + solid path

    const nodes = stadiumMap.svg.querySelectorAll('.wayfinding-node');
    expect(nodes.length).toBe(3); // start circle + destination circle + destination pulse ring
  });

  test('should draw accessible route path routing through elevator', () => {
    stadiumMap.drawRoute('gateA', 'gateD', true);
    
    const paths = stadiumMap.svg.querySelectorAll('.wayfinding-path');
    expect(paths.length).toBe(2);
    
    // Check clearPaths works
    stadiumMap.clearPaths();
    expect(stadiumMap.svg.querySelectorAll('.wayfinding-path').length).toBe(0);
  });
});
