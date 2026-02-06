<template>
  <div class="photo-upload-section">
    <!-- Header -->
    <div class="section-header">
      <label class="section-label">
        <i class="fas fa-camera mr-2 text-blue-500"></i> 
        Photos du problème
      </label>
      <span class="photo-count">{{ photos.length }}/5</span>
    </div>

    <!-- Photos Grid -->
    <div class="photos-grid">
      <!-- Photos existantes -->
      <div 
        v-for="(photo, index) in photos" 
        :key="index" 
        class="photo-item"
      >
        <img :src="photo.webPath || photo.dataUrl" :alt="`Photo ${index + 1}`" />
        <button 
          type="button" 
          @click="removePhoto(index)" 
          class="remove-photo-btn"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Bouton d'ajout -->
      <div 
        v-if="photos.length < maxPhotos" 
        class="add-photo-btn"
        @click="showPhotoOptions = true"
      >
        <i class="fas fa-plus"></i>
        <span>Ajouter</span>
      </div>
    </div>

    <!-- Aide -->
    <p class="photo-help">
      <i class="fas fa-info-circle"></i>
      Ajoutez jusqu'à 5 photos pour illustrer le problème
    </p>

    <!-- Modal Options Photo -->
    <div v-if="showPhotoOptions" class="photo-options-overlay" @click="showPhotoOptions = false">
      <div class="photo-options-modal" @click.stop>
        <h3 class="modal-title">Ajouter une photo</h3>
        
        <button @click="takePhoto" class="option-btn">
          <div class="option-icon camera">
            <i class="fas fa-camera"></i>
          </div>
          <div class="option-text">
            <span class="option-label">Prendre une photo</span>
            <span class="option-desc">Utiliser l'appareil photo</span>
          </div>
        </button>

        <button @click="pickFromGallery" class="option-btn">
          <div class="option-icon gallery">
            <i class="fas fa-images"></i>
          </div>
          <div class="option-text">
            <span class="option-label">Galerie</span>
            <span class="option-desc">Choisir depuis la galerie</span>
          </div>
        </button>

        <button @click="showPhotoOptions = false" class="cancel-btn">
          Annuler
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface PhotoData {
  webPath?: string;
  dataUrl?: string;
  base64?: string;
  format: string;
}

const props = defineProps<{
  modelValue: PhotoData[];
  maxPhotos?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', photos: PhotoData[]): void;
}>();

const maxPhotos = computed(() => props.maxPhotos || 5);
const photos = computed(() => props.modelValue || []);
const showPhotoOptions = ref(false);

// Prendre une photo avec l'appareil photo
const takePhoto = async () => {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 1024,
      height: 1024,
      correctOrientation: true
    });

    addPhoto(photo);
    showPhotoOptions.value = false;
  } catch (error: any) {
    console.error('Erreur prise de photo:', error);
    // L'utilisateur a annulé ou erreur de permission
    if (error.message !== 'User cancelled photos app') {
      alert('Impossible d\'accéder à l\'appareil photo. Vérifiez les permissions.');
    }
    showPhotoOptions.value = false;
  }
};

// Choisir depuis la galerie
const pickFromGallery = async () => {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      width: 1024,
      height: 1024
    });

    addPhoto(photo);
    showPhotoOptions.value = false;
  } catch (error: any) {
    console.error('Erreur sélection galerie:', error);
    if (error.message !== 'User cancelled photos app') {
      alert('Impossible d\'accéder à la galerie. Vérifiez les permissions.');
    }
    showPhotoOptions.value = false;
  }
};

// Sélection multiple depuis galerie
const pickMultipleFromGallery = async () => {
  try {
    const result = await Camera.pickImages({
      quality: 80,
      width: 1024,
      height: 1024,
      limit: maxPhotos.value - photos.value.length
    });

    for (const photo of result.photos) {
      if (photos.value.length < maxPhotos.value) {
        const photoData: PhotoData = {
          webPath: photo.webPath,
          format: photo.format
        };
        emit('update:modelValue', [...photos.value, photoData]);
      }
    }
    showPhotoOptions.value = false;
  } catch (error: any) {
    console.error('Erreur sélection multiple:', error);
    showPhotoOptions.value = false;
  }
};

// Ajouter une photo
const addPhoto = (photo: Photo) => {
  if (photos.value.length >= maxPhotos.value) {
    alert(`Maximum ${maxPhotos.value} photos autorisées`);
    return;
  }

  const photoData: PhotoData = {
    dataUrl: photo.dataUrl,
    webPath: photo.webPath,
    base64: photo.base64String,
    format: photo.format
  };

  emit('update:modelValue', [...photos.value, photoData]);
};

// Supprimer une photo
const removePhoto = (index: number) => {
  const newPhotos = [...photos.value];
  newPhotos.splice(index, 1);
  emit('update:modelValue', newPhotos);
};

// Obtenir les photos en base64 pour l'envoi
const getPhotosBase64 = (): string[] => {
  return photos.value
    .filter(p => p.dataUrl || p.base64)
    .map(p => {
      if (p.base64) return p.base64;
      if (p.dataUrl) {
        // Extraire le base64 du dataUrl
        const base64 = p.dataUrl.split(',')[1];
        return base64;
      }
      return '';
    })
    .filter(b => b !== '');
};

// Exposer pour le parent
defineExpose({
  getPhotosBase64
});
</script>

<style scoped>
.photo-upload-section {
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.photo-count {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: #f1f5f9;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-photo-btn:hover {
  background: #ef4444;
}

.add-photo-btn {
  aspect-ratio: 1;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-photo-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.add-photo-btn i {
  font-size: 20px;
  color: #94a3b8;
}

.add-photo-btn span {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
}

.photo-help {
  margin-top: 12px;
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Modal Options */
.photo-options-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}

.photo-options-modal {
  background: white;
  border-radius: 24px 24px 0 0;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  text-align: center;
  margin-bottom: 20px;
}

.option-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: none;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-btn:hover {
  background: #f1f5f9;
}

.option-btn:active {
  transform: scale(0.98);
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.option-icon.camera {
  background: #dbeafe;
  color: #3b82f6;
}

.option-icon.gallery {
  background: #dcfce7;
  color: #22c55e;
}

.option-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.option-label {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.option-desc {
  font-size: 12px;
  color: #94a3b8;
}

.cancel-btn {
  width: 100%;
  padding: 16px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
}

.cancel-btn:hover {
  color: #1e293b;
}
</style>
