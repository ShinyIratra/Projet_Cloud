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
          <div class="relative">
            <div 
              class="w-8 h-8 rounded-full overflow-hidden bg-blue-100 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
              @click="toggleUserMenu"
            >
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user">
            </div>
            
            <!-- User Menu Dropdown -->
            <transition name="fade-slide">
              <div 
                v-if="showUserMenu" 
                class="user-menu-dropdown"
              >
                <div class="user-menu-header">
                  <div class="w-12 h-12 rounded-full overflow-hidden bg-blue-100 mb-2">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user">
                  </div>
                  <p class="user-name">{{ userName }}</p>
                  <p class="user-email">{{ userEmail }}</p>
                </div>
                <div class="user-menu-divider"></div>
                <button class="user-menu-item" @click="handleProfile">
                  <i class="fas fa-user"></i>
                  <span>Mon profil</span>
                </button>
                <button class="user-menu-item" @click="handleSettings">
                  <i class="fas fa-cog"></i>
                  <span>Paramètres</span>
                </button>
                <div class="user-menu-divider"></div>
                <button class="user-menu-item logout" @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Se déconnecter</span>
                </button>
              </div>
            </transition>
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
      <RoadAlertDetail 
        :isOpen="isSheetActive" 
        :alert="selectedAlert" 
        @close="closeSheet"
      />

      <!-- MODAL DE CRÉATION -->
      <CreateRoadAlert
        :isOpen="showCreateModal"
        :selectedLocation="tempMarkerLocation"
        @close="closeCreateMode"
        @clearLocation="clearTempMarker"
        @refresh="handleRefresh"
      />

      <!-- INDICATEUR MODE CRÉATION -->
      <div v-if="isCreateMode && !showCreateModal" class="creation-mode-indicator">
        <div class="indicator-content">
          <i class="fas fa-map-marker-alt pulse-icon"></i>
          <div>
            <p class="indicator-title">Mode création activé</p>
            <p class="indicator-text">Touchez la carte pour placer un marqueur</p>
          </div>
          <button @click="closeCreateMode" class="cancel-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- NAVIGATION BAR (Bottom Tabs) -->
      <BottomNavBar :activeTab="activeTab" />

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
import RoadAlertDetail from '../components/RoadAlertDetail.vue';
import CreateRoadAlert from '../components/CreateRoadAlert.vue';
import BottomNavBar from '../components/BottomNavBar.vue';

const router = useRouter();
const mapContainer = ref<HTMLElement | null>(null);
const searchQuery = ref('');
const isSheetActive = ref(false);
const selectedAlert = ref<RoadAlert | null>(null);
const activeFilter = ref('all');
const activeTab = ref('explorer');
const isLoading = ref(false);
const roadAlerts = ref<RoadAlert[]>([]);
const isCreateMode = ref(false); // Mode sélection d'emplacement actif
const showCreateModal = ref(false); // Afficher la modal de création
const tempMarkerLocation = ref<{ lat: number; lng: number } | null>(null);
const showUserMenu = ref(false);
const userName = ref('');
const userEmail = ref('');

let map: L.Map | null = null;
let markers: L.Marker[] = [];
let tempMarker: L.Marker | null = null;

const filters = [
  { value: 'all', label: 'Tous', icon: 'fa-list' },
  { value: 'nouveau', label: 'Nouveau', icon: 'fa-exclamation-circle' },
  { value: 'en_cours', label: 'En cours', icon: 'fa-hammer' },
  { value: 'termine', label: 'Terminés', icon: 'fa-check-circle' },
];

const filteredAlerts = computed(() => {
  if (activeFilter.value === 'all') return roadAlerts.value;
  return roadAlerts.value.filter(alert => alert.status === activeFilter.value);
});

const initMap = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, { zoomControl: false }).setView([-18.8792, 47.5079], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Gérer les clics sur la carte
  map.on('click', (e: L.LeafletMouseEvent) => {
    if (isCreateMode.value) {
      // Mode création : placer un marqueur temporaire
      placeTempMarker(e.latlng);
    } else {
      // Mode normal : fermer le bottom sheet
      if (isSheetActive.value) closeSheet();
      if (showUserMenu.value) showUserMenu.value = false;
    }
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
    // L'API retourne lattitude (avec double t) au lieu de latitude
    const lat = alert.lattitude || alert.latitude;
    const lng = alert.longitude;

    if (!lat || !lng) {
      console.log('Coordonnées manquantes pour:', alert);
      return;
    }

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
    const lat = alert.lattitude || alert.latitude;
    const lng = alert.longitude;
    if (lat && lng) {
      map.flyTo([lat - 0.005, lng], 15);
    }
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

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const handleProfile = () => {
  showUserMenu.value = false;
  router.push('/profile');
};

const handleSettings = () => {
  showUserMenu.value = false;
  console.log('Naviguer vers les paramètres');
  // TODO: Implémenter la navigation vers les paramètres
};

const handleLogout = () => {
  showUserMenu.value = false;
  
  // Supprimer les données d'authentification
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Rediriger vers la page de connexion
  router.push('/login');
};

const loadUserInfo = () => {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      userName.value = user.displayName || user.email?.split('@')[0] || 'Utilisateur';
      userEmail.value = user.email || '';
    } catch (error) {
      console.error('Erreur lors du chargement des infos utilisateur:', error);
    }
  }
};

const handleAddAlert = () => {
  // Vérifier si l'utilisateur est connecté
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    // Rediriger vers la page de connexion
    router.push('/login');
    return;
  }
  
  isCreateMode.value = true;
  closeSheet(); // Fermer le détail si ouvert
  // Ne pas ouvrir la modal tout de suite, attendre que l'utilisateur clique sur la carte
};

const closeCreateMode = () => {
  isCreateMode.value = false;
  showCreateModal.value = false;
  clearTempMarker();
};

const placeTempMarker = (latlng: L.LatLng) => {
  if (!map) return;

  // Supprimer l'ancien marqueur temporaire
  if (tempMarker) {
    tempMarker.remove();
  }

  // Créer un nouveau marqueur rouge pour indiquer la sélection
  const icon = L.divIcon({
    className: 'custom-icon',
    html: `<div class="marker-pin temp-marker"><i class="fas fa-map-marker-alt"></i></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  tempMarker = L.marker([latlng.lat, latlng.lng], { icon }).addTo(map);
  tempMarkerLocation.value = { lat: latlng.lat, lng: latlng.lng };
  
  // Ouvrir automatiquement la modal une fois l'emplacement sélectionné
  setTimeout(() => {
    showCreateModal.value = true;
  }, 100);
};

const clearTempMarker = () => {
  if (tempMarker) {
    tempMarker.remove();
    tempMarker = null;
  }
  tempMarkerLocation.value = null;
};

const handleRefresh = async () => {
  await loadRoadAlerts();
};

onMounted(async () => {
  loadUserInfo();
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
