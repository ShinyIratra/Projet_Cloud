<template>
  <ion-page class="home-page">
    <ion-content :fullscreen="true" class="home-content">
      <!-- MAP -->
      <div id="map" ref="mapContainer"></div>

      <!-- TOP NAVIGATION & SEARCH -->
      <div class="floating-search space-y-3">
        <div class="glass-morphism rounded-2xl p-2 flex items-center shadow-lg border border-white">
          <button class="p-2 text-slate-400" @click="toggleMenu">
            <i class="fas fa-bars"></i>
          </button>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher à Antananarivo..." 
            class="flex-grow bg-transparent border-none focus:ring-0 text-sm font-semibold px-2"
          />
          <div class="w-8 h-8 rounded-full overflow-hidden bg-blue-100">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user">
          </div>
        </div>
        
        <!-- Quick Filters -->
        <div class="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['glass-morphism px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white whitespace-nowrap shadow-sm',
                     activeFilter === filter.value ? 'bg-blue-600 text-white' : 'text-slate-600']"
          >
            <i :class="`fas ${filter.icon} mr-1`"></i> {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- FLOATING ACTIONS (Right side) -->
      <div class="fixed right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col space-y-3">
        <button class="action-button bg-white text-slate-700" @click="centerMap">
          <i class="fas fa-location-arrow"></i>
        </button>
        <button class="action-button bg-blue-600 text-white" @click="handleAddAlert">
          <i class="fas fa-plus"></i>
        </button>
      </div>

      <!-- BOTTOM SHEET (Détails) -->
      <div id="bottom-sheet" :class="{ active: isSheetActive }">
        <div class="sheet-handle" @click="closeSheet"></div>
        
        <div class="px-6 pb-10" v-if="selectedAlert">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span 
                :class="['text-[10px] font-black uppercase px-2 py-1 rounded-md', getStatusClass(selectedAlert.status)]"
              >
                {{ selectedAlert.status }}
              </span>
              <h2 class="text-xl font-extrabold text-slate-800 mt-2">
                {{ selectedAlert.concerned_entreprise }}
              </h2>
              <p class="text-xs text-slate-400 font-medium">
                Signalé le {{ formatDate(selectedAlert.date_alert) }}
              </p>
            </div>
            <button @click="closeSheet" class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-slate-50 p-3 rounded-xl">
              <p class="text-[10px] uppercase font-bold text-slate-400">Surface</p>
              <p class="font-bold text-slate-700">{{ selectedAlert.surface }} m²</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl">
              <p class="text-[10px] uppercase font-bold text-slate-400">Budget</p>
              <p class="font-bold text-green-600">{{ formatBudget(selectedAlert.budget) }}</p>
            </div>
          </div>

          <div class="rounded-2xl overflow-hidden mb-6 h-40 bg-slate-100 flex items-center justify-center">
            <i class="fas fa-road text-6xl text-slate-300"></i>
          </div>

          <div class="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <i class="fas fa-hard-hat"></i>
              </div>
              <div>
                <p class="text-[10px] font-bold text-blue-400 uppercase leading-none">Entreprise</p>
                <p class="font-bold text-blue-900">{{ selectedAlert.concerned_entreprise }}</p>
              </div>
            </div>
            <i class="fas fa-chevron-right text-blue-300"></i>
          </div>
          
          <button class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold mt-6 shadow-lg active:scale-95 transition">
            Suivre l'avancement
          </button>
        </div>
      </div>

      <!-- NAVIGATION BAR (Bottom Tabs) -->
      <div class="fixed bottom-0 left-0 right-0 glass-morphism border-t border-slate-200 px-8 py-3 flex justify-between items-center z-[3000]">
        <div 
          v-for="tab in tabs" 
          :key="tab.name"
          @click="handleTabClick(tab.name)"
          :class="['flex flex-col items-center', activeTab === tab.name ? 'text-blue-600' : 'text-slate-400']"
        >
          <i :class="`fas ${tab.icon} text-lg`"></i>
          <span class="text-[10px] font-bold mt-1">{{ tab.label }}</span>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[5000]">
        <div class="bg-white rounded-2xl p-6 flex flex-col items-center">
          <ion-spinner name="crescent"></ion-spinner>
          <p class="mt-3 text-sm font-semibold">Chargement des signalements...</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { IonContent, IonPage, IonSpinner } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { fetchRoadAlerts, type RoadAlert } from '../utils/roadAlertApi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Home.css';

const router = useRouter();
const mapContainer = ref<HTMLElement | null>(null);
const searchQuery = ref('');
const isSheetActive = ref(false);
const selectedAlert = ref<RoadAlert | null>(null);
const activeFilter = ref('all');
const activeTab = ref('explorer');
const isLoading = ref(false);
const roadAlerts = ref<RoadAlert[]>([]);

let map: L.Map | null = null;
let markers: L.Marker[] = [];

const filters = [
  { value: 'all', label: 'Tous', icon: 'fa-list' },
  { value: 'nouveau', label: 'Nouveau', icon: 'fa-exclamation-circle' },
  { value: 'en_cours', label: 'En cours', icon: 'fa-hammer' },
  { value: 'termine', label: 'Terminés', icon: 'fa-check-circle' },
];

const tabs = [
  { name: 'explorer', label: 'Explorer', icon: 'fa-map-marked-alt' },
  { name: 'stats', label: 'Stats', icon: 'fa-chart-pie' },
  { name: 'alerts', label: 'Alertes', icon: 'fa-bell' },
  { name: 'profile', label: 'Profil', icon: 'fa-user' },
];

const filteredAlerts = computed(() => {
  if (activeFilter.value === 'all') return roadAlerts.value;
  return roadAlerts.value.filter(alert => alert.status === activeFilter.value);
});

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'nouveau': 'bg-red-100 text-red-700',
    'en_cours': 'bg-blue-100 text-blue-700',
    'termine': 'bg-green-100 text-green-700',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatBudget = (budget: number) => {
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 }).format(budget);
};

