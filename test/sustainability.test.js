import { describe, test, expect, beforeEach } from 'vitest';
import { SustainabilityAnalytics } from '../js/sustainability.js';

describe('SustainabilityAnalytics Unit Tests', () => {
  let sustainability;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="energyChart"></canvas>
      <canvas id="waterChart"></canvas>
    `;
    sustainability = new SustainabilityAnalytics();
  });

  test('should initialize line and bar charts correctly', () => {
    expect(sustainability.energyChart).toBeDefined();
    expect(sustainability.waterChart).toBeDefined();
    expect(sustainability.energyChart.config.type).toBe('line');
    expect(sustainability.waterChart.config.type).toBe('bar');
  });

  test('should update energy and water draw histories', () => {
    const data = {
      energy: {
        history: [
          { hour: '10:00', value: 3.2 },
          { hour: '11:00', value: 3.5 }
        ]
      },
      water: {
        history: [
          { hour: '10:00', value: 1200 },
          { hour: '11:00', value: 1500 }
        ]
      }
    };

    sustainability.updateCharts(data);

    // Energy updates
    expect(sustainability.energyChart.data.labels).toEqual(['10:00', '11:00']);
    expect(sustainability.energyChart.data.datasets[0].data).toEqual([3.2, 3.5]);

    // Water updates
    expect(sustainability.waterChart.data.labels).toEqual(['10:00', '11:00']);
    expect(sustainability.waterChart.data.datasets[0].data).toEqual([1200, 1500]);
  });
});
