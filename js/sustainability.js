/* ============================================================
   StadiumAI Command — Sustainability Analytics
   Utilizes Chart.js to render sustainability profiles
   ============================================================ */

import Chart from 'chart.js/auto';

export class SustainabilityAnalytics {
  constructor() {
    this.energyChart = null;
    this.waterChart = null;
    this._initCharts();
  }

  _initCharts() {
    const ctxEnergy = document.getElementById('energyChart')?.getContext('2d');
    const ctxWater = document.getElementById('waterChart')?.getContext('2d');

    if (ctxEnergy) {
      this.energyChart = new Chart(ctxEnergy, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Total Power Draw (MW)',
            data: [],
            borderColor: '#00E676',
            backgroundColor: 'rgba(0, 230, 118, 0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: this._getChartOptions('Hour', 'Megawatts (MW)')
      });
    }

    if (ctxWater) {
      this.waterChart = new Chart(ctxWater, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Water Consumption (L)',
            data: [],
            backgroundColor: 'rgba(0, 229, 255, 0.65)',
            borderColor: '#00E5FF',
            borderWidth: 1.5,
            borderRadius: 4
          }]
        },
        options: this._getChartOptions('Hour', 'Liters (L)')
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
          ticks: { color: '#8A96B8', font: { family: 'Inter', size: 10 } }
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
    // Update Energy Chart from history
    if (this.energyChart && data.energy?.history) {
      const history = data.energy.history;
      this.energyChart.data.labels = history.map(h => h.hour);
      this.energyChart.data.datasets[0].data = history.map(h => h.value);
      this.energyChart.update('none');
    }

    // Update Water Chart from history
    if (this.waterChart && data.water?.history) {
      const history = data.water.history;
      this.waterChart.data.labels = history.map(w => w.hour);
      this.waterChart.data.datasets[0].data = history.map(w => w.value);
      this.waterChart.update('none');
    }
  }
}
