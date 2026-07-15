/* ============================================================
   StadiumAI Command — Data Simulator
   Generates realistic real-time stadium operations data
   ============================================================ */

export class DataSimulator {
  constructor() {
    this.listeners = new Map();
    this.intervalId = null;
    this.refreshRate = 5000;

    // Stadium zones configuration
    this.zones = [
      { id: 'zone-a', name: 'Gate A — Main Entrance', baseOccupancy: 85, type: 'gate' },
      { id: 'zone-b', name: 'Gate B — North', baseOccupancy: 65, type: 'gate' },
      { id: 'zone-c', name: 'Gate C — East', baseOccupancy: 72, type: 'gate' },
      { id: 'zone-d', name: 'Gate D — South', baseOccupancy: 55, type: 'gate' },
      { id: 'zone-e', name: 'Gate E — West', baseOccupancy: 60, type: 'gate' },
      { id: 'zone-f', name: 'Upper Concourse', baseOccupancy: 30, type: 'concourse' },
      { id: 'zone-g', name: 'Lower Concourse', baseOccupancy: 78, type: 'concourse' },
      { id: 'zone-h', name: 'VIP Section', baseOccupancy: 90, type: 'vip' },
      { id: 'zone-i', name: 'Food Court — Main', baseOccupancy: 70, type: 'concession' },
      { id: 'zone-j', name: 'Field Level', baseOccupancy: 95, type: 'seating' },
      { id: 'zone-k', name: 'Mid Bowl (100-200)', baseOccupancy: 88, type: 'seating' },
      { id: 'zone-l', name: 'Upper Bowl (300+)', baseOccupancy: 45, type: 'seating' },
    ];

    // Gates configuration
    this.gates = [
      { id: 'gate-a', name: 'Gate A', baseFlow: 180 },
      { id: 'gate-b', name: 'Gate B', baseFlow: 145 },
      { id: 'gate-c', name: 'Gate C', baseFlow: 160 },
      { id: 'gate-d', name: 'Gate D', baseFlow: 120 },
      { id: 'gate-e', name: 'Gate E', baseFlow: 135 },
      { id: 'gate-f', name: 'Gate F', baseFlow: 110 },
      { id: 'gate-vip', name: 'VIP', baseFlow: 45 },
      { id: 'gate-media', name: 'Media', baseFlow: 30 },
    ];

    // Energy baselines
    this.energyBaseline = {
      lighting: 1.2,    // MW
      hvac: 1.8,        // MW
      displays: 0.6,    // MW
      operations: 0.4,  // MW
      misc: 0.2,        // MW
    };

    // Internal state
    this.state = {
      matchMinute: 67,
      matchScore: [2, 1],
      totalAttendance: 82500,
      maxCapacity: 82500,
      incidents: 0,
    };

    // Historical data for charts
    this.history = {
      density: [],
      energy: [],
      water: [],
      gateFlow: [],
    };

    this._initHistory();
  }

