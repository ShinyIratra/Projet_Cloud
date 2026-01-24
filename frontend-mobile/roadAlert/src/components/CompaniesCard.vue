<template>
  <div class="companies-card">
    <h3 class="companies-title">
      <i class="fas fa-building mr-2"></i>
      Entreprises actives
    </h3>
    <div class="companies-list">
      <div 
        v-for="(company, index) in companies" 
        :key="company.name"
        class="company-item"
      >
        <div class="company-info">
          <div 
            class="company-icon" 
            :style="{ background: getCompanyColor(index) }"
          >
            <i class="fas fa-hard-hat"></i>
          </div>
          <div class="company-details">
            <p class="company-name">{{ company.name }}</p>
            <p class="company-count">{{ company.count }} signalement{{ company.count > 1 ? 's' : '' }}</p>
          </div>
        </div>
        <div class="company-percentage">
          {{ company.percentage }}%
        </div>
      </div>

      <div v-if="companies.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>Aucune entreprise enregistrée</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CompanyStats {
  name: string;
  percentage: number;
  count: number;
}

interface Props {
  companies: CompanyStats[];
}

defineProps<Props>();

const getCompanyColor = (index: number) => {
  const colors = ['#2563eb', '#4f46e5', '#16a34a', '#ea580c', '#dc2626'];
  return colors[index] || '#64748b';
};
</script>

<style scoped>
.companies-card {
  background: white;
  border-radius: 1.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.companies-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
}

.mr-2 {
  margin-right: 0.5rem;
}

.companies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.company-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.875rem;
  transition: all 0.2s;
}

.company-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.company-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.company-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
}

.company-details {
  display: flex;
  flex-direction: column;
}

.company-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.company-count {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  margin-top: 0.125rem;
}

.company-percentage {
  font-size: 0.875rem;
  font-weight: 800;
  color: #2563eb;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #cbd5e1;
}

.empty-state i {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}
</style>
