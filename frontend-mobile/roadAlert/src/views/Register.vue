<template>
  <ion-page class="register-page">
    <ion-content fullscreen class="register-content">
      <canvas ref="canvasRef" class="register-canvas" />
      <div class="register-wrapper">
        <main class="card">
          <div class="logo" aria-hidden>●</div>
          <h1>Créer un compte</h1>
          <p class="subtitle">Inscrivez-vous pour commencer</p>

          <div 
            v-if="errorMessage" 
            class="error-container" 
            aria-live="polite"
          >
            <p class="error-text">{{ errorMessage }}</p>
          </div>

          <div 
            v-if="successMessage" 
            class="success-container" 
            aria-live="polite"
          >
            <p class="success-text">{{ successMessage }}</p>
          </div>

          <form @submit.prevent="handleSubmit">
            <input 
              v-model="displayName"
              type="text" 
              name="displayName" 
              placeholder="Nom complet" 
              required 
            />
            <input 
              v-model="email"
              type="email" 
              name="email" 
              placeholder="Email" 
              required 
            />
            <input 
              v-model="password"
              type="password" 
              name="password" 
              placeholder="Mot de passe" 
              required 
              minlength="6"
            />
            <input 
              v-model="confirmPassword"
              type="password" 
              name="confirmPassword" 
              placeholder="Confirmer le mot de passe" 
              required 
              minlength="6"
            />
            
            <div class="user-type-selector">
              <label>
                <input 
                  type="radio" 
                  v-model="typeUser" 
                  value="utilisateur" 
                  checked 
                />
                <span>Utilisateur</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  v-model="typeUser" 
                  value="manager" 
                />
                <span>Manager</span>
              </label>
            </div>

            <button type="submit" class="btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Inscription...' : "S'inscrire" }}
            </button>
          </form>

          <div class="actions">
            <a href="#" @click.prevent="handleBackToLogin">Déjà un compte ? Se connecter</a>
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
import { registerUser } from '../utils/authApi';
import './Register.css';

type Particle = {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
};

const router = useRouter();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const displayName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const typeUser = ref('utilisateur');
const errorMessage = ref('');
const successMessage = ref('');
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
  successMessage.value = '';

  // Validation
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas';
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères';
    return;
  }

  isLoading.value = true;

  try {
    await registerUser(email.value, password.value, displayName.value, typeUser.value);
    
    successMessage.value = 'Inscription réussie ! Redirection vers la connexion...';
    
    // Rediriger vers la page de connexion après 2 secondes
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Erreur lors de l'inscription";
  } finally {
    isLoading.value = false;
  }
};

const handleBackToLogin = () => {
  router.push('/login');
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
