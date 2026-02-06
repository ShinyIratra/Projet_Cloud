<template>
  <div v-if="isOpen" class="fixed inset-0 z-[2000] bg-[#f1f5f9] flex flex-col h-full w-full overflow-y-auto">
    <!-- NAVBAR -->
    <nav class="glass-nav fixed top-0 w-full z-50 h-16 flex items-center justify-between px-6">
        <div class="flex items-center space-x-4">
            <button @click="close" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <i class="fas fa-chevron-left"></i>
            </button>
            <div class="text-lg font-extrabold tracking-tight">Nouveau signalement</div>
        </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="pt-28 px-4 max-w-xl mx-auto w-full pb-20">
        
        <div class="mb-8 text-center">
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Signaler un problème</h1>
            <p class="text-slate-500 font-medium text-sm">Enregistrement d'un nouveau signalement routier</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
            
            <div class="form-card space-y-6">
                
                <!-- 0. LOCATION INFO (Helper) -->
                <div class="bg-blue-50 p-3 rounded-2xl flex items-center justify-between" v-if="selectedLocation">
                   <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <i class="fas fa-map-marker-alt text-xs"></i>
                      </div>
                      <div class="text-xs">
                        <p class="text-slate-500 font-bold uppercase">Position</p>
                        <p class="font-bold text-slate-800">{{ selectedLocation.lat.toFixed(5) }}, {{ selectedLocation.lng.toFixed(5) }}</p>
                      </div>
                   </div>
                   <button type="button" @click="emit('clearLocation')" class="text-blue-600 text-xs font-bold uppercase">Modifier</button>
                </div>

                <!-- 1. DATE -->
                <div class="input-group">
                    <label><i class="far fa-calendar-alt mr-2 text-blue-500"></i> Date du signalement</label>
                    <div class="input-wrapper">
                        <input v-model="formData.date_alert" type="date" class="custom-input" required>
                    </div>
                </div>

                <!-- 2. PHOTOS -->
                <PhotoUpload 
                  v-model="photos" 
                  :maxPhotos="5"
                  ref="photoUploadRef"
                />

            </div>

            <!-- SUBMIT BUTTON -->
            <div class="pt-4">
                <button type="submit" :disabled="isSubmitting" class="w-full bg-slate-900 text-white py-5 rounded-[22px] font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
                    <i v-if="isSubmitting" class="fas fa-circle-notch fa-spin"></i>
                    <span>{{ isSubmitting ? 'Enregistrement...' : 'Créer le signalement' }}</span>
                </button>
                <button type="button" @click="close" class="w-full mt-3 py-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Annuler
                </button>
            </div>

        </form>
    </main>

    <!-- SUCCESS TOAST -->
    <div v-if="showSuccess" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-3 transition-all duration-500 z-[3000]">
        <i class="fas fa-check-circle"></i>
        <span class="text-xs font-bold uppercase tracking-wider">Signalement créé</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { createMobileRoadAlert } from '../utils/roadAlertApi';
import PhotoUpload, { PhotoData } from './PhotoUpload.vue';

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
const photos = ref<PhotoData[]>([]);
const photoUploadRef = ref<InstanceType<typeof PhotoUpload> | null>(null);

const formData = ref({
  date_alert: new Date().toISOString().split('T')[0]
});

const close = () => {
  emit('close');
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
    // Récupérer les photos en base64
    const photosBase64 = photoUploadRef.value?.getPhotosBase64() || [];

    const payload = {
      UID: userUID,
      date_alert: formData.value.date_alert,
      lattitude: props.selectedLocation.lat,
      longitude: props.selectedLocation.lng,
      photos: photosBase64
    };

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
        photos.value = [];
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

.glass-nav {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.form-card {
    background: white;
    border-radius: 32px;
    padding: 32px;
    border: 1px solid rgba(226, 232, 240, 0.6);
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
}

.input-group label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 10px;
    padding-left: 4px;
}

.custom-input {
    width: 100%;
    background: #f8fafc;
    border: 2px solid #f1f5f9;
    border-radius: 18px;
    padding: 16px 20px;
    font-weight: 700;
    color: #1e293b;
    transition: all 0.2s ease;
    outline: none;
}

.custom-input:focus {
    background: white;
    border-color: #3b82f6;
    box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.08);
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    right: 20px;
    color: #cbd5e1;
    pointer-events: none;
}
</style>