<template>
  <div id="create-alert-modal" :class="{ active: isOpen }">
    <div class="modal-content-mobile">
      <!-- HEADER MOBILE -->
      <div class="mobile-header">
        <button @click="close" class="back-button">
          <i class="fas fa-times"></i>
        </button>
        <div class="header-center">
          <h2 class="header-title">Nouveau signalement</h2>
          <div class="progress-dots">
            <span :class="['dot', { active: step === 'location' || step === 'form' || step === 'success' }]"></span>
            <span :class="['dot', { active: step === 'form' || step === 'success' }]"></span>
            <span :class="['dot', { active: step === 'success' }]"></span>
          </div>
        </div>
        <div class="header-spacer"></div>
      </div>

      <!-- STEP 1: Sélection de l'emplacement -->
      <div v-if="step === 'location'" class="step-container">
        <div class="step-content-scroll">
          <div class="instruction-card-mobile">
            <div class="instruction-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <h3 class="instruction-title">Où se trouve le problème ?</h3>
            <p class="instruction-text">Touchez la carte pour placer un marqueur rouge à l'emplacement exact</p>
          </div>

          <div v-if="selectedLocation" class="location-card-mobile">
            <div class="location-header">
              <div class="success-badge">
                <i class="fas fa-check-circle"></i>
                <span>Position confirmée</span>
              </div>
              <button type="button" @click="clearLocation" class="clear-btn">
                <i class="fas fa-redo-alt"></i>
              </button>
            </div>
            <div class="coordinates">
              <i class="fas fa-map-pin"></i>
              <span>{{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}</span>
            </div>
          </div>

          <div v-else class="empty-state-mobile">
            <div class="pulse-animation">
              <i class="fas fa-hand-pointer"></i>
            </div>
            <p>Touchez n'importe où sur la carte</p>
          </div>
        </div>

        <div class="bottom-action-mobile">
          <button 
            type="button"
            @click="nextStep" 
            :disabled="!selectedLocation"
            :class="['btn-mobile-primary', { disabled: !selectedLocation }]"
          >
            <span>Continuer</span>
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- STEP 2: Formulaire -->
      <div v-else-if="step === 'form'" class="step-container">
        <form @submit.prevent="handleSubmit" class="mobile-form">
          <div class="step-content-scroll">
            <div class="form-group-mobile">
              <label class="mobile-label">
                <i class="fas fa-building"></i>
                <span>Entreprise concernée</span>
              </label>
              <input 
                v-model="formData.concerned_entreprise" 
                type="text" 
                class="mobile-input"
                placeholder="Ex: Colas Madagascar"
                required
              />
            </div>

            <div class="form-group-mobile">
              <label class="mobile-label">
                <i class="fas fa-ruler-combined"></i>
                <span>Surface endommagée (m²)</span>
              </label>
              <input 
                v-model.number="formData.surface" 
                type="number" 
                class="mobile-input"
                placeholder="Entrez la surface"
                required
                min="1"
                inputmode="numeric"
              />
            </div>

            <div class="form-group-mobile">
              <label class="mobile-label">
                <i class="fas fa-wallet"></i>
                <span>Budget estimé (Ar)</span>
              </label>
              <input 
                v-model.number="formData.budget" 
                type="number" 
                class="mobile-input"
                placeholder="Montant en Ariary"
                required
                min="0"
                inputmode="numeric"
              />
            </div>

            <div class="location-summary-mobile">
              <div class="summary-header">
                <i class="fas fa-map-marker-alt"></i>
                <span>Localisation</span>
              </div>
              <div class="summary-coords">
                {{ selectedLocation?.lat.toFixed(4) }}, {{ selectedLocation?.lng.toFixed(4) }}
              </div>
              <button type="button" @click="step = 'location'" class="change-location-btn">
                Modifier la position
              </button>
            </div>
          </div>

          <div class="bottom-action-mobile split">
            <button 
              type="button" 
              @click="step = 'location'" 
              class="btn-mobile-secondary"
            >
              <i class="fas fa-arrow-left"></i>
            </button>
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="btn-mobile-primary flex-grow"
            >
              <i v-if="!isSubmitting" class="fas fa-paper-plane"></i>
              <i v-else class="fas fa-spinner fa-spin"></i>
              <span>{{ isSubmitting ? 'Envoi en cours...' : 'Créer le signalement' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- STEP 3: Confirmation -->
      <div v-else-if="step === 'success'" class="step-container">
        <div class="step-content-scroll center">
          <div class="success-animation">
            <div class="success-circle">
              <i class="fas fa-check"></i>
            </div>
          </div>
          <h3 class="success-title">Signalement créé !</h3>
          <p class="success-text">Votre signalement a été enregistré avec succès et apparaîtra sur la carte</p>
        </div>
        
        <div class="bottom-action-mobile">
          <button @click="closeAndRefresh" class="btn-mobile-primary">
            <i class="fas fa-check"></i>
            <span>Terminé</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createRoadAlert } from '../utils/roadAlertApi';

interface Props {
  isOpen: boolean;
  selectedLocation: { lat: number; lng: number } | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  clearLocation: [];
  refresh: [];
}>();

const step = ref<'location' | 'form' | 'success'>('location');
const isSubmitting = ref(false);

const formData = ref({
  surface: 0,
  budget: 0,
  concerned_entreprise: '',
});

const nextStep = () => {
  if (props.selectedLocation) {
    step.value = 'form';
  }
};

const clearLocation = () => {
  emit('clearLocation');
};

const handleSubmit = async () => {
  if (!props.selectedLocation) return;

  isSubmitting.value = true;
  try {
    const alertData = {
      surface: formData.value.surface,
      budget: formData.value.budget,
      concerned_entreprise: formData.value.concerned_entreprise,
      status: 'nouveau',
      lattitude: props.selectedLocation.lat,
      longitude: props.selectedLocation.lng,
      UID: `user-${Date.now()}`, // Générer un UID temporaire
      date_alert: new Date().toISOString(),
    };

    await createRoadAlert(alertData);
    step.value = 'success';
  } catch (error) {
    console.error('Erreur lors de la création du signalement:', error);
    alert('Une erreur est survenue lors de la création du signalement');
  } finally {
    isSubmitting.value = false;
  }
};

const close = () => {
  resetForm();
  emit('close');
};

const closeAndRefresh = () => {
  resetForm();
  emit('refresh');
  emit('close');
};

const resetForm = () => {
  step.value = 'location';
  formData.value = {
    surface: 0,
    budget: 0,
    concerned_entreprise: '',
  };
  isSubmitting.value = false;
};
</script>

<style scoped>
/* === MODAL MOBILE FULLSCREEN === */
#create-alert-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 4000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

#create-alert-modal.active {
  opacity: 1;
  pointer-events: all;
}

.modal-content-mobile {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: 28px 28px 0 0;
  height: 85vh;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s cubic-bezier(0.33, 1, 0.68, 1);
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* === HEADER MOBILE === */
.mobile-header {
  padding: 20px 16px 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.back-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-button:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

.header-center {
  flex: 1;
  text-align: center;
  padding: 0 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 8px;
}

.progress-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  transition: all 0.3s;
}

.dot.active {
  background: #2563eb;
  width: 24px;
  border-radius: 4px;
}

.header-spacer {
  width: 44px;
  flex-shrink: 0;
}

/* === STEP CONTAINER === */
.step-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.step-content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  -webkit-overflow-scrolling: touch;
}

.step-content-scroll.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* === INSTRUCTION CARD MOBILE === */
.instruction-card-mobile {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  margin-bottom: 20px;
  border: 2px solid #bfdbfe;
}

.instruction-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
}

