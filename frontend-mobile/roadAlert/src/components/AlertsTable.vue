<template>
  <div class="alerts-table-card">
    <div class="table-header">
      <h3 class="table-title">
        <i class="fas fa-list mr-2"></i>
        {{ title }}
      </h3>
      <button class="refresh-btn" @click="emit('refresh')">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>

    <div class="table-container">
      <table class="alerts-table">
        <thead>
          <tr>
            <th>Entreprise</th>
            <th>Surface</th>
            <th>Budget</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="alert in alerts" 
            :key="alert.id"
            class="table-row"
          >
            <td>
              <div class="company-cell">
                <div class="company-avatar">
                  {{ getInitials(alert.concerned_entreprise) }}
                </div>
                <span class="company-name-cell">{{ alert.concerned_entreprise }}</span>
              </div>
            </td>
            <td>
              <span class="surface-value">{{ alert.surface }} m²</span>
            </td>
            <td>
              <span class="budget-value">{{ formatBudget(alert.budget) }}</span>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(alert.status)]">
                {{ getStatusLabel(alert.status) }}
              </span>
            </td>
            <td>
              <span class="date-value">{{ formatDate(alert.date_alert) }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="alerts.length === 0" class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>{{ emptyMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoadAlert } from '../utils/roadAlertApi';

interface Props {
  alerts: RoadAlert[];
  title?: string;
  emptyMessage?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'Signalements récents',
  emptyMessage: 'Aucun signalement'
});

const emit = defineEmits<{
  refresh: [];
}>();

const formatBudget = (budget: number) => {
  if (budget >= 1_000_000_000) {
    return (budget / 1_000_000_000).toFixed(2) + ' Md';
  } else if (budget >= 1_000_000) {
    return (budget / 1_000_000).toFixed(0) + ' M';
  }
  return budget.toLocaleString('fr-FR');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusClass = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'terminé' || statusLower === 'termine') return 'status-done';
  if (statusLower === 'en_cours' || statusLower === 'en cours') return 'status-progress';
  return 'status-new';
};

const getStatusLabel = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'terminé' || statusLower === 'termine') return 'Terminé';
  if (statusLower === 'en_cours' || statusLower === 'en cours') return 'En cours';
  return 'Nouveau';
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
</script>

<style scoped>
.alerts-table-card {
  background: white;
  border-radius: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.table-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
}

.mr-2 {
  margin-right: 0.5rem;
}

.refresh-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  border: none;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #2563eb;
  color: white;
  transform: rotate(180deg);
}

.table-container {
  overflow-x: auto;
}

.alerts-table {
  width: 100%;
  border-collapse: collapse;
}

.alerts-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.alerts-table th {
  padding: 0.875rem 1.5rem;
  text-align: left;
  font-size: 0.625rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alerts-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.table-row {
  transition: background 0.2s;
}

.table-row:hover {
  background: #f8fafc;
}

.company-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.company-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.company-name-cell {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.surface-value,
.budget-value,
.date-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
}

.status-new {
  background: #fef3c7;
  color: #d97706;
}

.status-progress {
  background: #dbeafe;
  color: #2563eb;
}

.status-done {
  background: #dcfce7;
  color: #16a34a;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #cbd5e1;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

@media (max-width: 768px) {
  .alerts-table th,
  .alerts-table td {
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
  }
  
  .company-name-cell {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
