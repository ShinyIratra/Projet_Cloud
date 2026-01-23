<template>
  <ion-page class="dashboard-page">
    <ion-content :fullscreen="true" class="dashboard-content-wrapper">
      <!-- NAVBAR -->
      <nav class="glass-nav">
        <div class="navbar-brand">
          Road<span class="brand-accent">Alert</span>
          <span class="brand-tag">Tana</span>
        </div>
        <div class="navbar-right">
          <div class="profile-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="profile" />
          </div>
        </div>
      </nav>

      <!-- MAIN CONTENT -->
      <main class="dashboard-content">
        <!-- HEADER -->
        <div class="dashboard-header">
          <span class="header-badge">Vue d'ensemble</span>
          <h1 class="dashboard-title">Tableau de bord</h1>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
          <ion-spinner name="crescent" class="spinner"></ion-spinner>
          <p class="loading-text">Chargement des données...</p>
        </div>

        <!-- Stats Content -->
        <div v-else>
          <!-- STATS GRID -->
          <div class="stats-grid">
            <!-- Nombre de points -->
            <div class="stat-card">
              <div class="icon-shape blue">
                <i class="fas fa-map-pin"></i>
              </div>
              <p class="stat-label">Points recensés</p>
              <div class="stat-value-row">
                <h2 class="stat-value">{{ stats.totalPoints }}</h2>
              </div>
            </div>

            <!-- Surface totale -->
            <div class="stat-card">
              <div class="icon-shape indigo">
                <i class="fas fa-road"></i>
              </div>
              <p class="stat-label">Surface Signalée</p>
              <div class="stat-value-row">
                <h2 class="stat-value">
                  {{ formatNumber(stats.totalSurface) }}
                  <span class="stat-unit">m²</span>
                </h2>
              </div>
            </div>

            <!-- Budget total -->
            <div class="stat-card">
              <div class="icon-shape green">
                <i class="fas fa-wallet"></i>
              </div>
              <p class="stat-label">Budget Total</p>
              <div class="stat-value-row">
                <h2 class="stat-value">
                  {{ formatBudget(stats.totalBudget) }}
                  <span class="stat-unit">Ar</span>
                </h2>
              </div>
            </div>

            <!-- Avancement -->
            <div class="stat-card">
              <div class="icon-shape orange">
                <i class="fas fa-chart-line"></i>
              </div>
              <p class="stat-label">Avancement</p>
              <div class="stat-value-row">
                <h2 class="stat-value">
                  {{ stats.progressPercentage }}<span class="stat-unit">%</span>
                </h2>
              </div>
              <div class="progress-section">
                <div class="progress-bar-bg">
                  <div 
                    class="progress-bar-fill" 
                    :style="{ width: stats.progressPercentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- CHART AND COMPANIES SECTION -->
          <div class="chart-section">
            <!-- CHART CARD -->
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">Évolution des signalements</h3>
                <div class="time-selector">
                  <button 
                    :class="['time-btn', { active: period === 'week' }]"
                    @click="period = 'week'"
                  >
                    Semaine
                  </button>
                  <button 
                    :class="['time-btn', { active: period === 'month' }]"
                    @click="period = 'month'"
                  >
                    Mois
                  </button>
                </div>
              </div>
              <div class="chart-container">
                <Line :data="chartData" :options="chartOptions" />
              </div>
            </div>

            <!-- COMPANIES SECTION -->
            <div class="companies-card">
              <h3 class="companies-title">
                <i class="fas fa-building mr-2"></i>
                Entreprises actives
              </h3>
              <div class="companies-list">
                <div 
                  v-for="(company, index) in companyStats" 
                  :key="company.name"
                  class="company-item"
                >
                  <div class="company-info">
                    <div 
                      class="company-icon" 
                      :style="{ background: getCompanyColor(index) }"
                    >
                      <i class="fas fa-hard-hat"></i>
                    </div>
                    <div class="company-details">
                      <p class="company-name">{{ company.name }}</p>
                      <p class="company-count">{{ company.count }} signalement{{ company.count > 1 ? 's' : '' }}</p>
                    </div>
                  </div>
                  <div class="company-percentage">
                    {{ company.percentage }}%
                  </div>
                </div>

                <div v-if="companyStats.length === 0" class="empty-state">
                  <i class="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
                  <p class="text-slate-400 text-sm">Aucune entreprise enregistrée</p>
                </div>
              </div>
            </div>
          </div>

          <!-- RECENT ALERTS TABLE -->
          <div class="alerts-table-card">
            <div class="table-header">
              <h3 class="table-title">
                <i class="fas fa-list mr-2"></i>
                Signalements récents
              </h3>
              <button class="refresh-btn" @click="loadData">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>

            <div class="table-container">
              <table class="alerts-table">
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Surface</th>
                    <th>Budget</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="alert in recentAlerts" 
                    :key="alert.id"
                    class="table-row"
                  >
                    <td>
                      <div class="company-cell">
                        <div class="company-avatar">
                          {{ getInitials(alert.concerned_entreprise) }}
                        </div>
                        <span class="company-name-cell">{{ alert.concerned_entreprise }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="surface-value">{{ alert.surface }} m²</span>
                    </td>
                    <td>
                      <span class="budget-value">{{ formatBudget(alert.budget) }}</span>
                    </td>
                    <td>
                      <span :class="['status-badge', getStatusClass(alert.status)]">
                        {{ getStatusLabel(alert.status) }}
                      </span>
                    </td>
                    <td>
                      <span class="date-value">{{ formatDate(alert.date_alert) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-if="recentAlerts.length === 0" class="empty-state">
                <i class="fas fa-folder-open text-4xl text-slate-300 mb-3"></i>
                <p class="text-slate-400 text-sm">Aucun signalement</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- BOTTOM NAVIGATION -->
      <div class="bottom-nav">
        <div 
          v-for="tab in tabs" 
          :key="tab.name"
          @click="handleTabClick(tab.name)"
          :class="['nav-item', { active: activeTab === tab.name }]"
        >
          <i :class="`fas ${tab.icon}`"></i>
          <span>{{ tab.label }}</span>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonContent, IonPage, IonSpinner } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { fetchRoadAlerts, type RoadAlert } from '../utils/roadAlertApi';
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
import './Dashboard.css';

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

const router = useRouter();
const isLoading = ref(false);
const alerts = ref<RoadAlert[]>([]);
const activeTab = ref('stats');
const period = ref<'week' | 'month'>('week');

interface DashboardStats {
  totalPoints: number;
  totalSurface: number;
  totalBudget: number;
  progressPercentage: number;
}

interface CompanyStats {
  name: string;
  percentage: number;
  count: number;
}

const stats = ref<DashboardStats>({
  totalPoints: 0,
  totalSurface: 0,
  totalBudget: 0,
  progressPercentage: 0,
});

const companyStats = ref<CompanyStats[]>([]);

const tabs = [
  { name: 'explorer', label: 'Explorer', icon: 'fa-map-marked-alt' },
  { name: 'stats', label: 'Stats', icon: 'fa-chart-pie' },
  { name: 'alerts', label: 'Alertes', icon: 'fa-bell' },
  { name: 'profile', label: 'Profil', icon: 'fa-user' },
];

const recentAlerts = computed(() => {
  return alerts.value.slice(0, 10); // Show only 10 most recent
});

const loadData = async () => {
  isLoading.value = true;
  try {
    const data = await fetchRoadAlerts();
    alerts.value = data;
    calculateStats(data);
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
  } finally {
    isLoading.value = false;
  }
};

const calculateStats = (data: RoadAlert[]) => {
  const totalPoints = data.length;
  const totalSurface = data.reduce((sum, alert) => sum + alert.surface, 0);
  const totalBudget = data.reduce((sum, alert) => sum + alert.budget, 0);
  
  const completedCount = data.filter(alert => 
    alert.status.toLowerCase() === 'terminé' || alert.status.toLowerCase() === 'termine'
  ).length;
  
  const progressPercentage = totalPoints > 0 
    ? Math.round((completedCount / totalPoints) * 100) 
    : 0;

  stats.value = { totalPoints, totalSurface, totalBudget, progressPercentage };

  // Calculate company statistics
  const companyMap: { [key: string]: number } = {};
  data.forEach(alert => {
    const company = alert.concerned_entreprise;
    companyMap[company] = (companyMap[company] || 0) + 1;
  });

  const companyStatsArray = Object.entries(companyMap).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / totalPoints) * 100),
  })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5

  companyStats.value = companyStatsArray;
};

