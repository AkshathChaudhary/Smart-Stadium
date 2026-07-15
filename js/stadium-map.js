/* ============================================================
   StadiumAI Command — Interactive Stadium SVG Map
   Renders heatmaps and wayfinding paths on a dynamic SVG
   ============================================================ */

export class StadiumMap {
  constructor(svgId, options = {}) {
    this.svg = document.getElementById(svgId);
    if (!this.svg) {
      console.warn(`[StadiumMap] SVG element #${svgId} not found.`);
      return;
    }

    this.onZoneClick = options.onZoneClick || null;
    this.onZoneHover = options.onZoneHover || null;

    // Define coords for the 12 zones (for MetLife Stadium representation)
    this.zonesConfig = {
      'zone-a': { name: 'Gate A — Main Entrance', d: 'M 350,50 L 450,50 L 480,120 L 320,120 Z', cx: 400, cy: 85 },
      'zone-b': { name: 'Gate B — North', d: 'M 450,50 L 580,90 L 520,170 L 420,130 Z', cx: 490, cy: 110 },
      'zone-c': { name: 'Gate C — East', d: 'M 580,90 L 650,200 L 560,220 L 500,160 Z', cx: 570, cy: 170 },
      'zone-d': { name: 'Gate D — South', d: 'M 350,450 L 450,450 L 480,380 L 320,380 Z', cx: 400, cy: 415 },
      'zone-e': { name: 'Gate E — West', d: 'M 220,90 L 150,200 L 240,220 L 300,160 Z', cx: 230, cy: 170 },
      'zone-f': { name: 'Upper Concourse', d: 'M 150,200 L 150,300 L 240,280 L 240,220 Z', cx: 195, cy: 250 },
      'zone-g': { name: 'Lower Concourse', d: 'M 650,200 L 650,300 L 560,280 L 560,220 Z', cx: 605, cy: 250 },
      'zone-h': { name: 'VIP Section', d: 'M 580,410 L 650,300 L 560,280 L 500,340 Z', cx: 570, cy: 330 },
      'zone-i': { name: 'Food Court — Main', d: 'M 220,410 L 150,300 L 240,280 L 300,340 Z', cx: 230, cy: 330 },
      'zone-j': { name: 'Field Level', d: 'M 320,200 L 480,200 L 480,300 L 320,300 Z', cx: 400, cy: 250 },
      'zone-k': { name: 'Mid Bowl (100-200)', d: 'M 300,160 L 500,160 L 500,200 L 300,200 Z', cx: 400, cy: 180 },
      'zone-l': { name: 'Upper Bowl (300+)', d: 'M 300,300 L 500,300 L 500,340 L 300,340 Z', cx: 400, cy: 320 }
    };

    // Wayfinding nodes (for path drawing)
    this.nodes = {
      gateA: { x: 400, y: 70 },
      gateB: { x: 500, y: 100 },
      gateC: { x: 590, y: 160 },
      gateD: { x: 400, y: 430 },
      gateE: { x: 210, y: 160 },
      field: { x: 400, y: 250 },
      restroomSec100: { x: 460, y: 190 },
      foodConcourseC: { x: 530, y: 250 },
      firstAidLevel1: { x: 340, y: 250 },
      elevatorSec102: { x: 330, y: 180 },
      merchStoreMain: { x: 400, y: 140 },
      sensoryRoomGateC: { x: 540, y: 180 },
      serviceAnimalGateD: { x: 370, y: 390 }
    };

    this.init();
  }

