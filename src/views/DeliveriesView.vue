<template>
  <div class="deliveries-view container">
    <div class="header">
      <h1>Programar Entrega</h1>
    </div>

    <form class="card delivery-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Paciente</label>
        <select v-model="form.patientId" required>
          <option value="" disabled>Seleccione un paciente</option>
          <option v-for="patient in patients" :key="patient.id" :value="patient.id">
            {{ patient.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Fecha de Entrega</label>
        <input type="date" v-model="form.scheduledDate" required />
      </div>

      <div class="medicines-section">
        <label>Medicamentos</label>
        <div v-for="(item, index) in form.medicines" :key="index" class="medicine-row">
          <select v-model="item.medicineId" required>
            <option value="" disabled>Medicamento</option>
            <option v-for="med in medicines" :key="med.id" :value="med.id">
              {{ med.name }} ({{ med.unit }})
            </option>
          </select>
          <input type="number" v-model.number="item.quantity" min="1" placeholder="Cant." required class="qty-input" />
          <button type="button" class="btn btn-secondary btn-remove" @click="removeMedicine(index)" v-if="form.medicines.length > 1">
            ✕
          </button>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" @click="addMedicineRow">+ Agregar Medicamento</button>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="$router.push('/')">Cancelar</button>
        <button type="submit" class="btn btn-primary btn-block">Guardar Entrega</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dbService } from '../services/DatabaseService'
import { useDialog } from '../composables/useDialog'

const { alert } = useDialog()

const router = useRouter()
const patients = ref([])
const medicines = ref([])

const form = reactive({
  patientId: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  medicines: [{ medicineId: '', quantity: 1 }],
  status: 'pending' // Default status
})

onMounted(async () => {
  try {
    const [pts, meds] = await Promise.all([
      dbService.getAll('patients'),
      dbService.getAll('medicines')
    ])
    patients.value = pts
    medicines.value = meds
  } catch (err) {
    console.error('Error loading data:', err)
  }
})

const addMedicineRow = () => {
  form.medicines.push({ medicineId: '', quantity: 1 })
}

const removeMedicine = (index) => {
  form.medicines.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    // Validate
    if (!form.patientId) return alert('Seleccione un paciente')
    if (form.medicines.some(m => !m.medicineId || m.quantity < 1)) return alert('Complete los medicamentos')

    // Prepare data (ensure deep copy if needed, but reactive is fine here)
    await dbService.add('deliveries', form)
    alert('Entrega programada con éxito')
    router.push('/')
  } catch (err) {
    alert('Error guardando entrega: ' + err.message)
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: var(--spacing-md);
}

.medicines-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border-radius: var(--border-radius-md);
}

.medicine-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.qty-input {
  width: 80px;
}

.btn-remove {
  padding: 0 var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.actions {
  display: flex;
  gap: var(--spacing-md);
}

.btn-sm {
  margin-top: var(--spacing-xs);
}
</style>

