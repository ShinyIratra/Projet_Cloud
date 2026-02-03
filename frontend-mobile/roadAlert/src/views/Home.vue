<template>
  <ion-page class="home-page">
    <ion-content :fullscreen="true" class="home-content">
      <!-- MAP -->
      <div id="map" ref="mapContainer"></div>

      <!-- TOP NAVIGATION & SEARCH -->
      <div class="floating-search space-y-3">
        <div class="glass-morphism rounded-2xl p-2 flex items-center shadow-lg border border-white">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher à Antananarivo..." 
            class="flex-grow bg-transparent border-none focus:ring-0 text-sm font-semibold px-2 text-slate-700 placeholder-slate-400"
          />
          <div class="relative">
            <!-- Avatar par défaut si non connecté -->
            <div 
              v-if="!isUserConnected"
              @click="router.push('/login')"
              class="w-10 h-10 rounded-full overflow-hidden bg-slate-200 cursor-pointer hover:ring-2 hover:ring-slate-300 transition-all flex items-center justify-center"
            >
              <i class="fas fa-user text-slate-400 text-sm"></i>
            </div>
            
            <!-- Avatar si connecté -->
            <div 
              v-else
              class="w-10 h-10 rounded-full overflow-hidden bg-blue-100 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
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
        <div class="flex space-x-2 overflow-x-auto pb-2 no-scrollbar" style="padding-left: 0; padding-right: 80px;">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="[
              'px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm transition-all',
              activeFilter === filter.value 
                ? 'bg-slate-700 text-white' 
                : 'glass-morphism text-slate-600 border border-white hover:bg-white/90'
            ]"
          >
            <i :class="`fas ${filter.icon} mr-1`"></i> {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- FLOATING ACTIONS (Right side) -->
      <div class="fixed right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col space-y-3">
        <button class="action-button bg-white text-slate-700 hover:bg-slate-50" @click="centerMap">
          <i class="fas fa-crosshairs text-lg"></i>
        </button>
        <button class="action-button bg-blue-600 text-white hover:bg-blue-700" @click="handleAddAlert">
          <i class="fas fa-plus text-lg"></i>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { IonContent, IonPage, IonSpinner, onIonViewDidEnter, onIonViewWillLeave } from '@ionic/vue';
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
  { value: 'en_cours', label: 'Travaux', icon: 'fa-hammer' },
  { value: 'termine', label: 'Terminés', icon: 'fa-check-circle' },
];

const isUserConnected = computed(() => {
  const token = localStorage.getItem('authToken');
  return !!token;
});

const filteredAlerts = computed(() => {
  let alerts = roadAlerts.value;
  
  // Filtrer par statut
  if (activeFilter.value !== 'all') {
    alerts = alerts.filter(alert => {
      const s = (alert.status || '').toLowerCase().replace(/é|è/g, 'e').replace(/\s/g, '_');
      const f = activeFilter.value.toLowerCase().replace(/é|è/g, 'e').replace(/\s/g, '_');
      return s === f;
    });
  }
  
  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    alerts = alerts.filter(alert => 
      (alert.concerned_entreprise || '').toLowerCase().includes(query)
    );
  }
  
  return alerts;
});

onIonViewDidEnter(() => {
  if (map) {
    // Forcer le recalcul de la taille de la carte
    setTimeout(() => {
      map?.invalidateSize();
      // Forcer le re-rendu des tuiles
      map?.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.redraw();
        }
      });
    }, 100);
  }
});

onIonViewWillLeave(() => {
  // Nettoyer les événements quand on quitte la vue
  if (showUserMenu.value) showUserMenu.value = false;
  if (isSheetActive.value) closeSheet();
});

const initMap = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, { 
    zoomControl: false,
    preferCanvas: true // Améliore les performances
  }).setView([-18.8792, 47.5079], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    updateWhenIdle: false,
    keepBuffer: 2
  }).addTo(map);

  // S'assurer que la carte a la bonne taille après l'initialisation
  setTimeout(() => {
    map?.invalidateSize();
  }, 200);

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

// Watcher pour mettre à jour les marqueurs quand les filtres changent
import { watch } from 'vue';
watch([activeFilter, searchQuery], () => {
  updateMarkers();
});

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
  // Attendre que le DOM soit complètement rendu avant d'initialiser la carte
  setTimeout(() => {
    initMap();
  }, 100);
  await loadRoadAlerts();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
