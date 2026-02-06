<template>
  <ion-page class="login-page">
    <ion-content fullscreen class="login-content">
      <canvas ref="canvasRef" class="login-canvas" />
      <div class="login-wrapper">
        <main class="card">
          <div class="logo" aria-hidden>●</div>
          <h1>Identifiant</h1>
          <p class="subtitle">Entrer vos identifiants</p>

          <div 
            v-if="errorMessage" 
            class="error-container" 
            aria-live="polite"
          >
            <p class="error-text">{{ errorMessage }}</p>
          </div>

          <form @submit.prevent="handleSubmit">
            <input 
              v-model="email"
              type="email" 
              name="email" 
              placeholder="Email ou téléphone" 
              required 
            />
            <input 
              v-model="password"
              type="password" 
              name="password" 
              placeholder="Mot de passe" 
              required 
            />
            <button type="submit" class="btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Connexion...' : 'Continuer' }}
            </button>
          </form>

          <div class="actions">
            <a href="#" @click.prevent="handleForgotPassword">Oublié ?</a>
          </div>
        </main>

        <footer class="footer">
          <p>Données et confidentialité</p>
        </footer>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { loginUser, resetPassword } from '../utils/authApi';
import './Login.css';

type Particle = {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
};

const router = useRouter();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

let particles: Particle[] = [];
let animationFrameId: number | null = null;

const initParticles = (canvas: HTMLCanvasElement) => {
  particles = [];
  const count = (canvas.width * canvas.height) / 12000;
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });
  }
};

const updateParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: string, opacity: number) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.fillStyle = `rgba(${color}, ${opacity})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    for (let j = i; j < particles.length; j += 1) {
      const other = particles[j];
      const dx = p.x - other.x;
      const dy = p.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const lineOpacity = (1 - dist / 150) * opacity;
        ctx.strokeStyle = `rgba(${color}, ${lineOpacity})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
  }
};

const animate = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const style = getComputedStyle(document.documentElement);
  const color = style.getPropertyValue('--dot-color').trim();
  const baseOpacity = parseFloat(style.getPropertyValue('--dot-opacity'));
  updateParticles(ctx, canvas, color, baseOpacity);
  animationFrameId = requestAnimationFrame(() => animate(ctx, canvas));
};

const resize = (canvas: HTMLCanvasElement) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles(canvas);
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const response = await loginUser(email.value, password.value);
    
    // Stocker les tokens et informations utilisateur
    localStorage.setItem('authToken', response.idToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    // Décoder le token pour extraire l'UID
    const tokenPayload = JSON.parse(atob(response.idToken.split('.')[1]));
    const userUID = tokenPayload.user_id || tokenPayload.uid;
    
    localStorage.setItem('user', JSON.stringify({
      UID: userUID,
      email: response.email,
      expiresIn: response.expiresIn
    }));
    
    // Rediriger vers Home
    router.push('/home');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erreur de connexion';
  } finally {
    isLoading.value = false;
  }
};

const handleForgotPassword = async () => {
  if (!email.value) {
    errorMessage.value = 'Veuillez entrer votre adresse email pour réinitialiser le mot de passe';
    return;
  }
  
  try {
    await resetPassword(email.value);
    errorMessage.value = '';
    alert('Un email de réinitialisation a été envoyé à ' + email.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation';
  }
};

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  resize(canvas);
  animate(ctx, canvas);
  window.addEventListener('resize', () => resize(canvas));
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', () => {});
});
</script>
