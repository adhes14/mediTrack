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
      <div v-for="medicine in medicines" :key="medicine.id" class="card medicine-item clickable"
        @click="editMedicine(medicine)">
        <div class="medicine-info">
          <h3>{{ medicine.name }}</h3>
          <p class="detail text-muted">{{ medicine.unit }}</p>
        </div>
        <button v-if="canEdit" class="delete-btn" @click.stop="confirmDelete(medicine)" title="Borrar medicamento">
          🗑️
        </button>
      </div>
    </div>

    <!-- FAB -->
    <button class="fab" @click="showAddForm">+</button>

    <!-- Form Modal -->
    <MedicineForm v-if="showForm" :initialData="currentMedicine" :readOnly="isAssistant && !!currentMedicine.id"
      :saving="saving" @save="handleSave" @cancel="closeForm" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { dbService } from '../services/DatabaseService'
import MedicineForm from '../components/MedicineForm.vue'
import { useDialog } from '../composables/useDialog'
import { useAuth } from '../composables/useAuth'

const { alert, confirm } = useDialog()
const { isAssistant } = useAuth()

const canEdit = computed(() => !isAssistant.value)

const medicines = ref([])
const loading = ref(true)
const showForm = ref(false)
const currentMedicine = ref({})
const saving = ref(false)

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

const confirmDelete = async (medicine) => {
  try {
    const deliveries = await dbService.getAll('deliveries')
    const relatedDeliveries = deliveries.filter(d => 
      d.medicines && d.medicines.some(m => m.medicineId === medicine.id)
    )

    let message = `¿Estás seguro de que deseas borrar el medicamento "${medicine.name}"?`
    if (relatedDeliveries.length > 0) {
      message = `Este medicamento está incluido en ${relatedDeliveries.length} registro(s) de entrega. Solo se borrará el medicamento, los registros relacionados se mantendrán. ¿Desea continuar?`
    }

    if (await confirm(message, 'Confirmar borrado')) {
      await dbService.delete('medicines', medicine.id)
      await loadMedicines()
    }
  } catch (err) {
    alert('Error al borrar el medicamento: ' + err.message)
  }
}

const handleSave = async (formData) => {
  saving.value = true
  try {
    // Duplicate check: name + unit (case insensitive and trimmed)
    const normalizedName = formData.name.trim().toLowerCase()
    const normalizedUnit = formData.unit.trim().toLowerCase()

    const isDuplicate = medicines.value.some(m => {
      // If we're editing, ignore the current medicine itself
      if (formData.id && m.id === formData.id) return false

      return m.name.trim().toLowerCase() === normalizedName &&
        m.unit.trim().toLowerCase() === normalizedUnit
    })

    if (isDuplicate) {
      alert(`Ya existe un medicamento con el nombre "${formData.name}" y la unidad "${formData.unit}".`)
      return
    }

    if (formData.id) {
      await dbService.update('medicines', formData)
    } else {
      await dbService.add('medicines', formData)
    }
    await loadMedicines()
    closeForm()
  } catch (err) {
    alert('Error guardando medicamento: ' + err.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: var(--spacing-lg);
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

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
  opacity: 0.6;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>