const initMap = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, { zoomControl: false }).setView([-18.8792, 47.5079], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Fermer le bottom sheet quand on clique sur la carte
  map.on('click', () => {
    if (isSheetActive.value) closeSheet();
  });
};

const loadRoadAlerts = async () => {
  isLoading.value = true;
  try {
    const alerts = await fetchRoadAlerts();
    roadAlerts.value = alerts;
    updateMarkers();
  } catch (error) {
    console.error('Erreur lors du chargement des signalements:', error);
  } finally {
    isLoading.value = false;
  }
};

const updateMarkers = () => {
  if (!map) return;

  // Supprimer les anciens marqueurs
  markers.forEach(marker => marker.remove());
  markers = [];

  // Ajouter les nouveaux marqueurs
  filteredAlerts.value.forEach(alert => {
    // Utiliser lattitude/longitude comme dans l'API response
    const lat = alert.latitude || (alert as any).lattitude;
    const lng = alert.longitude;

    if (!lat || !lng) return;

    const icon = L.divIcon({
      className: 'custom-icon',
      html: `<div class="marker-pin"><i class="fas fa-hammer"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map!);
    marker.on('click', () => openSheet(alert));
    markers.push(marker);
  });
};

const openSheet = (alert: RoadAlert) => {
  selectedAlert.value = alert;
  isSheetActive.value = true;

  // Centrer la carte sur le marqueur sélectionné
  if (map) {
    const lat = alert.latitude || (alert as any).lattitude;
    const lng = alert.longitude;
    map.flyTo([lat - 0.005, lng], 15);
  }
};

const closeSheet = () => {
  isSheetActive.value = false;
  selectedAlert.value = null;
};

const centerMap = () => {
  if (map) {
    map.flyTo([-18.8792, 47.5079], 13);
  }
};

const toggleMenu = () => {
  console.log('Menu toggled');
};

const handleAddAlert = () => {
  console.log('Add new alert');
  // TODO: Naviguer vers une page de création d'alerte
};

const handleTabClick = (tabName: string) => {
  activeTab.value = tabName;
  if (tabName === 'stats') {
    router.push('/dashboard');
  }
  // TODO: Navigate to other pages when ready
};

onMounted(async () => {
  initMap();
  await loadRoadAlerts();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
