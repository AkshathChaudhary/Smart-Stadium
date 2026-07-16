import { describe, test, expect, beforeEach } from 'vitest';
import { TransportManager } from '../js/transport.js';

describe('TransportManager Unit Tests', () => {
  let transportManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="parkingAvail"></div>
      <div id="nextTrain"></div>
      <div id="rideshareWait"></div>
      <div id="shuttleNext"></div>
      <div id="parkingLots"></div>
      <div id="transitTable"></div>
    `;
    transportManager = new TransportManager();
  });

  test('should update stats cards textContent', () => {
    const data = {
      transport: {
        parkingAvailable: 1500,
        nextTrain: 5,
        rideshareWait: 10,
        nextShuttle: 7
      }
    };

    transportManager.updateTransport(data);
    expect(document.getElementById('parkingAvail').textContent).toBe('1,500');
    expect(document.getElementById('nextTrain').textContent).toBe('5 min');
    expect(document.getElementById('rideshareWait').textContent).toBe('~10 min');
    expect(document.getElementById('shuttleNext').textContent).toBe('7 min');
  });

  test('should render parking lots and public transit rows', () => {
    const data = {
      transport: {
        parkingAvailable: 800,
        nextTrain: 5,
        rideshareWait: 10,
        nextShuttle: 7
      }
    };

    transportManager.updateTransport(data);
    
    // Parking lots divs
    const lots = document.getElementById('parkingLots');
    expect(lots.children.length).toBe(4);
    expect(lots.innerHTML).toContain('Lot A (VIP)');

    // Transit table rows
    const transit = document.getElementById('transitTable');
    expect(transit.children.length).toBe(4);
    expect(transit.innerHTML).toContain('Meadowlands Line');
  });

  test('should do nothing if data is empty or invalid', () => {
    transportManager.updateTransport(null);
    expect(document.getElementById('parkingAvail').textContent).toBe('');
    
    transportManager.updateTransport({});
    expect(document.getElementById('parkingAvail').textContent).toBe('');
  });
});
