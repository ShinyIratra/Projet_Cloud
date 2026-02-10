<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-container">
      <!-- NAVBAR -->
      <nav class="modal-header">
          <button @click="close" class="back-button">
              <i class="fas fa-chevron-left"></i>
          </button>
          <div class="header-title">Nouveau signalement</div>
          <div class="spacer"></div>
      </nav>

      <!-- MAIN CONTENT -->
      <main class="modal-content">
          
          <div class="title-section">
              <h1 class="main-title">Signaler un problème</h1>
              <p class="subtitle">Enregistrement d'un nouveau signalement routier</p>
          </div>

          <form @submit.prevent="handleSubmit" class="form-container">
              
              <div class="form-card">
                  
                  <!-- LOCATION INFO -->
                  <div class="location-info" v-if="selectedLocation">
                     <div class="location-content">
                        <div class="location-icon">
                          <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="location-text">
                          <p class="location-label">Position</p>
                          <p class="location-coords">{{ selectedLocation.lat.toFixed(5) }}, {{ selectedLocation.lng.toFixed(5) }}</p>
                        </div>
                     </div>
                     <button type="button" @click="emit('clearLocation')" class="modify-button">Modifier</button>
                  </div>

                  <!-- DATE -->
                  <div class="input-group">
                      <label><i class="far fa-calendar-alt"></i> Date du signalement</label>
                      <div class="input-wrapper">
                          <input v-model="formData.date_alert" type="date" class="custom-input" required>
                      </div>
                  </div>

                  <!-- PHOTOS -->
                  <div class="input-group">
                      <label><i class="fas fa-camera"></i> Photos du problème</label>
                      <p class="input-hint">Ajoutez jusqu'à 5 photos (optionnel)</p>
                      
                      <!-- Grille de photos -->
                      <div class="photos-grid">
                        <div 
                          v-for="(photo, index) in signalementPhotos" 
                          :key="index"
                          class="photo-item"
                        >
                          <img :src="photo" :alt="`Photo ${index + 1}`" class="photo-preview" />
                          <button
                            type="button"
                            class="photo-remove"
                            @click="removePhoto(index)"
                            title="Supprimer"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                          <span v-if="index === 0" class="photo-badge">Principale</span>
                        </div>

                        <!-- Bouton ajouter photo -->
                        <div v-if="signalementPhotos.length < 5" class="photo-actions">
                          <button
                            type="button"
                            class="photo-button"
                            @click="handleAddPhotoFromCamera"
                            :disabled="isCapturing"
                          >
                            <i class="fas fa-camera"></i>
                            <span>Caméra</span>
                          </button>
                          <button
                            type="button"
                            class="photo-button gallery"
                            @click="handleAddPhotoFromGallery"
                            :disabled="isCapturing"
                          >
                            <i class="fas fa-images"></i>
                            <span>Galerie</span>
                          </button>
                        </div>
                      </div>

                      <p v-if="photoError" class="error-text">{{ photoError }}</p>
                      <p v-if="isCapturing" class="info-text"><i class="fas fa-circle-notch fa-spin"></i> Capture en cours...</p>
                  </div>

              </div>

              <!-- SUBMIT BUTTON -->
              <div class="button-container">
                  <button type="submit" :disabled="isSubmitting" class="submit-button">
                      <i v-if="isSubmitting" class="fas fa-circle-notch fa-spin"></i>
                      <span>{{ isSubmitting ? 'Enregistrement...' : 'Créer le signalement' }}</span>
                  </button>
                  <button type="button" @click="close" class="cancel-button">
                      Annuler
                  </button>
              </div>

          </form>
      </main>

      <!-- SUCCESS TOAST -->
      <div v-if="showSuccess" class="success-toast">
          <i class="fas fa-check-circle"></i>
          <span>Signalement créé</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { createMobileRoadAlert } from '../utils/roadAlertApi';
import { photoCapture } from '../utils/cameraHelper';

