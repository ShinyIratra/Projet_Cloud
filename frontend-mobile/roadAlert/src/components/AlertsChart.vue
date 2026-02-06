<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">Évolution des signalements</h3>
      <div class="time-selector">
        <button 
          :class="['time-btn', { active: period === 'week' }]"
          @click="handlePeriodChange('week')"
        >
          Semaine
        </button>
        <button 
          :class="['time-btn', { active: period === 'month' }]"
          @click="handlePeriodChange('month')"
        >
          Mois
        </button>
      </div>
    </div>
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RoadAlert } from '../utils/roadAlertApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  alerts: RoadAlert[];
}

const props = defineProps<Props>();
const period = ref<'week' | 'month'>('week');

const handlePeriodChange = (newPeriod: 'week' | 'month') => {
  period.value = newPeriod;
};

const getChartDataFromAlerts = () => {
  if (props.alerts.length === 0) {
    return period.value === 'week' ? [0, 0, 0, 0, 0, 0, 0] : [0, 0, 0, 0];
  }

  const now = new Date();
  const alertsByPeriod: { [key: string]: number } = {};

  if (period.value === 'week') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      alertsByPeriod[key] = 0;
    }

    props.alerts.forEach(alert => {
      const alertDate = new Date(alert.date_alert);
      const key = alertDate.toISOString().split('T')[0];
      if (alertsByPeriod.hasOwnProperty(key)) {
        alertsByPeriod[key]++;
      }
    });

    return Object.values(alertsByPeriod);
  } else {
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      const key = `week-${i}`;
      alertsByPeriod[key] = 0;
    }

    props.alerts.forEach(alert => {
      const alertDate = new Date(alert.date_alert);
      const diffDays = Math.floor((now.getTime() - alertDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      
      if (weekIndex >= 0 && weekIndex < 4) {
        const key = `week-${3 - weekIndex}`;
        if (alertsByPeriod.hasOwnProperty(key)) {
          alertsByPeriod[key]++;
        }
      }
    });

    return Object.values(alertsByPeriod);
  }
};

const chartData = computed(() => {
  const labels = period.value === 'week' 
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

  const dataPoints = getChartDataFromAlerts();

  return {
    labels,
    datasets: [
      {
        label: 'Signalements',
        data: dataPoints,
        borderColor: '#2563eb',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(37, 99, 235, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#2563eb',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  };
});

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      cornerRadius: 8,
      titleColor: '#f1f5f9',
      bodyColor: '#f1f5f9',
      displayColors: false,
      callbacks: {
        label: (context) => `${context.parsed.y} signalements`,
      },
    },
  },
  scales: {
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          size: 10,
          weight: 600,
        },
        color: '#94a3b8',
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 10,
          weight: 600,
        },
        color: '#94a3b8',
      },
    },
  },
};
</script>

<style scoped>
.chart-card {
  background: white;
  border-radius: 1.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.time-selector {
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.time-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn:hover {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.time-btn.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-container {
  height: 280px;
  position: relative;
}

@media (max-width: 768px) {
  .chart-container {
    height: 220px;
  }
}
</style>
