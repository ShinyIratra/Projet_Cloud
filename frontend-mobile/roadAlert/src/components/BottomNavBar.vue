<template>
  <div class="bottom-navigation">
    <div 
      v-for="tab in tabs" 
      :key="tab.name"
      @click="handleTabClick(tab.name)"
      :class="['nav-item', { active: activeTab === tab.name }]"
    >
      <i :class="`fas ${tab.icon}`"></i>
      <span>{{ tab.label }}</span>
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
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-around;
  z-index: 3000;
}

@media (prefers-color-scheme: dark) {
  .bottom-navigation {
    background: rgba(30, 41, 59, 0.9);
    border-top-color: rgba(51, 65, 85, 0.8);
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 12px;
  min-width: 60px;
}

.nav-item i {
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}

.nav-item span {
  font-size: 0.75rem;
  font-weight: 700;
}

.nav-item:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.05);
}

.nav-item:hover i {
  transform: scale(1.1);
}

.nav-item.active {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
}

@media (max-width: 480px) {
  .bottom-navigation {
    padding: 0.75rem 1rem;
  }
  
  .nav-item {
    min-width: 50px;
    padding: 0.375rem;
  }
  
  .nav-item i {
    font-size: 1.125rem;
  }
  
  .nav-item span {
    font-size: 0.688rem;
  }
}
</style>
