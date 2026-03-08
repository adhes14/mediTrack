<template>
  <div class="patients-view container">
    <div class="header">
      <h1>Pacientes</h1>
    </div>
    
    <div v-if="loading" class="text-center">Cargando...</div>

    <div v-else-if="patients.length === 0" class="card empty-state">
      <p>No hay pacientes registrados.</p>
      <p class="text-muted">Añade uno nuevo usando el botón +.</p>
    </div>

    <div v-else class="patient-list">
      <div v-for="patient in patients" :key="patient.id" class="card patient-item" @click="editPatient(patient)">
        <div class="patient-info">
          <h3>{{ patient.name }}</h3>
          <p class="detail ci-badge" v-if="patient.ci">🪪 CI: {{ patient.ci }}</p>
          <p class="detail">📱 {{ patient.phone }}</p>
          <p class="detail">🏠 {{ patient.address }}</p>
          <p class="detail text-muted" v-if="patient.illness">{{ patient.illness }}</p>
        </div>
        <div class="patient-actions" @click.stop>
            <a v-if="patient.lat && patient.lon" 
               :href="`https://www.google.com/maps/search/?api=1&query=${patient.lat},${patient.lon}`" 
               target="_blank" 
               class="btn btn-map">
              🗺️ Mapa
            </a>
            <!-- Delete button could be here, but maybe inside edit form or separate action -->
        </div>
      </div>
    </div>

    <!-- FAB for adding patient -->
    <button class="fab" @click="showAddForm">+</button>

    <!-- Form Modal -->
    <PatientForm 
      v-if="showForm" 
      :initialData="currentPatient" 
      @save="handleSave" 
      @cancel="closeForm" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dbService } from '../services/DatabaseService'
import PatientForm from '../components/PatientForm.vue'
import { useDialog } from '../composables/useDialog'

const { alert } = useDialog()

const patients = ref([])
const loading = ref(true)
const showForm = ref(false)
const currentPatient = ref({})

const loadPatients = async () => {
  loading.value = true
  try {
    patients.value = await dbService.getAll('patients')
  } catch (err) {
    console.error('Error loading patients:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadPatients)

const showAddForm = () => {
  currentPatient.value = {}
  showForm.value = true
}

const editPatient = (patient) => {
  currentPatient.value = { ...patient } // clone to avoid direct mutation
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  currentPatient.value = {}
}

const handleSave = async (formData) => {
  try {
    if (formData.id) {
      await dbService.update('patients', formData)
    } else {
      await dbService.add('patients', formData)
    }
    await loadPatients()
    closeForm()
  } catch (err) {
    alert('Error guardando paciente: ' + err.message)
  }
}
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--spacing-md));
  right: var(--spacing-md);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--color-secondary);
  color: white;
  font-size: 24px;
  border: none;
  box-shadow: var(--box-shadow-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 100;
}

.fab:active {
  transform: scale(0.95);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-light);
}

.patient-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.2s;
}

.patient-item:active {
  background-color: #f0f0f0;
}

.patient-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  color: var(--color-primary-dark);
}

.detail {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.text-muted {
  color: var(--color-text-light);
}

.btn-map {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  text-decoration: none;
}

.btn-map:hover {
  background-color: rgba(0, 150, 136, 0.1);
}

.ci-badge {
  font-weight: 600;
  color: var(--color-primary, #009688);
}
</style>

