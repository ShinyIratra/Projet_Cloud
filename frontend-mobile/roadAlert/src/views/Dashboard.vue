<template>
  <ion-page class="dashboard-page">
    <ion-content :fullscreen="true" class="dashboard-content-wrapper">
      <!-- NAVBAR -->
      <TopNavBar 
        :showBrand="true"
        :showUserMenu="true"
        :isAuthenticated="isAuthenticated"
        @logout="handleLogout"
        @login="router.push('/login')"
      />

      <!-- MAIN CONTENT -->
      <main class="dashboard-content">
        <!-- HEADER -->
        <div class="dashboard-header">
          <div>
            <span class="header-badge">Vue d'ensemble</span>
            <h1 class="dashboard-title">Tableau de bord</h1>
          </div>
          
          <!-- FILTRE MES SIGNALEMENTS -->
          <div class="filter-toggle">
            <button 
              @click="toggleAllAlerts"
              :class="['filter-btn', { active: !showMyAlertsOnly }]"
            >
              <i class="fas fa-globe"></i>
              <span>Tous</span>
            </button>
            <button 
              @click="toggleMyAlerts"
              :class="['filter-btn', { active: showMyAlertsOnly }]"
            >
              <i class="fas fa-user"></i>
              <span>Mes signalements</span>
            </button>
          </div>
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
            <AlertsChart :alerts="alerts" />

            <!-- COMPANIES SECTION -->
            <CompaniesCard :companies="companyStats" />
          </div>

          <!-- RECENT ALERTS TABLE -->
          <AlertsTable 
            :alerts="recentAlerts" 
            :title="showMyAlertsOnly ? 'Mes signalements récents' : 'Signalements récents'"
            :emptyMessage="showMyAlertsOnly ? 'Vous n\'avez pas encore créé de signalement' : 'Aucun signalement'"
            @refresh="loadData"
          />
        </div>
      </main>

      <!-- BOTTOM NAVIGATION -->
      <BottomNavBar :activeTab="activeTab" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonContent, IonPage, IonSpinner } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { fetchRoadAlerts, fetchUserRoadAlerts, type RoadAlert } from '../utils/roadAlertApi';
import AlertsChart from '../components/AlertsChart.vue';
import CompaniesCard from '../components/CompaniesCard.vue';
import AlertsTable from '../components/AlertsTable.vue';
import TopNavBar from '../components/TopNavBar.vue';
import BottomNavBar from '../components/BottomNavBar.vue';
import './Dashboard.css';

const router = useRouter();
const isLoading = ref(false);
const alerts = ref<RoadAlert[]>([]);
const activeTab = ref('stats');
const showMyAlertsOnly = ref(false);
const isAuthenticated = ref(false);

// Vérifier l'authentification
const checkAuth = () => {
  const authToken = localStorage.getItem('authToken');
  isAuthenticated.value = !!authToken;
};

// UID de l'utilisateur - récupéré depuis le localStorage
const getUserUID = (): string => {
  // Essayer de récupérer l'UID depuis le localStorage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.UID || user.uid || `user-${Date.now()}`;
    } catch (e) {
      console.error('Erreur lors de la lecture de l\'utilisateur:', e);
    }
  }
  // Fallback : générer un UID temporaire
  return `user-${Date.now()}`;
};

const currentUserUID = ref<string>(getUserUID());

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

const recentAlerts = computed(() => {
  return alerts.value.slice(0, 10); // Show only 10 most recent
});

const loadData = async () => {
  isLoading.value = true;
  try {
    let data: RoadAlert[];
    
    if (showMyAlertsOnly.value) {
      // Charger uniquement les signalements de l'utilisateur
      data = await fetchUserRoadAlerts(currentUserUID.value);
      console.log('Données chargées depuis /road_alerts/user/' + currentUserUID.value, data);
    } else {
      // Charger tous les signalements
      data = await fetchRoadAlerts();
      console.log('Données chargées depuis /road_alerts:', data);
    }
    
    alerts.value = data;
    calculateStats(data);
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
  } finally {
    isLoading.value = false;
  }
};

const toggleMyAlerts = () => {
  // Vérifier si l'utilisateur est connecté
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    // Rediriger vers la page de connexion
    router.push('/login');
    return;
  }
  
  showMyAlertsOnly.value = true;
  loadData();
};

const toggleAllAlerts = () => {
  showMyAlertsOnly.value = false;
  loadData();
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

const handleLogout = () => {
  // Supprimer toutes les données de localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Rediriger vers login
  router.push('/login');
};

onMounted(() => {
  checkAuth();
  loadData();
});
</script>
