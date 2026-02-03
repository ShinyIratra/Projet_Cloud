<template>
  <div class="notifications-panel" :class="{ 'open': isOpen }">
    <!-- Header -->
    <div class="notifications-header">
      <h2 class="notifications-title">
        <i class="fas fa-bell"></i>
        Notifications
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </h2>
      <div class="notifications-actions">
        <button 
          v-if="unreadCount > 0" 
          @click="handleMarkAllAsRead" 
          class="btn-mark-all"
          title="Tout marquer comme lu"
        >
          <i class="fas fa-check-double"></i>
        </button>
        <button @click="emit('close')" class="btn-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="notifications-content">
      <div v-if="isLoading" class="loading-state">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>Chargement...</p>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <i class="far fa-bell-slash"></i>
        <p>Aucune notification</p>
      </div>

      <div v-else class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <i class="fas fa-info-circle"></i>
          </div>
          <div class="notification-body">
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
          </div>
          <div v-if="!notification.read" class="notification-badge">
            <span class="unread-dot"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { fetchUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '../utils/notificationApi';

const props = defineProps<{
  isOpen: boolean;
  userUID: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'notificationClick', notification: Notification): void;
}>();

const notifications = ref<Notification[]>([]);
const isLoading = ref(false);

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

const loadNotifications = async () => {
  if (!props.userUID) return;
  
  isLoading.value = true;
  try {
    notifications.value = await fetchUserNotifications(props.userUID);
  } catch (error) {
    console.error('Erreur lors du chargement des notifications:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read) {
    try {
      await markNotificationAsRead(notification.id);
      notification.read = true;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  }
  emit('notificationClick', notification);
};

const handleMarkAllAsRead = async () => {
  try {
    await markAllNotificationsAsRead(props.userUID);
    notifications.value.forEach(n => n.read = true);
  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error);
  }
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Charger les notifications quand le panneau s'ouvre
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    loadNotifications();
  }
});

// Exposer la fonction pour rafraîchir depuis le parent
defineExpose({
  refresh: loadNotifications
});
</script>

<style scoped>
.notifications-panel {
  position: fixed;
  top: 0;
  right: -100%;
  width: 100%;
  max-width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
}

.notifications-panel.open {
  right: 0;
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.notifications-title {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.notifications-title i {
  color: #3b82f6;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 700;
}

.notifications-actions {
  display: flex;
  gap: 8px;
}

.btn-mark-all,
.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #e2e8f0;
  color: #64748b;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-mark-all:hover {
  background: #3b82f6;
  color: white;
}

.btn-close:hover {
  background: #ef4444;
  color: white;
}

.notifications-content {
  flex: 1;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #94a3b8;
}

.loading-state i,
.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.notifications-list {
  padding: 10px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:hover {
  background: #e2e8f0;
}

.notification-item.unread {
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.notification-icon {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-body {
  flex: 1;
}

.notification-message {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.notification-badge {
  flex-shrink: 0;
}

.unread-dot {
  display: block;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
}
</style>