const props = defineProps<{
  isOpen: boolean;
  selectedLocation: { lat: number; lng: number } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'clearLocation'): void;
  (e: 'refresh'): void;
}>();

const isSubmitting = ref(false);
const showSuccess = ref(false);
const isCapturing = ref(false);
const signalementPhotos = ref<string[]>([]);
const photoError = ref('');

const formData = ref({
  date_alert: new Date().toISOString().split('T')[0]
});

const close = () => {
  emit('close');
  // Réinitialiser les photos
  signalementPhotos.value = [];
  photoError.value = '';
};

// Fonction pour récupérer l'UID de l'utilisateur
const getUserUID = (): string => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.UID || user.uid || '';
    } catch (e) {
      console.error('Erreur lors de la récupération de l\'UID:', e);
    }
  }
  return '';
};

// Ajouter une photo depuis la caméra
const handleAddPhotoFromCamera = async () => {
  if (signalementPhotos.value.length >= 5) {
    photoError.value = 'Maximum 5 photos atteint';
    return;
  }

  isCapturing.value = true;
  photoError.value = '';

  try {
    const photo = await photoCapture.camera();
    if (photo) {
      signalementPhotos.value.push(photo);
      console.log('✅ Photo ajoutée depuis la caméra');
    }
  } catch (error) {
    console.error('Erreur caméra:', error);
    photoError.value = 'Erreur lors de la prise de photo';
  } finally {
    isCapturing.value = false;
  }
};

// Ajouter une photo depuis la galerie
const handleAddPhotoFromGallery = async () => {
  if (signalementPhotos.value.length >= 5) {
    photoError.value = 'Maximum 5 photos atteint';
    return;
  }

  isCapturing.value = true;
  photoError.value = '';

  try {
    const photo = await photoCapture.gallery();
    if (photo) {
      signalementPhotos.value.push(photo);
      console.log('✅ Photo ajoutée depuis la galerie');
    }
  } catch (error) {
    console.error('Erreur galerie:', error);
    photoError.value = 'Erreur lors de la sélection de photo';
  } finally {
    isCapturing.value = false;
  }
};

// Supprimer une photo
const removePhoto = (index: number) => {
  signalementPhotos.value.splice(index, 1);
  photoError.value = '';
};