  _initHistory() {
    // Generate 24 hours of energy data
    for (let h = 0; h < 24; h++) {
      const isMatchHour = h >= 17 && h <= 21;
      const base = isMatchHour ? 4.0 + Math.random() * 0.5 : 1.2 + Math.random() * 0.3;
      this.history.energy.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        value: parseFloat(base.toFixed(2)),
      });
    }

    // Water consumption by hour
    for (let h = 0; h < 24; h++) {
      const isMatchHour = h >= 17 && h <= 21;
      const base = isMatchHour ? 2800 + Math.random() * 600 : 400 + Math.random() * 200;
      this.history.water.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        value: Math.round(base),
      });
    }

    // Density over time (last 2 hours, every 5 min)
    for (let i = 0; i < 24; i++) {
      const time = new Date();
      time.setMinutes(time.getMinutes() - (24 - i) * 5);
      const ramp = Math.min(1, i / 12); // gradual filling
      this.history.density.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.round(30 + ramp * 55 + Math.random() * 10),
      });
    }

    // Gate flow over last hour
    for (let i = 0; i < 12; i++) {
      const time = new Date();
      time.setMinutes(time.getMinutes() - (12 - i) * 5);
      this.history.gateFlow.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gateA: 140 + Math.round(Math.random() * 60),
        gateB: 110 + Math.round(Math.random() * 50),
        gateC: 130 + Math.round(Math.random() * 40),
        gateD: 90 + Math.round(Math.random() * 50),
      });
    }
  }

  // Generates a random fluctuation around a base value
  _fluctuate(base, range = 10) {
    return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range * 2));
  }

  // Generate current snapshot of all data
  generateSnapshot() {
    // Update match time
    this.state.matchMinute = Math.min(90, this.state.matchMinute + (Math.random() > 0.7 ? 1 : 0));

    // Zone data
    const zones = this.zones.map(zone => {
      const occupancy = this._fluctuate(zone.baseOccupancy, 5);
      let density = 'low';
      if (occupancy > 85) density = 'critical';
      else if (occupancy > 65) density = 'high';
      else if (occupancy > 40) density = 'moderate';

      return {
        ...zone,
        occupancy: Math.round(occupancy),
        density,
        trend: Math.random() > 0.5 ? 'rising' : 'falling',
        people: Math.round((occupancy / 100) * (this.state.maxCapacity / this.zones.length)),
      };
    });

    // Gate flow
    const gates = this.gates.map(gate => {
      const flow = Math.round(this._fluctuate(gate.baseFlow, 25));
      const capacity = gate.baseFlow * 1.5;
      return {
        ...gate,
        currentFlow: flow,
        maxCapacity: Math.round(capacity),
        utilization: Math.round((flow / capacity) * 100),
        status: flow / capacity > 0.85 ? 'critical' : flow / capacity > 0.65 ? 'high' : 'normal',
      };
    });

    // Energy data
    const currentHour = new Date().getHours();
    const energyTotal = Object.values(this.energyBaseline).reduce((a, b) => a + b, 0);
    const energyWithFluc = parseFloat((energyTotal + (Math.random() - 0.5) * 0.3).toFixed(2));

    const energy = {
      total: energyWithFluc,
      breakdown: {
        lighting: parseFloat((this.energyBaseline.lighting + (Math.random() - 0.5) * 0.1).toFixed(2)),
        hvac: parseFloat((this.energyBaseline.hvac + (Math.random() - 0.5) * 0.15).toFixed(2)),
        displays: parseFloat((this.energyBaseline.displays + (Math.random() - 0.5) * 0.05).toFixed(2)),
        operations: this.energyBaseline.operations,
        misc: this.energyBaseline.misc,
      },
      savings: 12 + Math.round(Math.random() * 5),
      history: this.history.energy,
    };

    // Water data
    const waterTotal = 18400 + Math.round(Math.random() * 1000);
    const water = {
      total: waterTotal,
      savings: 8 + Math.round(Math.random() * 3),
      history: this.history.water,
    };

    // CO2
    const co2 = {
      total: parseFloat((12.8 + (Math.random() - 0.5) * 0.5).toFixed(1)),
      offset: 15 + Math.round(Math.random() * 3),
    };

    // Wait times
    const waitTimes = [
      { name: '🚻 Restrooms (Sec 100)', time: 2 + Math.round(Math.random() * 4) },
      { name: '🍔 Concessions (Main)', time: 5 + Math.round(Math.random() * 8) },
      { name: '🍺 Bar (Level 2)', time: 8 + Math.round(Math.random() * 10) },
      { name: '🏪 Merch Store', time: 3 + Math.round(Math.random() * 6) },
    ];

    // Transport
    const transport = {
      parkingAvailable: Math.max(100, 2340 - Math.round(Math.random() * 200)),
      nextTrain: 3 + Math.round(Math.random() * 6),
      rideshareWait: 8 + Math.round(Math.random() * 10),
      nextShuttle: 5 + Math.round(Math.random() * 8),
    };

    // Safety score
    const safetyScore = parseFloat((96 + Math.random() * 4).toFixed(1));

    // AI actions
    const aiActions = 40 + Math.round(Math.random() * 20);

    // Update density history
    const now = new Date();
    this.history.density.push({
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(zones.reduce((s, z) => s + z.occupancy, 0) / zones.length),
    });
    if (this.history.density.length > 30) this.history.density.shift();

    return {
      timestamp: now.toISOString(),
      match: {
        minute: this.state.matchMinute,
        score: [...this.state.matchScore],
        attendance: this.state.totalAttendance,
        maxCapacity: this.state.maxCapacity,
      },
      zones,
      gates,
      energy,
      water,
      co2,
      waitTimes,
      transport,
      safetyScore,
      aiActions,
      incidents: this.state.incidents,
      densityHistory: [...this.history.density],
      gateFlowHistory: [...this.history.gateFlow],
    };
  }

  // Generate AI alerts
  generateAlerts() {
    const allAlerts = [
      { severity: 'critical', icon: '🔴', title: 'High Crowd Density — Gate A', message: 'Crowd density at Gate A has exceeded 90% for 5+ minutes. Consider redirecting fans to Gate C (currently at 55%).', time: '2 min ago' },
      { severity: 'warning', icon: '🟠', title: 'Concession Queue Alert — Main Food Court', message: 'Average wait time at Main Food Court has reached 14 minutes. Recommend opening backup service line.', time: '5 min ago' },
      { severity: 'info', icon: '🔵', title: 'Predicted Crowd Surge — Halftime', message: 'AI predicts 35% increase in concourse traffic in ~8 minutes (halftime). Pre-position staff at key choke points.', time: '8 min ago' },
      { severity: 'warning', icon: '🟠', title: 'Parking Lot A — Approaching Capacity', message: 'Lot A is at 94% capacity. Activate overflow signage to direct vehicles to Lot C and D.', time: '12 min ago' },
      { severity: 'info', icon: '🔵', title: 'Energy Optimization Applied', message: 'Automatically dimmed Zone F (Upper Bowl) lighting by 40% — occupancy at 18%. Saving ~32 kWh/hr.', time: '15 min ago' },
      { severity: 'critical', icon: '🔴', title: 'Water Usage Anomaly — Block D', message: 'Flow rate 28% above normal in restroom Block D. Possible fixture malfunction. Maintenance ticket auto-created.', time: '18 min ago' },
      { severity: 'info', icon: '🔵', title: 'Rideshare Surge Prediction', message: 'Post-match rideshare demand predicted to spike at 9:45 PM. Consider staggered exit messaging to reduce congestion.', time: '22 min ago' },
      { severity: 'warning', icon: '🟠', title: 'Noise Level Warning — Section 105', message: 'Sustained noise level at 98 dB in Section 105 (threshold: 95 dB). No action required yet — monitoring.', time: '25 min ago' },
    ];
    return allAlerts;
  }

  // Generate AI crowd predictions
  generateCrowdPredictions() {
    return [
      { type: 'warning', icon: '⚠️', title: 'Halftime Surge Expected in ~8 minutes', message: 'Based on historical patterns and current match flow, expect 35% increase in concourse foot traffic. Recommend pre-positioning 6 additional staff at key junctions.' },
      { type: 'info', icon: '📊', title: 'Post-Match Dispersal Forecast', message: 'With 82,500 attendance, AI estimates full venue clearance in 42 minutes. Optimized gate sequencing can reduce this to ~34 minutes.' },
      { type: 'success', icon: '✅', title: 'Current Flow: Optimal', message: 'All gate throughputs are within normal parameters. No immediate crowd management interventions required.' },
    ];
  }

  // Subscribe to data updates
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Emit event
  _emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  // Start simulation
  start(refreshRate = 5000) {
    this.refreshRate = refreshRate;
    if (this.intervalId) this.stop();

    // Emit initial data
    this._emit('snapshot', this.generateSnapshot());
    this._emit('alerts', this.generateAlerts());

    // Periodic updates
    this.intervalId = setInterval(() => {
      this._emit('snapshot', this.generateSnapshot());
    }, this.refreshRate);
  }

  // Stop simulation
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Update refresh rate
  setRefreshRate(rate) {
    this.refreshRate = rate;
    if (this.intervalId) {
      this.stop();
      this.start(rate);
    }
  }
}
