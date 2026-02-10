<template>
  <div class="photo-gallery">
    <div class="gallery-header">
      <h3>Photos du signalement</h3>
      <ion-button
        v-if="canAdd && photos.length < maxPhotos"
        size="small"
        @click="$emit('add')"
      >
        <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
        Ajouter
      </ion-button>
    </div>

    <div v-if="photos.length > 0" class="gallery-grid">
      <div
        v-for="(photo, index) in photos"
        :key="index"
        class="gallery-item"
        @click="openPreview(index)"
      >
        <img :src="photo" :alt="`Photo ${index + 1}`" class="gallery-image" />
        
        <!-- Badge photo principale -->
        <ion-badge v-if="photo === mainPhoto" color="primary" class="main-badge">
          Principale
        </ion-badge>

        <!-- Actions -->
        <div v-if="canEdit" class="gallery-actions">
          <ion-button
            v-if="photo !== mainPhoto"
            fill="clear"
            size="small"
            @click.stop="$emit('set-main', photo)"
          >
            <ion-icon slot="icon-only" :icon="starOutline" color="warning"></ion-icon>
          </ion-button>
          <ion-button
            fill="clear"
            size="small"
            @click.stop="$emit('delete', photo)"
          >
            <ion-icon slot="icon-only" :icon="trashOutline" color="danger"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>

    <div v-else class="empty-gallery">
      <ion-icon :icon="imagesOutline" class="empty-icon"></ion-icon>
      <p>Aucune photo</p>
      <ion-button v-if="canAdd" @click="$emit('add')">
        Ajouter la première photo
      </ion-button>
    </div>

    <!-- Modal de prévisualisation -->
    <ion-modal :is-open="showPreview" @did-dismiss="closePreview">
      <ion-header>
        <ion-toolbar>
          <ion-title>Photo {{ currentPhotoIndex + 1 }} / {{ photos.length }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePreview">Fermer</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="preview-content">
        <div class="preview-container">
          <img
            v-if="photos[currentPhotoIndex]"
            :src="photos[currentPhotoIndex]"
            alt="Preview"
            class="preview-image"
          />
          
          <!-- Navigation -->
          <ion-button
            v-if="currentPhotoIndex > 0"
            class="nav-button nav-prev"
            fill="clear"
            @click="previousPhoto"
          >
            <ion-icon slot="icon-only" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
          <ion-button
            v-if="currentPhotoIndex < photos.length - 1"
            class="nav-button nav-next"
            fill="clear"
            @click="nextPhoto"
          >
            <ion-icon slot="icon-only" :icon="chevronForwardOutline"></ion-icon>
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonButton,
  IonIcon,
  IonBadge,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
} from '@ionic/vue';
import {
  addCircleOutline,
  trashOutline,
  starOutline,
  imagesOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

interface Props {
  photos: string[];
  mainPhoto?: string;
  canAdd?: boolean;
  canEdit?: boolean;
  maxPhotos?: number;
}

const props = withDefaults(defineProps<Props>(), {
  photos: () => [],
  mainPhoto: '',
  canAdd: true,
  canEdit: true,
  maxPhotos: 5,
});

defineEmits<{
  'add': [];
  'delete': [photo: string];
  'set-main': [photo: string];
}>();

const showPreview = ref(false);
const currentPhotoIndex = ref(0);

/**
 * Ouvre la prévisualisation d'une photo
 */
const openPreview = (index: number) => {
  currentPhotoIndex.value = index;
  showPreview.value = true;
};

/**
 * Ferme la prévisualisation
 */
const closePreview = () => {
  showPreview.value = false;
};

/**
 * Navigation vers la photo précédente
 */
const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--;
  }
};

/**
 * Navigation vers la photo suivante
 */
const nextPhoto = () => {
  if (currentPhotoIndex.value < props.photos.length - 1) {
    currentPhotoIndex.value++;
  }
};
</script>

<style scoped>
.photo-gallery {
  width: 100%;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.gallery-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--ion-color-light);
  transition: transform 0.2s ease;
}

.gallery-item:hover {
  transform: scale(1.05);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  z-index: 5;
}

.gallery-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 4px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-item:hover .gallery-actions {
  opacity: 1;
}

.empty-gallery {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background-color: var(--ion-color-light);
  border-radius: 12px;
}

.empty-icon {
  font-size: 64px;
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

.empty-gallery p {
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

/* Preview Modal */
.preview-content {
  --background: black;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  --background: rgba(0, 0, 0, 0.6);
  --color: white;
  font-size: 32px;
}

.nav-prev {
  left: 16px;
}

.nav-next {
  right: 16px;
}
</style>