const handleSubmit = async () => {
  if (!props.selectedLocation) {
    alert('Veuillez sélectionner une localisation sur la carte');
    return;
  }

  const userUID = getUserUID();
  if (!userUID) {
    alert('Utilisateur non connecté. Veuillez vous connecter.');
    return;
  }
  
  isSubmitting.value = true;
  try {
    const payload = {
      UID: userUID,
      date_alert: formData.value.date_alert,
      lattitude: props.selectedLocation.lat,
      longitude: props.selectedLocation.lng,
      photos: signalementPhotos.value,
      photo_principale: signalementPhotos.value.length > 0 ? signalementPhotos.value[0] : ''
    };

    console.log('📤 Envoi du signalement avec', signalementPhotos.value.length, 'photo(s)');
    await createMobileRoadAlert(payload);
    
    // Show success toast
    showSuccess.value = true;
    setTimeout(() => {
        showSuccess.value = false;
        close();
        emit('refresh');
        emit('clearLocation');
        // Reset form
        formData.value = {
            date_alert: new Date().toISOString().split('T')[0]
        };
        signalementPhotos.value = [];
    }, 2000);
    
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la création du signalement');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

/* Modal Overlay */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.modal-container {
    width: 100%;
    max-height: 90vh;
    background: white;
    border-radius: 32px 32px 0 0;
    box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(226, 232, 240, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

/* Header */
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: white;
    border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.back-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(241, 245, 249, 0.8);
    color: #475569;
    border: 1px solid rgba(226, 232, 240, 0.5);
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.back-button:active {
    transform: scale(0.95);
    background: rgba(226, 232, 240, 0.8);
}

.header-title {
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
}

.spacer {
    width: 40px;
}

/* Content */
.modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px calc(32px + env(safe-area-inset-bottom));
}

.title-section {
    text-align: center;
    margin-bottom: 32px;
}

.main-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.subtitle {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}

.form-container {
    max-width: 500px;
    margin: 0 auto;
}

/* Form Card */
.form-card {
    background: #f8fafc;
    border-radius: 28px;
    padding: 28px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    margin-bottom: 24px;
}

/* Location Info */
.location-info {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.08) 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
}

.location-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.location-icon {
    width: 36px;
    height: 36px;
    background: rgba(59, 130, 246, 0.12);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 14px;
}

.location-text {
    font-size: 12px;
}

.location-label {
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}

.location-coords {
    color: #0f172a;
    font-weight: 700;
}

.modify-button {
    color: #3b82f6;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 8px 12px;
    border-radius: 10px;
    transition: all 0.2s ease;
}

.modify-button:active {
    background: rgba(59, 130, 246, 0.1);
}

/* Input Group */
.input-group {
    margin-bottom: 20px;
}

.input-group label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #64748b;
    margin-bottom: 10px;
}

.input-group label i {
    color: #3b82f6;
    margin-right: 6px;
}

.custom-input {
    width: 100%;
    background: white;
    border: 2px solid rgba(226, 232, 240, 0.8);
    border-radius: 16px;
    padding: 16px 18px;
    font-weight: 600;
    color: #1e293b;
    font-size: 15px;
    transition: all 0.2s ease;
    outline: none;
}

.custom-input:focus {
    background: white;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
}

/* Buttons */
.button-container {
    padding-top: 16px;
}

.submit-button {
    width: 100%;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    padding: 18px;
    border-radius: 20px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 13px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25),
                0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.submit-button:active {
    transform: scale(0.98);
    box-shadow: 0 5px 15px rgba(15, 23, 42, 0.3);
}

.submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.cancel-button {
    width: 100%;
    margin-top: 12px;
    padding: 16px;
    color: #64748b;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease;
}

.cancel-button:active {
    color: #475569;
}

/* Success Toast */
.success-toast {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 16px 28px;
    border-radius: 50px;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 3000;
    animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes toastIn {
    from {
        transform: translateX(-50%) translateY(20px) scale(0.9);
        opacity: 0;
    }
    to {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
    }
}

/* Photos Section */
.input-hint {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
    margin-bottom: 12px;
}

.photos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.photo-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    background: #f1f5f9;
    border: 2px solid #e2e8f0;
}

.photo-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.photo-remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.95);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
}

.photo-remove:active {
    transform: scale(0.9);
    background: rgba(220, 38, 38, 1);
}

.photo-badge {
    position: absolute;
    bottom: 6px;
    left: 6px;
    background: rgba(59, 130, 246, 0.95);
    color: white;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 8px;
    border-radius: 6px;
}

.photo-actions {
    grid-column: span 3;
    display: flex;
    gap: 12px;
}

.photo-button {
    flex: 1;
    aspect-ratio: 2.5;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.08) 100%);
    border: 2px dashed rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #3b82f6;
    font-size: 12px;
    font-weight: 700;
    transition: all 0.2s ease;
}

.photo-button:active {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.15) 100%);
    border-color: rgba(59, 130, 246, 0.5);
    transform: scale(0.98);
}

.photo-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.photo-button i {
    font-size: 20px;
}

.photo-button.gallery {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(196, 181, 253, 0.08) 100%);
    border-color: rgba(139, 92, 246, 0.3);
    color: #8b5cf6;
}

.photo-button.gallery:active {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(196, 181, 253, 0.15) 100%);
    border-color: rgba(139, 92, 246, 0.5);
}

.error-text {
    color: #ef4444;
    font-size: 11px;
    margin-top: 8px;
    font-weight: 600;
}

.info-text {
    color: #3b82f6;
    font-size: 11px;
    margin-top: 8px;
    font-weight: 600;
}

.info-text i {
    margin-right: 6px;
}
</style>