import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { DataSimulator } from '../js/data-simulator.js';

describe('DataSimulator Unit Tests', () => {
  let simulator;

  beforeEach(() => {
    vi.useFakeTimers();
    simulator = new DataSimulator();
  });

  afterEach(() => {
    simulator.stop();
    vi.useRealTimers();
  });

  test('should generate valid snapshots and alert structures', () => {
    const snapshot = simulator.generateSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.zones.length).toBe(12);
    expect(snapshot.gates.length).toBe(8);
    expect(snapshot.energy.total).toBeGreaterThan(0);
    expect(snapshot.water.total).toBeGreaterThan(0);
    
    const alerts = simulator.generateAlerts();
    expect(alerts.length).toBe(8);
    expect(alerts[0].severity).toBe('critical');

    const preds = simulator.generateCrowdPredictions();
    expect(preds.length).toBe(3);
  });

  test('should trigger listener callbacks on simulator start', () => {
    const snapshotCallback = vi.fn();
    const alertsCallback = vi.fn();

    simulator.on('snapshot', snapshotCallback);
    simulator.on('alerts', alertsCallback);

    simulator.start(5000);
    
    // Initial emit on start()
    expect(snapshotCallback).toHaveBeenCalledTimes(1);
    expect(alertsCallback).toHaveBeenCalledTimes(1);

    // Fast-forward interval
    vi.advanceTimersByTime(5000);
    expect(snapshotCallback).toHaveBeenCalledTimes(2);
  });

  test('should change timing configurations', () => {
    const snapshotCallback = vi.fn();
    simulator.on('snapshot', snapshotCallback);
    
    simulator.start(2000);
    expect(snapshotCallback).toHaveBeenCalledTimes(1); // initial emit

    simulator.setRefreshRate(10000);
    // setRefreshRate calls stop() then start() which emits immediately again
    expect(snapshotCallback).toHaveBeenCalledTimes(2); // restart emit

    vi.advanceTimersByTime(2000);
    expect(snapshotCallback).toHaveBeenCalledTimes(2); // not run yet under 10s rate

    vi.advanceTimersByTime(8000); // reaches 10s
    expect(snapshotCallback).toHaveBeenCalledTimes(3);
  });

  test('should fluctuate base values inside constraints', () => {
    const value = simulator._fluctuate(50, 10);
    expect(value).toBeGreaterThanOrEqual(40);
    expect(value).toBeLessThanOrEqual(60);
    
    // Bounds limit tests
    const valueMax = simulator._fluctuate(100, 50);
    expect(valueMax).toBeLessThanOrEqual(100);
    const valueMin = simulator._fluctuate(0, 50);
    expect(valueMin).toBeGreaterThanOrEqual(0);
  });
});
