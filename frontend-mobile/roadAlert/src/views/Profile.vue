<template>
  <ion-page class="profile-page">
    <ion-content :fullscreen="true" class="profile-content">
      <!-- NAVBAR -->
      <TopNavBar 
        title="Mon Profil"
        :showBackButton="true"
      />

      <!-- MAIN CONTENT -->
      <main class="profile-main">
        <!-- NOT LOGGED IN STATE -->
        <div v-if="!isAuthenticated" class="auth-required-card">
          <div class="auth-icon">
            <i class="fas fa-user-lock"></i>
          </div>
          <h2 class="auth-title">Connexion requise</h2>
          <p class="auth-text">Vous devez être connecté pour accéder à votre profil</p>
          <button @click="router.push('/login')" class="btn-primary">
            <i class="fas fa-sign-in-alt"></i>
            <span>Se connecter</span>
          </button>
        </div>

        <!-- LOGGED IN STATE -->
        <div v-else class="profile-container">
          <!-- PROFILE HEADER -->
          <div class="profile-header">
            <div class="avatar-wrapper">
              <div class="avatar-large">
                <img :src="avatarUrl" alt="profile" />
              </div>
              <button class="avatar-edit-btn">
                <i class="fas fa-camera"></i>
              </button>
            </div>
            <h1 class="profile-name">{{ userName }}</h1>
            <p class="profile-email">{{ userEmail }}</p>
            <span class="profile-badge">{{ userType }}</span>
          </div>

          <!-- SUCCESS/ERROR MESSAGES -->
          <div v-if="successMessage" class="message-card success">
            <i class="fas fa-check-circle"></i>
            <p>{{ successMessage }}</p>
          </div>
          <div v-if="errorMessage" class="message-card error">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ errorMessage }}</p>
          </div>

          <!-- PROFILE SECTIONS -->
          <div class="profile-sections">
            <!-- ACCOUNT INFO SECTION -->
            <section class="profile-section">
              <div class="section-header">
                <h2 class="section-title">
                  <i class="fas fa-user-circle"></i>
                  <span>Informations du compte</span>
                </h2>
                <button 
                  v-if="!isEditing" 
                  @click="toggleEdit" 
                  class="edit-btn"
                >
                  <i class="fas fa-pen"></i>
                  <span>Modifier</span>
                </button>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <label class="info-label">
                    <i class="fas fa-id-card"></i>
                    <span>ID Utilisateur</span>
                  </label>
                  <p class="info-value uid">{{ userUID }}</p>
                </div>

                <div class="info-item">
                  <label class="info-label">
                    <i class="fas fa-envelope"></i>
                    <span>Email</span>
                  </label>
                  <input 
                    v-if="isEditing"
                    v-model="formData.email"
                    type="email"
                    class="info-input"
                    placeholder="Nouvel email"
                  />
                  <p v-else class="info-value">{{ userEmail }}</p>
                </div>

                <div v-if="isEditing" class="info-item">
                  <label class="info-label">
                    <i class="fas fa-lock"></i>
                    <span>Nouveau mot de passe</span>
                  </label>
                  <input 
                    v-model="formData.password"
                    type="password"
                    class="info-input"
                    placeholder="Laisser vide pour ne pas changer"
                    minlength="6"
                  />
                </div>
              </div>

              <div v-if="isEditing" class="action-buttons">
                <button 
                  @click="handleUpdate" 
                  :disabled="isLoading"
                  class="btn-save"
                >
                  <i class="fas fa-save"></i>
                  <span>{{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}</span>
                </button>
                <button 
                  @click="cancelEdit" 
                  :disabled="isLoading"
                  class="btn-cancel"
                >
                  <i class="fas fa-times"></i>
                  <span>Annuler</span>
                </button>
              </div>
            </section>

            <!-- STATISTICS SECTION -->
            <section class="profile-section">
              <div class="section-header">
                <h2 class="section-title">
                  <i class="fas fa-chart-bar"></i>
                  <span>Mes statistiques</span>
                </h2>
              </div>
              
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-icon blue">
                    <i class="fas fa-exclamation-triangle"></i>
                  </div>
                  <div class="stat-info">
                    <p class="stat-value">{{ userStats.totalAlerts }}</p>
                    <p class="stat-label">Signalements</p>
                  </div>
                </div>
                <div class="stat-box">
                  <div class="stat-icon green">
                    <i class="fas fa-check-circle"></i>
                  </div>
                  <div class="stat-info">
                    <p class="stat-value">{{ userStats.resolvedAlerts }}</p>
                    <p class="stat-label">Résolus</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- ACTIONS SECTION -->
            <section class="profile-section danger-zone">
              <div class="section-header">
                <h2 class="section-title">
                  <i class="fas fa-shield-alt"></i>
                  <span>Actions</span>
                </h2>
              </div>
              
              <button @click="handleLogout" class="logout-button">
                <i class="fas fa-sign-out-alt"></i>
                <span>Se déconnecter</span>
              </button>
            </section>
          </div>
        </div>
      </main>

      <!-- BOTTOM NAVIGATION -->
      <BottomNavBar :activeTab="activeTab" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { updateUser } from '../utils/authApi';
import { fetchUserRoadAlerts } from '../utils/roadAlertApi';
import TopNavBar from '../components/TopNavBar.vue';
import BottomNavBar from '../components/BottomNavBar.vue';
import './Profile.css';

const router = useRouter();
const isAuthenticated = ref(false);
const isEditing = ref(false);
const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const userName = ref('');
const userEmail = ref('');
const userUID = ref('');
const userType = ref('Utilisateur');
const avatarUrl = ref('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

const formData = ref({
  email: '',
  password: ''
});

const userStats = ref({
  totalAlerts: 0,
  resolvedAlerts: 0
});

const activeTab = ref('profile');

const checkAuth = () => {
  const authToken = localStorage.getItem('authToken');
  isAuthenticated.value = !!authToken;

  if (isAuthenticated.value) {
    loadUserInfo();
    loadUserStats();
  }
};

const loadUserInfo = () => {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      userUID.value = user.UID || user.uid || '';
      userName.value = user.displayName || user.email?.split('@')[0] || 'Utilisateur';
      userEmail.value = user.email || '';
      userType.value = user.type_user === 'manager' ? 'Manager' : 'Utilisateur';
      avatarUrl.value = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName.value}`;
    } catch (error) {
      console.error('Erreur lors du chargement des infos utilisateur:', error);
    }
  }
};

const loadUserStats = async () => {
  try {
    const alerts = await fetchUserRoadAlerts(userUID.value);
    userStats.value.totalAlerts = alerts.length;
    userStats.value.resolvedAlerts = alerts.filter(
      alert => alert.status.toLowerCase() === 'terminé' || alert.status.toLowerCase() === 'termine'
    ).length;
  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error);
  }
};

const toggleEdit = () => {
  isEditing.value = true;
  formData.value.email = userEmail.value;
  formData.value.password = '';
};

const cancelEdit = () => {
  isEditing.value = false;
  formData.value.email = '';
  formData.value.password = '';
  errorMessage.value = '';
};

const handleUpdate = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validation
  if (!formData.value.email && !formData.value.password) {
    errorMessage.value = 'Veuillez modifier au moins un champ';
    return;
  }

  if (formData.value.password && formData.value.password.length < 6) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères';
    return;
  }

  isLoading.value = true;

  try {
    await updateUser(
      userUID.value,
      formData.value.email || undefined,
      formData.value.password || undefined
    );

    // Mettre à jour les infos locales si l'email a changé
    if (formData.value.email && formData.value.email !== userEmail.value) {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        user.email = formData.value.email;
        localStorage.setItem('user', JSON.stringify(user));
        userEmail.value = formData.value.email;
      }
    }

    successMessage.value = 'Profil mis à jour avec succès !';
    isEditing.value = false;
    formData.value.email = '';
    formData.value.password = '';

    // Masquer le message après 3 secondes
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(() => {
  checkAuth();
});
</script>
