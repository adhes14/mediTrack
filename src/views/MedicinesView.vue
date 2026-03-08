<template>
  <div class="medicines-view container">
    <div class="header">
      <h1>Medicamentos</h1>
    </div>

    <div v-if="loading" class="text-center">Cargando...</div>

    <div v-else-if="medicines.length === 0" class="card empty-state">
      <p>No hay medicamentos registrados.</p>
      <p class="text-muted">Añade uno nuevo usando el botón +.</p>
    </div>

    <div v-else class="medicine-list">
      <div v-for="medicine in medicines" :key="medicine.id" class="card medicine-item clickable" @click="editMedicine(medicine)">
        <div class="medicine-info">
          <h3>{{ medicine.name }}</h3>
          <p class="detail text-muted">{{ medicine.unit }}</p>
        </div>
        <!-- Optional: Delete button logic -->
      </div>
    </div>

    <!-- FAB -->
    <button class="fab" @click="showAddForm">+</button>

    <!-- Form Modal -->
    <MedicineForm 
      v-if="showForm" 
      :initialData="currentMedicine" 
      :readOnly="isAssistant && !!currentMedicine.id"
      @save="handleSave" 
      @cancel="closeForm" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { dbService } from '../services/DatabaseService'
import MedicineForm from '../components/MedicineForm.vue'
import { useDialog } from '../composables/useDialog'
import { useAuth } from '../composables/useAuth'

const { alert } = useDialog()
const { isAssistant } = useAuth()

const canEdit = computed(() => !isAssistant.value)

const medicines = ref([])
const loading = ref(true)
const showForm = ref(false)
const currentMedicine = ref({})

const loadMedicines = async () => {
  loading.value = true
  try {
    medicines.value = await dbService.getAll('medicines')
  } catch (err) {
    console.error('Error loading medicines:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadMedicines)

const showAddForm = () => {
  currentMedicine.value = {}
  showForm.value = true
}

const editMedicine = (medicine) => {
  currentMedicine.value = { ...medicine }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  currentMedicine.value = {}
}

const handleSave = async (formData) => {
  try {
    if (formData.id) {
      await dbService.update('medicines', formData)
    } else {
      await dbService.add('medicines', formData)
    }
    await loadMedicines()
    closeForm()
  } catch (err) {
    alert('Error guardando medicamento: ' + err.message)
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

.medicine-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  transition: background-color 0.2s;
}

.medicine-item.clickable {
  cursor: pointer;
}

.medicine-item.clickable:active {
  background-color: #f0f0f0;
}

.medicine-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  color: var(--color-primary-dark);
}

.text-muted {
  color: var(--color-text-light);
  margin: 0;
}
</style>

