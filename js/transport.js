/* ============================================================
   StadiumAI Command — Transportation Panel
   Updates transport stats, parking tables, and transit timings
   ============================================================ */

export class TransportManager {
  constructor() {
    this.parkingAvail = document.getElementById('parkingAvail');
    this.nextTrain = document.getElementById('nextTrain');
    this.rideshareWait = document.getElementById('rideshareWait');
    this.shuttleNext = document.getElementById('shuttleNext');
    this.parkingLots = document.getElementById('parkingLots');
    this.transitTable = document.getElementById('transitTable');
  }

  updateTransport(data) {
    if (!data || !data.transport) return;

    const t = data.transport;

    // Update stats cards
    if (this.parkingAvail) this.parkingAvail.textContent = t.parkingAvailable.toLocaleString();
    if (this.nextTrain) this.nextTrain.textContent = `${t.nextTrain} min`;
    if (this.rideshareWait) this.rideshareWait.textContent = `~${t.rideshareWait} min`;
    if (this.shuttleNext) this.shuttleNext.textContent = `${t.nextShuttle} min`;

    // Dynamically update parking details
    if (this.parkingLots) {
      const capA = Math.max(0, Math.round(100 - (t.parkingAvailable / 100)));
      const capB = Math.max(20, Math.round(90 - (t.parkingAvailable / 200)));
      const capC = Math.max(10, Math.round(70 - (t.parkingAvailable / 300)));

      this.parkingLots.innerHTML = `
        <div class="staff-zone">
          <div class="zone-info">
            <div class="zone-name">Lot A (VIP)</div>
            <div class="zone-detail">Closest to Gate A — 2 min walk</div>
          </div>
          <span class="badge ${capA >= 95 ? 'red' : 'orange'}">${capA >= 95 ? 'FULL' : `${capA}% Full`}</span>
        </div>
        <div class="staff-zone">
          <div class="zone-info">
            <div class="zone-name">Lot B (General)</div>
            <div class="zone-detail">Near Gate C — 5 min walk</div>
          </div>
          <span class="badge ${capB >= 85 ? 'red' : capB >= 65 ? 'orange' : 'yellow'}">${capB}% Full</span>
        </div>
        <div class="staff-zone">
          <div class="zone-info">
            <div class="zone-name">Lot C (General)</div>
            <div class="zone-detail">Near Gate E — 7 min walk</div>
          </div>
          <span class="badge ${capC >= 85 ? 'red' : capC >= 50 ? 'yellow' : 'green'}">${capC}% Full</span>
        </div>
        <div class="staff-zone">
          <div class="zone-info">
            <div class="zone-name">Lot D (Overflow)</div>
            <div class="zone-detail">Shuttle required — 15 min</div>
          </div>
          <span class="badge green">Available</span>
        </div>
      `;
    }

    // Dynamically update transit listings
    if (this.transitTable) {
      this.transitTable.innerHTML = `
        <tr>
          <td>🚇 NJ Transit — Meadowlands Line</td>
          <td style="font-family:var(--font-mono);">${t.nextTrain} min</td>
          <td><span class="badge green">On Time</span></td>
        </tr>
        <tr>
          <td>🚌 Route 160 — Port Authority</td>
          <td style="font-family:var(--font-mono);">${t.nextTrain + 7} min</td>
          <td><span class="badge green">On Time</span></td>
        </tr>
        <tr>
          <td>🚌 Route 165 — GWB Terminal</td>
          <td style="font-family:var(--font-mono);">${t.nextTrain + 14} min</td>
          <td><span class="badge yellow">Delayed</span></td>
        </tr>
        <tr>
          <td>🚌 Shuttle — Secaucus Junction</td>
          <td style="font-family:var(--font-mono);">${t.nextShuttle} min</td>
          <td><span class="badge green">On Time</span></td>
        </tr>
      `;
    }
  }
}
