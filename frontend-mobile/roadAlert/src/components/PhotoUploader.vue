<template>
  <div class="photo-uploader">
    <!-- Zone de prévisualisation de la photo -->
    <div class="photo-preview" @click="triggerFileInput">
      <img v-if="previewUrl" :src="previewUrl" :alt="altText" class="preview-image" />
      <div v-else class="placeholder">
        <ion-icon :icon="cameraOutline" class="camera-icon"></ion-icon>
        <p>{{ placeholderText }}</p>
      </div>
      
      <!-- Badge suppression si photo existe -->
      <ion-button
        v-if="previewUrl && showDeleteButton"
        class="delete-button"
        fill="clear"
        size="small"
        @click.stop="handleDelete"
      >
        <ion-icon slot="icon-only" :icon="closeCircle" color="danger"></ion-icon>
      </ion-button>
    </div>

    <!-- Input file caché -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      @change="handleFileSelect"
      style="display: none"
    />

    <!-- Information sur la taille -->
    <div v-if="showSizeInfo && imageSize" class="size-info">
      <ion-text color="medium">
        <small>Taille: {{ imageSize }}KB</small>
      </ion-text>
    </div>

    <!-- Message d'erreur -->
    <ion-text v-if="error" color="danger" class="error-message">
      <small>{{ error }}</small>
    </ion-text>

    <!-- Loader pendant la compression -->
    <div v-if="isCompressing" class="loading-overlay">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Compression en cours...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonIcon, IonButton, IonText, IonSpinner } from '@ionic/vue';
import { cameraOutline, closeCircle } from 'ionicons/icons';
import {
  compressAvatarImage,
  compressSignalementImage,
  getBase64Size,
  validateImageSize,
} from '../utils/imageCompression';

interface Props {
  modelValue?: string; // Image Base64
  type?: 'avatar' | 'signalement';
  placeholderText?: string;
  altText?: string;
  showDeleteButton?: boolean;
  showSizeInfo?: boolean;
  maxSizeKB?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'avatar',
  placeholderText: 'Ajouter une photo',
  altText: 'Photo',
  showDeleteButton: true,
  showSizeInfo: true,
  maxSizeKB: 500,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'upload': [base64: string];
  'delete': [];
  'error': [error: string];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string>(props.modelValue);
const imageSize = ref<number | null>(null);
const error = ref<string>('');
const isCompressing = ref(false);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    previewUrl.value = newValue;
    if (newValue) {
      imageSize.value = parseFloat(getBase64Size(newValue).toFixed(2));
    } else {
      imageSize.value = null;
    }
  }
);

/**
 * Déclenche l'ouverture du sélecteur de fichier
 */
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

/**
 * Gère la sélection d'un fichier
 */
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Vérifier que c'est bien une image
  if (!file.type.startsWith('image/')) {
    error.value = 'Veuillez sélectionner une image valide';
    emit('error', error.value);
    return;
  }

  try {
    error.value = '';
    isCompressing.value = true;

    // Compresser selon le type
    let compressedBase64: string;
    if (props.type === 'avatar') {
      compressedBase64 = await compressAvatarImage(file);
    } else {
      compressedBase64 = await compressSignalementImage(file);
    }

    // Vérifier la taille
    if (!validateImageSize(compressedBase64, props.maxSizeKB)) {
      const size = getBase64Size(compressedBase64).toFixed(2);
      error.value = `Image trop volumineuse: ${size}KB. Maximum: ${props.maxSizeKB}KB`;
      emit('error', error.value);
      return;
    }

    // Mettre à jour la prévisualisation
    previewUrl.value = compressedBase64;
    imageSize.value = parseFloat(getBase64Size(compressedBase64).toFixed(2));

    // Émettre les événements
    emit('update:modelValue', compressedBase64);
    emit('upload', compressedBase64);
  } catch (err) {
    error.value = 'Erreur lors de la compression de l\'image';
    console.error('Erreur compression:', err);
    emit('error', error.value);
  } finally {
    isCompressing.value = false;
    // Réinitialiser l'input pour permettre de sélectionner la même image
    if (target) {
      target.value = '';
    }
  }
};

/**
 * Gère la suppression de la photo
 */
const handleDelete = () => {
  previewUrl.value = '';
  imageSize.value = null;
  error.value = '';
  emit('update:modelValue', '');
  emit('delete');
};
</script>

<style scoped>
.photo-uploader {
  position: relative;
  width: 100%;
}

.photo-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--ion-color-light);
  cursor: pointer;
  border: 2px dashed var(--ion-color-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.photo-preview:hover {
  border-color: var(--ion-color-primary);
  background-color: var(--ion-color-light-tint);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.camera-icon {
  font-size: 48px;
  color: var(--ion-color-medium);
  margin-bottom: 8px;
}

.placeholder p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

.delete-button {
  position: absolute;
  top: 8px;
  right: 8px;
  --background: rgba(255, 255, 255, 0.9);
  --border-radius: 50%;
  z-index: 10;
}

.size-info {
  margin-top: 8px;
  text-align: center;
}

.error-message {
  display: block;
  margin-top: 8px;
  text-align: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 100;
}

.loading-overlay p {
  color: white;
  margin-top: 12px;
  font-size: 14px;
}

/* Variantes pour avatar (circulaire) */
.photo-uploader.avatar .photo-preview {
  border-radius: 50%;
  max-width: 200px;
  margin: 0 auto;
}
</style>