  init() {
    this.svg.innerHTML = ''; // clear

    // 1. Draw grid / guide lines (optional, keep it clean)
    // 2. Draw stadium structural outer boundary (dashed line)
    const outerTrack = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outerTrack.setAttribute('x', '100');
    outerTrack.setAttribute('y', '30');
    outerTrack.setAttribute('width', '600');
    outerTrack.setAttribute('height', '440');
    outerTrack.setAttribute('rx', '180');
    outerTrack.setAttribute('fill', 'none');
    outerTrack.setAttribute('stroke', 'rgba(0, 229, 255, 0.08)');
    outerTrack.setAttribute('stroke-width', '8');
    this.svg.appendChild(outerTrack);

    // 3. Draw zones
    for (const [id, config] of Object.entries(this.zonesConfig)) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', id);
      path.setAttribute('d', config.d);
      path.setAttribute('class', 'heatmap-zone density-low'); // default low
      path.setAttribute('data-name', config.name);

      // Event listeners
      path.addEventListener('click', (e) => {
        if (this.onZoneClick) this.onZoneClick(id, config, e);
      });

      path.addEventListener('mouseenter', () => {
        // Bring to front so 3D scale doesn't clip behind neighbors
        path.parentNode.appendChild(path);
      });

      path.addEventListener('mousemove', (e) => {
        if (this.onZoneHover) this.onZoneHover(id, config, e);
      });

      path.addEventListener('mouseleave', () => {
        if (this.onZoneHover) this.onZoneHover(null, null, null);
      });

      this.svg.appendChild(path);

      // Zone Label Text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('id', `label-${id}`);
      text.setAttribute('x', config.cx);
      text.setAttribute('y', config.cy - 5); // Shift up slightly to make room for count
      text.setAttribute('fill', 'rgba(240, 244, 255, 0.85)');
      text.setAttribute('font-size', '10px');
      text.setAttribute('font-weight', '600');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('pointer-events', 'none');
      
      // Short label logic
      let label = config.name.split(' ')[0];
      if (config.name.includes('Bowl')) label = config.name.match(/\(([^)]+)\)/)?.[1] || 'Bowl';
      if (config.name.includes('Gate')) label = config.name.split('—')[0].trim();
      text.textContent = label;
      this.svg.appendChild(text);
    }
  }

  // Update heatmap colors based on live density states
  updateHeatmap(zones) {
    zones.forEach(zone => {
      const el = this.svg.getElementById(zone.id);
      if (el) {
        // Remove old density classes
        el.setAttribute('class', `heatmap-zone density-${zone.density}`);
        // Add pulsing effect to critical zones
        if (zone.density === 'critical') {
          el.classList.add('heatmap-pulse');
        } else {
          el.classList.remove('heatmap-pulse');
        }
      }

      // Dynamically update label to show count
      const textEl = this.svg.getElementById(`label-${zone.id}`);
      if (textEl) {
        const config = this.zonesConfig[zone.id];
        let label = config.name.split(' ')[0];
        if (config.name.includes('Bowl')) label = config.name.match(/\(([^)]+)\)/)?.[1] || 'Bowl';
        if (config.name.includes('Gate')) label = config.name.split('—')[0].trim();
        
        textEl.innerHTML = `<tspan x="${config.cx}" dy="0">${label}</tspan><tspan x="${config.cx}" dy="11" font-size="8px" font-weight="500" fill="rgba(255, 255, 255, 0.6)">${zone.people.toLocaleString()}</tspan>`;
      }
    });
  }

  // Clear path drawings
  clearPaths() {
    const paths = this.svg.querySelectorAll('.wayfinding-path, .wayfinding-node');
    paths.forEach(p => p.remove());
  }

  // Draw navigation route between two nodes
  drawRoute(fromNodeKey, toNodeKey, accessibleOnly = false) {
    this.clearPaths();

    const start = this.nodes[fromNodeKey];
    const end = this.nodes[toNodeKey];

    if (!start || !end) {
      console.warn(`[StadiumMap] Nodes not found: ${fromNodeKey} or ${toNodeKey}`);
      return;
    }

    // Generate waypoints
    let points = [start];

    // If accessible, route through elevator
    if (accessibleOnly && fromNodeKey !== 'elevatorSec102' && toNodeKey !== 'elevatorSec102') {
      points.push(this.nodes.elevatorSec102);
    }

    // Mid waypoint to make path look natural inside stadium
    if (!accessibleOnly) {
      points.push({ x: (start.x + end.x) / 2 + (Math.random() - 0.5) * 30, y: (start.y + end.y) / 2 + (Math.random() - 0.5) * 30 });
    }

    points.push(end);

    // Build SVG path
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }

    // 1. Draw glowing background path
    const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glowPath.setAttribute('d', d);
    glowPath.setAttribute('class', 'wayfinding-path');
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('stroke', 'rgba(0, 229, 255, 0.4)');
    glowPath.setAttribute('stroke-width', '8');
    glowPath.setAttribute('stroke-linecap', 'round');
    glowPath.setAttribute('stroke-linejoin', 'round');
    glowPath.style.filter = 'drop-shadow(0 0 8px #00E5FF)';
    this.svg.appendChild(glowPath);

    // 2. Draw actual solid foreground path
    const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mainPath.setAttribute('d', d);
    mainPath.setAttribute('class', 'wayfinding-path');
    mainPath.setAttribute('fill', 'none');
    mainPath.setAttribute('stroke', '#00E5FF');
    mainPath.setAttribute('stroke-width', '3');
    mainPath.setAttribute('stroke-linecap', 'round');
    mainPath.setAttribute('stroke-linejoin', 'round');
    mainPath.setAttribute('stroke-dasharray', '8, 4');
    mainPath.style.animation = 'dataFlow 2s linear infinite';
    this.svg.appendChild(mainPath);

    // 3. Draw start & end marker circles
    [start, end].forEach((pt, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', idx === 0 ? '7' : '9');
      circle.setAttribute('class', 'wayfinding-node');
      circle.setAttribute('fill', idx === 0 ? '#B388FF' : '#FFD700');
      circle.setAttribute('stroke', '#060B18');
      circle.setAttribute('stroke-width', '2');
      this.svg.appendChild(circle);

      // Pulse ring for destination
      if (idx === 1) {
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('cx', pt.x);
        pulse.setAttribute('cy', pt.y);
        pulse.setAttribute('r', '15');
        pulse.setAttribute('class', 'wayfinding-node');
        pulse.setAttribute('fill', 'none');
        pulse.setAttribute('stroke', '#FFD700');
        pulse.setAttribute('stroke-width', '1.5');
        pulse.style.animation = 'pulse-green 1.5s ease-in-out infinite';
        this.svg.appendChild(pulse);
      }
    });
  }
}
