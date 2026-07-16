import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CrowdAnalytics } from '../js/crowd-analytics.js';

describe('CrowdAnalytics Unit Tests', () => {
  let crowdAnalytics;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="densityChart"></canvas>
      <canvas id="gateFlowChart"></canvas>
    `;
    crowdAnalytics = new CrowdAnalytics();
  });

  test('should initialize line and bar charts correctly', () => {
    expect(crowdAnalytics.densityChart).toBeDefined();
    expect(crowdAnalytics.gateFlowChart).toBeDefined();
    expect(crowdAnalytics.densityChart.config.type).toBe('line');
    expect(crowdAnalytics.gateFlowChart.config.type).toBe('bar');
  });

  test('should update density data and labels', () => {
    const data = {
      densityHistory: [
        { time: '12:00', value: 45 },
        { time: '12:05', value: 50 }
      ],
      gates: [
        { currentFlow: 100, maxCapacity: 200 },
        { currentFlow: 120, maxCapacity: 200 }
      ]
    };

    crowdAnalytics.updateCharts(data);
    
    // Density updates
    expect(crowdAnalytics.densityChart.data.labels).toEqual(['12:00', '12:05']);
    expect(crowdAnalytics.densityChart.data.datasets[0].data).toEqual([45, 50]);

    // Gate flow updates
    expect(crowdAnalytics.gateFlowChart.data.datasets[0].data).toEqual([100, 120]);
    expect(crowdAnalytics.gateFlowChart.data.datasets[1].data).toEqual([200, 200]);
  });
});
