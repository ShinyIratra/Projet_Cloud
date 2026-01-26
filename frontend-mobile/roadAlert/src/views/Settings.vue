<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Configuration API</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="config-container">
        <ion-item>
          <ion-label position="stacked">URL de l'API</ion-label>
          <ion-input v-model="apiUrl" placeholder="Ex: http://192.168.1.15:3000/api"></ion-input>
        </ion-item>
        <p class="hint">Laissez vide pour utiliser la valeur par défaut (localhost ou .env).</p>
        
        <div class="actions">
          <ion-button expand="block" @click="save">Enregistrer et Recharger</ion-button>
          <ion-button expand="block" fill="outline" color="medium" @click="reset">Réinitialiser</ion-button>
        </div>

        <div class="current-config">
          <h3>Configuration actuelle :</h3>
          <code>{{ currentUrl }}</code>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonButtons, IonBackButton } from '@ionic/vue';
import { getApiUrl, setApiUrl, API_URL } from '../utils/config';

const apiUrl = ref(localStorage.getItem('api_url_override') || '');
const currentUrl = API_URL;

const save = () => {
  setApiUrl(apiUrl.value);
};

const reset = () => {
  apiUrl.value = '';
  setApiUrl('');
};
</script>

<style scoped>
.config-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.hint {
  font-size: 0.8rem;
  color: #666;
  padding-left: 1rem;
  margin-top: 0.5rem;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
.current-config {
  margin-top: 2rem;
  padding: 1rem;
  background: #f4f4f4;
  border-radius: 8px;
}
code {
  word-break: break-all;
}
</style>
