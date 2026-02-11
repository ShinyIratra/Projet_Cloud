<template>
  <nav class="top-navigation">
    <!-- LEFT SIDE -->
    <div class="nav-left">
      <button v-if="showBackButton" @click="goBack" class="nav-button">
        <i class="fas fa-arrow-left"></i>
      </button>
      <button v-else-if="showMenuButton" @click="$emit('menu-click')" class="nav-button">
        <i class="fas fa-bars"></i>
      </button>
      <div v-if="showBrand" class="navbar-brand">
        Road<span class="brand-accent">Alert</span>
        <span class="brand-tag">Tana</span>
      </div>
      <div v-else-if="title" class="navbar-title">{{ title }}</div>
    </div>

    <!-- CENTER (optional) -->
    <div v-if="$slots.center" class="nav-center">
      <slot name="center"></slot>
    </div>

    <!-- RIGHT SIDE -->
    <div class="nav-right">
      <slot name="right">
        <div v-if="showUserMenu" class="user-menu-wrapper">
          <button 
            v-if="isAuthenticated" 
            @click="$emit('logout')" 
            class="nav-button" 
            title="Se déconnecter"
          >
            <i class="fas fa-sign-out-alt"></i>
          </button>
          <button 
            v-else 
            @click="$emit('login')" 
            class="nav-button primary" 
            title="Se connecter"
          >
            <i class="fas fa-sign-in-alt"></i>
          </button>
          <div class="nav-avatar" @click="$emit('avatar-click')">
            <img :src="avatarUrl" alt="user" />
          </div>
        </div>
      </slot>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Props {
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showBrand?: boolean;
  showUserMenu?: boolean;
  isAuthenticated?: boolean;
  avatarUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBackButton: false,
  showMenuButton: false,
  showBrand: false,
  showUserMenu: false,
  isAuthenticated: false,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
});

defineEmits<{
  'menu-click': [];
  'logout': [];
  'login': [];
  'avatar-click': [];
}>();

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.top-navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: calc(4rem + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: env(safe-area-inset-top) 1.25rem 0 1.25rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

@media (prefers-color-scheme: dark) {
  .top-navigation {
    background: rgba(30, 41, 59, 0.9);
    border-bottom-color: rgba(51, 65, 85, 0.8);
  }
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.nav-right {
  justify-content: flex-end;
}

.nav-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
}

.nav-button:hover {
  background: #f1f5f9;
  color: #1e293b;
}

@media (prefers-color-scheme: dark) {
  .nav-button {
    color: #cbd5e1;
  }
  
  .nav-button:hover {
    background: #334155;
    color: #f1f5f9;
  }
}

.nav-button.primary {
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
}

.nav-button.primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.navbar-brand {
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1e293b;
}

@media (prefers-color-scheme: dark) {
  .navbar-brand {
    color: #f1f5f9;
  }
}

.brand-accent {
  color: #2563eb;
}

.brand-tag {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  margin-left: 0.25rem;
}

@media (prefers-color-scheme: dark) {
  .brand-tag {
    background: #334155;
    color: #cbd5e1;
  }
}

.navbar-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

@media (prefers-color-scheme: dark) {
  .navbar-title {
    color: #f1f5f9;
  }
}

.user-menu-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.nav-avatar:hover {
  border-color: #2563eb;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.nav-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 480px) {
  .top-navigation {
    padding: 0 1rem;
  }

  .navbar-brand {
    font-size: 1rem;
  }

  .brand-tag {
    font-size: 0.563rem;
    padding: 0.188rem 0.375rem;
  }

  .navbar-title {
    font-size: 1rem;
  }
}
</style>
