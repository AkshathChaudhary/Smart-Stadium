/* ============================================================
   StadiumAI Command — Crowd Analytics Charting
   Utilizes Chart.js to render real-time operations charts
   ============================================================ */

import Chart from 'chart.js/auto';

export class CrowdAnalytics {
  constructor() {
    this.densityChart = null;
    this.gateFlowChart = null;
    this._initCharts();
  }

  _initCharts() {
    const ctxDensity = document.getElementById('densityChart')?.getContext('2d');
    const ctxGateFlow = document.getElementById('gateFlowChart')?.getContext('2d');

    if (ctxDensity) {
      this.densityChart = new Chart(ctxDensity, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Avg Stadium Density (%)',
            data: [],
            borderColor: '#00E5FF',
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#00E5FF'
          }]
        },
        options: this._getChartOptions('Time', 'Density %')
      });
    }

    if (ctxGateFlow) {
      this.gateFlowChart = new Chart(ctxGateFlow, {
        type: 'bar',
        data: {
          labels: ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'Gate E', 'Gate F', 'VIP', 'Media'],
          datasets: [{
            label: 'Current Flow (people/min)',
            data: [],
            backgroundColor: 'rgba(179, 136, 255, 0.65)',
            borderColor: '#B388FF',
            borderWidth: 1.5,
            borderRadius: 6
          }, {
            label: 'Max Safety Capacity',
            data: [],
            backgroundColor: 'rgba(255, 82, 82, 0.15)',
            borderColor: 'rgba(255, 82, 82, 0.4)',
            borderWidth: 1.5,
            borderRadius: 6,
            type: 'bar'
          }]
        },
        options: this._getChartOptions('Gates', 'People / Min')
      });
    }
  }

  _getChartOptions(xTitle, yTitle) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#8A96B8',
            font: { family: 'Inter', size: 11 }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(138, 150, 184, 0.08)' },
          ticks: { color: '#8A96B8', font: { family: 'Inter', size: 10 } },
          title: { display: true, text: xTitle, color: '#525F7F', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(138, 150, 184, 0.08)' },
          ticks: { color: '#8A96B8', font: { family: 'Inter', size: 10 } },
          title: { display: true, text: yTitle, color: '#525F7F', font: { size: 11 } },
          beginAtZero: true
        }
      }
    };
  }

  updateCharts(data) {
    // 1. Update density chart
    if (this.densityChart) {
      const history = data.densityHistory || [];
      this.densityChart.data.labels = history.map(item => item.time);
      this.densityChart.data.datasets[0].data = history.map(item => item.value);
      this.densityChart.update('none'); // silent update
    }

    // 2. Update gate flow chart
    if (this.gateFlowChart) {
      const gates = data.gates || [];
      this.gateFlowChart.data.datasets[0].data = gates.map(g => g.currentFlow);
      this.gateFlowChart.data.datasets[1].data = gates.map(g => g.maxCapacity);
      this.gateFlowChart.update('none');
    }
  }
}