.instruction-icon i {
  font-size: 28px;
  color: white;
}

.instruction-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 8px;
}

.instruction-text {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

/* === LOCATION CARD MOBILE === */
.location-card-mobile {
  background: white;
  border: 2px solid #22c55e;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.1);
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.success-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0fdf4;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #16a34a;
}

.success-badge i {
  font-size: 16px;
}

.clear-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fee2e2;
  border: none;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:active {
  background: #fecaca;
  transform: rotate(180deg);
}

.coordinates {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.coordinates i {
  color: #2563eb;
  font-size: 16px;
}

/* === EMPTY STATE MOBILE === */
.empty-state-mobile {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.pulse-animation {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  animation: pulse 2s infinite;
}

.pulse-animation i {
  font-size: 32px;
  color: #cbd5e1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(203, 213, 225, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(203, 213, 225, 0);
  }
}

.empty-state-mobile p {
  font-size: 15px;
  font-weight: 600;
}

/* === FORM MOBILE === */
.mobile-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-group-mobile {
  margin-bottom: 24px;
}

.mobile-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 12px;
}

.mobile-label i {
  color: #2563eb;
  font-size: 16px;
}

.mobile-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  background: white;
  transition: all 0.2s;
  -webkit-appearance: none;
  appearance: none;
}

.mobile-input:focus {
  outline: none;
  border-color: #2563eb;
  background: #f8fafc;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.mobile-input::placeholder {
  color: #cbd5e1;
}

/* === LOCATION SUMMARY MOBILE === */
.location-summary-mobile {
  background: #eff6ff;
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.summary-coords {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
  padding: 10px;
  background: white;
  border-radius: 8px;
}

.change-location-btn {
  width: 100%;
  padding: 10px;
  background: white;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.change-location-btn:active {
  background: #f0f9ff;
}

/* === BOTTOM ACTION MOBILE === */
.bottom-action-mobile {
  padding: 16px 20px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.bottom-action-mobile.split {
  display: flex;
  gap: 12px;
}

/* === BUTTONS MOBILE === */
.btn-mobile-primary {
  width: 100%;
  padding: 18px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
  transition: all 0.2s;
}

.btn-mobile-primary:active:not(.disabled) {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.btn-mobile-primary.disabled {
  background: #cbd5e1;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-mobile-primary.flex-grow {
  flex: 1;
}

.btn-mobile-secondary {
  width: 56px;
  height: 56px;
  padding: 0;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-mobile-secondary:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

/* === SUCCESS ANIMATION === */
.success-animation {
  margin-bottom: 24px;
}

.success-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 12px 40px rgba(34, 197, 94, 0.4);
  animation: scaleIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.success-circle i {
  font-size: 56px;
  color: white;
}

@keyframes scaleIn {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.success-title {
  font-size: 28px;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 12px;
}

.success-text {
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
  max-width: 320px;
  margin: 0 auto;
}

/* === SPINNER ANIMATION === */
.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