const formatNumber = (num: number) => {
  return num.toLocaleString('fr-FR');
};

const formatBudget = (budget: number) => {
  if (budget >= 1_000_000_000) {
    return (budget / 1_000_000_000).toFixed(2) + ' Md';
  } else if (budget >= 1_000_000) {
    return (budget / 1_000_000).toFixed(0) + ' M';
  }
  return budget.toLocaleString('fr-FR');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusClass = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'terminé' || statusLower === 'termine') return 'status-done';
  if (statusLower === 'en_cours' || statusLower === 'en cours') return 'status-progress';
  return 'status-new';
};

const getStatusLabel = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'terminé' || statusLower === 'termine') return 'Terminé';
  if (statusLower === 'en_cours' || statusLower === 'en cours') return 'En cours';
// Chart Data
const chartData = computed(() => {
  const labels = period.value === 'week' 
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

  // Simulate data based on alerts count
  const baseValue = Math.ceil(alerts.value.length / (period.value === 'week' ? 7 : 4));
  const dataPoints = period.value === 'week'
    ? [
        Math.max(1, baseValue + Math.floor(Math.random() * 5)),
        Math.max(1, baseValue + Math.floor(Math.random() * 8)),
        Math.max(1, baseValue + Math.floor(Math.random() * 6)),
        Math.max(1, baseValue + Math.floor(Math.random() * 10)),
        Math.max(1, baseValue + Math.floor(Math.random() * 7)),
        Math.max(1, baseValue + Math.floor(Math.random() * 12)),
        Math.max(1, baseValue + Math.floor(Math.random() * 9))
      ]
    : [
        Math.max(5, baseValue * 7 + Math.floor(Math.random() * 20)),
        Math.max(5, baseValue * 7 + Math.floor(Math.random() * 25)),
        Math.max(5, baseValue * 7 + Math.floor(Math.random() * 22)),
        Math.max(5, baseValue * 7 + Math.floor(Math.random() * 30))
      ];

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
      borderRadius: 8,
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
          weight: '600',
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
          weight: '600',
        },
        color: '#94a3b8',
      },
    },
  },
};

  return 'Nouveau';
};

const getCompanyColor = (index: number) => {
  const colors = ['#2563eb', '#4f46e5', '#16a34a', '#ea580c', '#dc2626'];
  return colors[index] || '#64748b';
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const handleTabClick = (tabName: string) => {
  activeTab.value = tabName;
  if (tabName === 'explorer') {
    router.push('/home');
  }
  // TODO: Navigate to other pages when ready
};

onMounted(() => {
  loadData();
});
</script>
