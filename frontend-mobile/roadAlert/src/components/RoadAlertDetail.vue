<template>
  <div id="bottom-sheet" :class="{ active: isOpen && alert }" @click.self="close">
    <div class="sheet-handle" @click="close"></div>
    
    <div class="px-6 pb-40" v-if="alert">
      <div class="flex justify-between items-start mb-4">
        <div>
          <span 
            :class="['text-[10px] font-black uppercase px-2 py-1 rounded-md', getStatusClass(alert.status)]"
          >
            {{ getStatusLabel(alert.status) }}
          </span>
          <h2 class="text-xl font-extrabold text-slate-800 mt-2">
            {{ alert.concerned_entreprise }}
          </h2>
          <p class="text-xs text-slate-400 font-medium">
            Signalé le {{ formatDate(alert.date_alert) }}
          </p>
        </div>
        <button @click="close" class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-slate-50 p-3 rounded-xl">
          <p class="text-[10px] uppercase font-bold text-slate-400">Surface</p>
          <p class="font-bold text-slate-700">{{ alert.surface }} m²</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl">
          <p class="text-[10px] uppercase font-bold text-slate-400">Niveau</p>
          <p class="font-bold text-slate-700">{{ alert.niveau || 1 }} / 10</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl">
          <p class="text-[10px] uppercase font-bold text-slate-400">Prix/m²</p>
          <p class="font-bold text-slate-700">{{ formatBudget(alert.prix_m2 || 0) }}</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl">
          <p class="text-[10px] uppercase font-bold text-slate-400">Budget</p>
          <p class="font-bold text-green-600">{{ formatBudget(alert.budget) }}</p>
        </div>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl mb-6">
        <p class="text-[10px] uppercase font-bold text-slate-400 mb-2">Coordonnées GPS</p>
        <p class="text-xs font-mono text-slate-600">
          <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
          {{ getLatitude(alert) }}, {{ alert.longitude }}
        </p>
      </div>

      <!-- Galerie de photos style Pinterest -->
      <div v-if="alert.photos && alert.photos.length > 0" class="mb-6">
        <p class="text-[10px] uppercase font-bold text-slate-400 mb-3 flex items-center">
          <i class="fas fa-images mr-2"></i> 
          Photos ({{ alert.photos.length }})
        </p>
        
        <!-- Grille responsive style Pinterest -->
        <div class="photos-grid-pinterest">
          <div 
            v-for="(photo, index) in alert.photos" 
            :key="index"
            class="photo-card"
            :class="{ 'photo-featured': index === 0 }"
            @click="viewPhoto(photo)"
          >
            <div class="photo-wrapper">
              <img :src="photo" :alt="`Photo ${index + 1}`" class="photo-img" />
              <div class="photo-overlay">
                <i class="fas fa-search-plus"></i>
              </div>
              <span v-if="index === 0" class="photo-badge-featured">
                <i class="fas fa-star mr-1"></i>Principale
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Si pas de photo, afficher un placeholder -->
      <div v-else class="photo-placeholder mb-6">
        <i class="fas fa-image text-slate-300 text-5xl mb-2"></i>
        <p class="text-slate-400 text-xs">Aucune photo disponible</p>
      </div>

      <div class="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <i class="fas fa-hard-hat"></i>
          </div>
          <div>
            <p class="text-[10px] font-bold text-blue-400 uppercase leading-none">Entreprise</p>
            <p class="font-bold text-blue-900">{{ alert.concerned_entreprise }}</p>
          </div>
        </div>
        <i class="fas fa-chevron-right text-blue-300"></i>
      </div>

    </div>

    <!-- Modal de visualisation de photo en plein écran -->
    <div 
      v-if="viewingPhoto" 
      class="photo-viewer"
      @click="closePhotoViewer"
    >
      <div class="photo-viewer-content" @click.stop>
        <button class="photo-viewer-close" @click="closePhotoViewer">
          <i class="fas fa-times"></i>
        </button>
        <div class="photo-viewer-image-wrapper" @click="closePhotoViewer">
          <img :src="viewingPhoto" alt="Photo en plein écran" class="photo-viewer-image" @click.stop />
        </div>
        <p class="photo-viewer-hint">Tapez n'importe où pour fermer</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type RoadAlert } from '../utils/roadAlertApi';

