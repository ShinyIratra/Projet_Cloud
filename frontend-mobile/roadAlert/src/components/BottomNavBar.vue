<template>
  <div class="bottom-navigation glass-panel">
    <div 
      v-for="tab in tabs" 
      :key="tab.name"
      @click="handleTabClick(tab.name)"
      :class="['nav-item', { active: activeTab === tab.name }]"
    >
      <div class="icon-container">
        <i :class="`fas ${tab.icon}`"></i>
        <div v-if="activeTab === tab.name" class="active-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Tab {
  name: string;
  label: string;
  icon: string;
}

interface Props {
  activeTab?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: 'explorer'
});

const router = useRouter();

const tabs: Tab[] = [
  { name: 'explorer', label: 'Explorer', icon: 'fa-map-marked-alt' },
  { name: 'stats', label: 'Stats', icon: 'fa-chart-pie' },
  { name: 'profile', label: 'Profil', icon: 'fa-user' },
];

const handleTabClick = (tabName: string) => {
  if (tabName === 'explorer') {
    router.push('/home');
  } else if (tabName === 'stats') {
    router.push('/dashboard');
  } else if (tabName === 'profile') {
    router.push('/profile');
  }
};
</script>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  
  /* Liquid Glass Style */
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(25px) saturate(200%);
  -webkit-backdrop-filter: blur(25px) saturate(200%);
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.1),
    0 4px 10px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
    
  border-radius: 35px;
  padding: 12px 20px;
  
  /* Safe area support */
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  margin-bottom: max(24px, env(safe-area-inset-bottom));
  
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 3000;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Dark mode adjustment */
@media (prefers-color-scheme: dark) {
  .bottom-navigation {
    background: rgba(30, 30, 30, 0.75);
    box-shadow: 
      0 10px 40px rgba(0, 0, 0, 0.4),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8E8E93; /* Apple/Instagram inactive color */
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 50px;
  height: 50px;
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.nav-item i {
  font-size: 1.35rem;
  transition: all 0.3s ease;
  z-index: 2;
}

.active-indicator {
  position: absolute;
  bottom: -8px;
  width: 4px;
  height: 4px;
  background-color: #007AFF; /* Apple Blue */
  border-radius: 50%;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nav-item.active {
  color: #007AFF;
}

/* Optional: Scale effect on active similar to Instagram tab switch */
.nav-item.active i {
  transform: translateY(-2px);
  filter: drop-shadow(0 4px 6px rgba(0, 122, 255, 0.25));
}

.nav-item:active i {
  transform: scale(0.9);
}

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 480px) {
  .bottom-navigation {
    width: 85%;
    margin-bottom: max(20px, env(safe-area-inset-bottom));
    padding: 10px 15px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
}
</style>
