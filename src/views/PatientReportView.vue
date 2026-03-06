<template>
  <div class="patient-report-view container">
    <div class="header">
      <h1>Reporte de Paciente</h1>
    </div>

    <!-- Patient Selection -->
    <div class="card patient-selector">
      <label for="patient-search" class="form-label">Buscar Paciente:</label>
      <div class="autocomplete-wrapper">
        <input 
          id="patient-search" 
          type="text" 
          class="form-input" 
          v-model="searchQuery" 
          @focus="showDropdown = true"
          @blur="hideDropdown"
          placeholder="Escribe para buscar un paciente..."
          autocomplete="off"
        >
        <ul v-if="showDropdown && filteredPatients.length > 0" class="autocomplete-list">
          <li 
            v-for="patient in filteredPatients" 
            :key="patient.id" 
            @mousedown.prevent="selectPatient(patient)"
            class="autocomplete-item"
          >
            {{ patient.name }}
          </li>
        </ul>
        <div v-else-if="showDropdown && searchQuery && filteredPatients.length === 0" class="autocomplete-list empty">
          No se encontraron pacientes.
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center mt-4">
      <p>Cargando datos...</p>
    </div>

    <!-- Report Content -->
    <div v-if="!loading && selectedPatientId" class="report-content">
      
      <!-- Summary Metrics -->
      <div class="summary-metrics">
        <div class="metric-card card">
          <span class="metric-value">{{ totalDeliveries }}</span>
          <span class="metric-label">Total</span>
        </div>
        <div class="metric-card card success">
          <span class="metric-value">{{ deliveredCount }}</span>
          <span class="metric-label">Entregados</span>
        </div>
        <div class="metric-card card warning">
          <span class="metric-value">{{ pendingCount }}</span>
          <span class="metric-label">Pendientes</span>
        </div>
      </div>

      <!-- Deliveries List -->
      <div class="section-header">
        <h2>Historial de Entregas</h2>
      </div>

      <div v-if="patientDeliveries.length === 0" class="card empty-state">
        <p>Este paciente no tiene historial de entregas.</p>
      </div>

      <div v-else class="delivery-list">
        <div 
          v-for="delivery in sortedDeliveries" 
          :key="delivery.id" 
          class="card delivery-item"
        >
          <div class="delivery-header">
            <h3>{{ formatDate(delivery.scheduledDate) }}</h3>
            <span class="status-badge" :class="delivery.status">
              {{ delivery.status === 'delivered' ? 'Entregado' : 'Pendiente' }}
            </span>
          </div>
          
          <div class="medicines-summary">
            <ul>
              <li v-for="item in delivery.medicines" :key="item.medicineId">
                {{ getMedicineName(item.medicineId) }}: {{ item.quantity }}
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dbService } from '../services/DatabaseService'

const patients = ref([])
const deliveries = ref([])
const medicines = ref([])
const selectedPatientId = ref('')
const loading = ref(true)

const searchQuery = ref('')
const showDropdown = ref(false)

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const [pts, dels, meds] = await Promise.all([
      dbService.getAll('patients'),
      dbService.getAll('deliveries'),
      dbService.getAll('medicines')
    ])
    // Sort patients alphabetically
    patients.value = pts.sort((a, b) => a.name.localeCompare(b.name))
    deliveries.value = dels
    medicines.value = meds
  } catch (err) {
    console.error('Error loading data for reports:', err)
  } finally {
    loading.value = false
  }
}

const filteredPatients = computed(() => {
  if (!searchQuery.value) return patients.value
  const query = searchQuery.value.toLowerCase()
  return patients.value.filter(p => p.name.toLowerCase().includes(query))
})

const selectPatient = (patient) => {
  selectedPatientId.value = patient.id
  searchQuery.value = patient.name
  showDropdown.value = false
}

const hideDropdown = () => {
  showDropdown.value = false
}

// Computed properties for the report
const patientDeliveries = computed(() => {
  if (!selectedPatientId.value) return []
  return deliveries.value.filter(d => d.patientId === selectedPatientId.value)
})

const sortedDeliveries = computed(() => {
  // Sort by date descending (newest first)
  return [...patientDeliveries.value].sort((a, b) => {
    return new Date(b.scheduledDate) - new Date(a.scheduledDate)
  })
})

const totalDeliveries = computed(() => patientDeliveries.value.length)
const deliveredCount = computed(() => patientDeliveries.value.filter(d => d.status === 'delivered').length)
const pendingCount = computed(() => patientDeliveries.value.filter(d => d.status === 'pending').length)

// Helpers
const getMedicineName = (id) => {
  const medicine = medicines.value.find(m => m.id === id)
  return medicine ? medicine.name : 'Desconocido'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  // Fix timezone offset issues for local dates
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}
</script>

<style scoped>
.patient-selector {
  margin-bottom: var(--spacing-lg);
  position: relative;
  z-index: 10;
}

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  max-height: 200px;
  overflow-y: auto;
  z-index: 20;
  list-style: none;
  padding: 0;
  margin: 4px 0 0 0;
  box-shadow: var(--box-shadow-md);
}

.autocomplete-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-md);
  color: var(--color-text);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background-color: rgba(0, 150, 136, 0.05);
}

.autocomplete-list.empty {
  padding: var(--spacing-md);
  color: var(--color-text-light);
  text-align: center;
}

.report-content {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  text-align: center;
  border-bottom: 4px solid var(--color-border);
}

.metric-card.success {
  border-bottom-color: var(--color-success);
  background-color: rgba(46, 204, 113, 0.05);
}

.metric-card.warning {
  border-bottom-color: var(--color-secondary);
  background-color: rgba(255, 152, 0, 0.05);
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary-dark);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.metric-card.success .metric-value { color: var(--color-success); }
.metric-card.warning .metric-value { color: var(--color-secondary); }

.metric-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-header {
  margin-bottom: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-light);
}

.delivery-item {
  border-left: 4px solid var(--color-border);
  margin-bottom: var(--spacing-md);
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--color-border);
}

.delivery-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-primary-dark);
  text-transform: capitalize;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.pending {
  background-color: rgba(255, 152, 0, 0.2);
  color: var(--color-secondary);
}

.status-badge.delivered {
  background-color: rgba(46, 204, 113, 0.2);
  color: var(--color-success);
}

.medicines-summary ul {
  padding-left: 20px;
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text);
}

.medicines-summary li {
  margin-bottom: 4px;
}
</style>
