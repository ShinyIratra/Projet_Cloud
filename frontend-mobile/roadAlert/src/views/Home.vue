<template>
  <ion-page class="home-page">
    <ion-content :fullscreen="true" class="home-content">
      <!-- MAP -->
      <div id="map" ref="mapContainer"></div>

      <!-- TOP NAVIGATION & SEARCH -->
      <div class="floating-search space-y-3">
        <div class="glass-search-bar">
          <div class="search-icon-wrapper">
             <i class="fas fa-search"></i>
          </div>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher à Antananarivo..." 
            class="search-input"
          />
          
          <div class="search-actions">
            <!-- Bouton Notifications -->
            <button 
              v-if="isUserConnected"
              @click="toggleNotifications"
              class="icon-btn notification-btn"
            >
              <i class="fas fa-bell"></i>
              <span v-if="unreadNotificationsCount > 0" class="badge">
                {{ unreadNotificationsCount }}
              </span>
            </button>
            
            <div class="user-menu-container">
              <!-- Avatar par défaut si non connecté -->
              <div 
                v-if="!isUserConnected"
                @click="router.push('/login')"
                class="avatar-placeholder"
              >
                <i class="fas fa-user"></i>
              </div>
              
              <!-- Avatar si connecté -->
              <div 
                v-else
                class="user-avatar"
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
      </div>
        
        <!-- Quick Filters -->
        <div class="filter-scroll-container">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="[
              'filter-chip',
              activeFilter === filter.value ? 'active' : ''
            ]"
          >
            <i :class="`fas ${filter.icon}`"></i> {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- FLOATING ACTIONS (Right side) -->
      <div class="side-floating-actions">
        <button class="action-button glass-btn" @click="centerMap">
          <i class="fas fa-crosshairs"></i>
        </button>
        <button class="action-button primary-btn" @click="handleAddAlert">
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
            <p class="indicator-text">Cliquez n'importe où pour placer le signalement</p>
          </div>
          <button @click="closeCreateMode" class="cancel-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- MARKER CENTRAL EN MODE CRÉATION -->
      <div v-if="isCreateMode && !showCreateModal" class="center-marker">
        <div class="marker-pin-center">
          <i class="fas fa-map-marker-alt"></i>
        </div>
      </div>

      <!-- PANNEAU DE NOTIFICATIONS -->
      <NotificationsPanel
        :isOpen="showNotifications"
        :userUID="userUID"
        @close="showNotifications = false"
        @notificationClick="handleNotificationClick"
        ref="notificationsPanelRef"
      />

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
import { fetchUnreadNotifications, type Notification } from '../utils/notificationApi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Home.css';
import RoadAlertDetail from '../components/RoadAlertDetail.vue';
import CreateRoadAlert from '../components/CreateRoadAlert.vue';
import BottomNavBar from '../components/BottomNavBar.vue';
import NotificationsPanel from '../components/NotificationsPanel.vue';

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
const showNotifications = ref(false);
const unreadNotificationsCount = ref(0);
const notificationsPanelRef = ref<any>(null);

let map: L.Map | null = null;
let markers: L.Marker[] = [];
let tempMarker: L.Marker | null = null;
let locationMarker: L.Marker | null = null;

const filters = [
  { value: 'all', label: 'Tous', icon: 'fa-list' },
  { value: 'nouveau', label: 'Nouveau', icon: 'fa-exclamation-circle' },
  { value: 'en_cours', label: 'Travaux', icon: 'fa-hammer' },
  { value: 'termine', label: 'Terminés', icon: 'fa-check-circle' },
];

const isUserConnected = ref(false);

const checkUserConnection = () => {
  const token = localStorage.getItem('authToken');
  isUserConnected.value = !!token;
};

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

onIonViewDidEnter(async () => {
  checkUserConnection();
  if (isUserConnected.value) {
    loadUserInfo();
    await loadUnreadNotificationsCount();
  }

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
    if (isCreateMode.value && !showCreateModal.value) {
      // Mode création : utiliser le centre de la carte
      const center = map!.getCenter();
      placeTempMarker(center);
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

    // Déterminer le style en fonction du statut
    const status = (alert.Statut || alert.status || 'nouveau').toLowerCase();
    
    let statusClass = 'nouveau'; // Rouge par défaut
    let iconClass = 'fa-exclamation';

    if (status.includes('cours')) {
      statusClass = 'en-cours'; // Orange
      iconClass = 'fa-tools';
    } else if (status.includes('termin') || status.includes('clotur')) {
      statusClass = 'termine'; // Vert
      iconClass = 'fa-check';
    }

    const icon = L.divIcon({
      className: 'custom-icon',
      html: `<div class="marker-pin ${statusClass}"><i class="fas ${iconClass}"></i></div>`,
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
  if (!map) return;

  // Vérifier si la géolocalisation est disponible
  if (!navigator.geolocation) {
    console.warn('La géolocalisation n\'est pas supportée par votre navigateur');
    // Fallback : centrer sur Antananarivo
    map.flyTo([-18.8792, 47.5079], 13);
    return;
  }

  // Obtenir la position actuelle
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (!map) return;

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Supprimer l'ancien marqueur de localisation s'il existe
      if (locationMarker) {
        locationMarker.remove();
      }

      // Créer un marqueur de localisation avec une icône personnalisée
      const locationIcon = L.divIcon({
        className: 'location-marker-icon',
        html: `
          <div class="location-marker-pulse">
            <div class="location-marker-inner">
              <i class="fas fa-location-arrow"></i>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Ajouter le marqueur à la carte
      locationMarker = L.marker([userLat, userLng], { icon: locationIcon }).addTo(map);

      // Animer la carte vers la position
      map.flyTo([userLat, userLng], 16, {
        duration: 1.5 // Durée de l'animation en secondes
      });

      // Faire disparaître le marqueur après l'animation
      setTimeout(() => {
        if (locationMarker) {
          // Ajouter une classe pour l'animation de disparition
          const markerElement = locationMarker.getElement();
          if (markerElement) {
            markerElement.classList.add('fade-out');
          }
          
          // Supprimer complètement le marqueur après l'animation
          setTimeout(() => {
            if (locationMarker) {
              locationMarker.remove();
              locationMarker = null;
            }
          }, 500); // Correspond à la durée de l'animation CSS
        }
      }, 2000); // Attendre 2 secondes après la fin du flyTo (1.5s + 0.5s)
    },
    (error) => {
      console.error('Erreur de géolocalisation:', error);
      
      // Messages d'erreur selon le type
      let errorMessage = 'Impossible d\'obtenir votre position';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permission de géolocalisation refusée';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Position non disponible';
          break;
        case error.TIMEOUT:
          errorMessage = 'Délai de géolocalisation dépassé';
          break;
      }
      
      console.warn(errorMessage);
      
      // Fallback : centrer sur Antananarivo
      if (map) {
        map.flyTo([-18.8792, 47.5079], 13);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
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

// Fonction pour récupérer l'UID de l'utilisateur
const userUID = computed(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.UID || user.uid || '';
    } catch (e) {
      return '';
    }
  }
  return '';
});

// Charger le nombre de notifications non lues
const loadUnreadNotificationsCount = async () => {
  if (!userUID.value) return;
  
  try {
    const notifications = await fetchUnreadNotifications(userUID.value);
    unreadNotificationsCount.value = notifications.length;
  } catch (error) {
    console.error('Erreur lors du chargement des notifications:', error);
  }
};

// Toggle panneau de notifications
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

// Gérer le clic sur une notification
const handleNotificationClick = (notification: Notification) => {
  // Fermer le panneau de notifications
  showNotifications.value = false;
  
  // Trouver l'alerte correspondante
  const alert = roadAlerts.value.find(a => a.id === notification.roadAlertId);
  if (alert) {
    selectedAlert.value = alert;
    isSheetActive.value = true;
    
    // Centrer la carte sur l'alerte
    if (map && alert.lattitude && alert.longitude) {
      map.flyTo([alert.lattitude, alert.longitude], 15);
    }
  }
  
  // Rafraîchir le nombre de notifications non lues
  loadUnreadNotificationsCount();
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
  showCreateModal.value = true;
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
  
  // Charger les notifications si l'utilisateur est connecté
  if (isUserConnected.value) {
    await loadUnreadNotificationsCount();
    
    // Rafraîchir les notifications toutes les 30 secondes
    setInterval(() => {
      if (isUserConnected.value) {
        loadUnreadNotificationsCount();
      }
    }, 30000);
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
/* Top Floating Search Bar */
.floating-search {
  position: absolute;
  top: max(20px, env(safe-area-inset-top) + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.glass-search-bar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 30px;
  padding: 8px 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  position: relative;
  z-index: 20; 
}

.search-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #8E8E93;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 8px;
  font-size: 15px;
  font-weight: 500;
  color: #1c1c1e;
  outline: none;
}

.search-input::placeholder {
  color: #8E8E93;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1c1c1e;
  position: relative;
  transition: background 0.2s;
  cursor: pointer;
}

.icon-btn:hover, .icon-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.notification-btn i {
  font-size: 1.3rem;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background-color: #ff3b30;
  color: white;
  border-radius: 9px;
  border: 2px solid white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 5;
}

.user-menu-container {
  position: relative;
  z-index: 50; /* Ensure it's above other elements in the search bar */
}

/* User Avatar */
.avatar-placeholder, .user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  background: #E5E5EA;
  color: #8E8E93;
}

.user-avatar {
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Filter Chips with Horizontal Scroll */
.filter-scroll-container {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 2px 10px 2px;
  -ms-overflow-style: none;
  scrollbar-width: none;
  position: relative;
  z-index: 10;
}

.filter-scroll-container::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  border: none;
  
  /* Glass Morphism */
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); 
  color: #48484a;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.filter-chip i {
  font-size: 12px;
}

.filter-chip.active {
  background: #007AFF; /* Apple Blue */
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transform: translateY(-1px);
}

/* Floating Action Buttons */
.side-floating-actions {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 900;
}

.action-button {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;

  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.action-button:active {
  transform: scale(0.9);
}

.glass-btn {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: #1c1c1e;
}

.primary-btn {
  background: #007AFF;
  color: white;
}

/* User Menu Dropdown Adjustment */
.user-menu-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 240px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  padding: 16px;
  z-index: 9999;
  transform-origin: top right;
  overflow: hidden;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .glass-search-bar, .user-menu-dropdown {
    background: rgba(30, 30, 30, 0.95);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
  
  .search-input {
    color: white;
  }
  
  .search-input::placeholder, .icon-btn {
    color: #98989d;
  }
  
  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .filter-chip {
    background: rgba(40, 40, 40, 0.65);
    color: #ebebf5;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  
  .glass-btn {
    background: rgba(40, 40, 40, 0.8);
    color: white;
  }
  
  .badge {
    border-color: #1c1c1e;
  }
}
</style>