interface Props {
  isOpen: boolean;
  alert: RoadAlert | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const viewingPhoto = ref<string | null>(null);

const close = () => {
  emit('close');
};

const getLatitude = (alert: RoadAlert) => {
  return alert.lattitude || alert.latitude || 0;
};

const getStatusClass = (status: string) => {
  if (!status) return 'bg-gray-100 text-gray-700';
  const normStatus = status.toLowerCase().replace(/é|è/g, 'e').replace(/\s/g, '_');
  const classes: Record<string, string> = {
    'nouveau': 'bg-red-100 text-red-700',
    'en_cours': 'bg-blue-100 text-blue-700',
    'termine': 'bg-green-100 text-green-700',
  };
  return classes[normStatus] || 'bg-gray-100 text-gray-700';
};

const getStatusLabel = (status: string) => {
  if (!status) return 'Inconnu';
  const normStatus = status.toLowerCase().replace(/é|è/g, 'e').replace(/\s/g, '_');
  const labels: Record<string, string> = {
    'nouveau': 'Nouveau',
    'en_cours': 'En cours',
    'termine': 'Terminé',
  };
  return labels[normStatus] || status;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatBudget = (budget: number) => {
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 }).format(budget);
};

const viewPhoto = (photo: string) => {
  viewingPhoto.value = photo;
};

const closePhotoViewer = () => {
  viewingPhoto.value = null;
};
</script>

<style scoped>
/* Bottom Sheet - Design Mobile */
#bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 24px 24px 0 0;
  z-index: 2000;
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.33, 1, 0.68, 1);
  box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);
}

#bottom-sheet.active {
  transform: translateY(0);
}

.sheet-handle {
  width: 40px;
  height: 5px;
  background: #e2e8f0;
  border-radius: 10px;
  margin: 12px auto;
  cursor: pointer;
}

/* Photo Viewer (Modal plein écran) */
.photo-viewer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
  padding: 20px;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.photo-viewer-content {
  position: relative;
  width: 100%;
  max-width: 1200px;
  height: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.photo-viewer-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.photo-viewer-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.photo-viewer-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.photo-viewer-image {
  max-width: 100%;
  max-height: calc(100% - 40px);
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  cursor: default;
}

.photo-viewer-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  pointer-events: none;
}

/* Responsive pour tablettes */
@media (min-width: 768px) {
  .photo-viewer-close {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
  
  .photo-viewer-image {
    max-height: 85vh;
    border-radius: 16px;
  }
  
  .photo-viewer-hint {
    font-size: 14px;
    padding: 10px 20px;
  }
}

/* Grille Photos Style Pinterest */
.photos-grid-pinterest {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.photo-card {
  position: relative;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  background: #f8fafc;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.photo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Photo principale prend toute la largeur */
.photo-featured {
  grid-column: span 2;
}

.photo-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

/* Ratio différent pour la photo principale */
.photo-featured .photo-img {
  aspect-ratio: 16/10;
}

.photo-card:not(.photo-featured) .photo-img {
  aspect-ratio: 1;
}

.photo-card:hover .photo-img {
  transform: scale(1.05);
}

/* Overlay au survol */
.photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-size: 24px;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

/* Badge photo principale */
.photo-badge-featured {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  z-index: 2;
  display: flex;
  align-items: center;
}

/* Placeholder pour les signalements sans photos */
.photo-placeholder {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed #e2e8f0;
  border-radius: 20px;
  padding: 48px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Utility classes */
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.pb-10 { padding-bottom: 2.5rem; }
.pb-40 { padding-bottom: 10rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-6 { margin-top: 1.5rem; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.space-x-3 > * + * { margin-left: 0.75rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.w-8 { width: 2rem; }
.h-8 { height: 2rem; }
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
.h-40 { height: 10rem; }
.h-52 { height: 13rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-5xl { font-size: 3rem; line-height: 1; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }
.font-medium { font-weight: 500; }
.font-mono { font-family: ui-monospace, monospace; }
.uppercase { text-transform: uppercase; }
.leading-none { line-height: 1; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-full { border-radius: 9999px; }
.overflow-hidden { overflow: hidden; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.flex { display: flex; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.aspect-square { aspect-ratio: 1; }
.object-cover { object-fit: cover; }
.cursor-pointer { cursor: pointer; }
.hover\:opacity-80:hover { opacity: 0.8; }
.bg-slate-50 { background-color: #f8fafc; }
.bg-slate-100 { background-color: #f1f5f9; }
.bg-slate-400 { color: #94a3b8; }
.bg-slate-600 { color: #475569; }
.bg-slate-700 { color: #334155; }
.bg-slate-800 { color: #1e293b; }
.bg-slate-900 { background-color: #0f172a; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-blue-400 { color: #60a5fa; }
.bg-blue-600 { background-color: #2563eb; }
.bg-blue-900 { color: #1e3a8a; }
.text-blue-300 { color: #93c5fd; }
.text-blue-600 { color: #2563eb; }
.text-green-600 { color: #16a34a; }
.text-slate-300 { color: #cbd5e1; }
.text-slate-400 { color: #94a3b8; }
.text-slate-600 { color: #475569; }
.text-slate-700 { color: #334155; }
.text-slate-800 { color: #1e293b; }
.text-white { color: #ffffff; }
.w-full { width: 100%; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.active\:scale-95:active { transform: scale(0.95); }
.transition { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
</style>
