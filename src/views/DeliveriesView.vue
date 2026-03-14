<template>
  <div class="deliveries-view container">
    <div class="header">
      <h1>{{ isEdit ? 'Editar Entrega' : 'Programar Entrega' }}</h1>
    </div>

    <form class="card delivery-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Paciente</label>
        <select v-model="form.patientId" :disabled="saving" :class="{ 'has-error': errors.patientId }">
          <option value="" disabled>Seleccione un paciente</option>
          <option v-for="patient in patients" :key="patient.id" :value="patient.id">
            {{ patient.name }}
          </option>
        </select>
        <p v-if="errors.patientId" class="error-text">{{ errors.patientId }}</p>
      </div>

      <div class="form-group">
        <label>Fecha de Entrega</label>
        <input type="date" v-model="form.scheduledDate" :disabled="saving" :class="{ 'has-error': errors.scheduledDate }" />
        <p v-if="errors.scheduledDate" class="error-text">{{ errors.scheduledDate }}</p>
      </div>

      <div class="medicines-section" :class="{ 'has-error': errors.medicines }">
        <label>Medicamentos</label>
        <div v-for="(item, index) in form.medicines" :key="index" class="medicine-row">
          <select v-model="item.medicineId" :disabled="saving">
            <option value="" disabled>Medicamento</option>
            <option v-for="med in medicines" :key="med.id" :value="med.id">
              {{ med.name }} ({{ med.unit }})
            </option>
          </select>
          <input type="number" v-model.number="item.quantity" min="1" placeholder="Cantidad" 
                 :disabled="saving" class="qty-input" />
          <button type="button" class="btn btn-secondary btn-remove" @click="removeMedicine(index)"
            v-if="form.medicines.length > 1" :disabled="saving">
            ✕
          </button>
        </div>
        <p v-if="errors.medicines" class="error-text">{{ errors.medicines }}</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="addMedicineRow" :disabled="saving">+ Agregar Medicamento</button>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="$router.push('/')" :disabled="saving">Cancelar</button>
        <button type="submit" class="btn btn-primary btn-block" :disabled="saving || (isEdit && !isDirty)">
          {{ saving ? 'Guardando... ⏳' : (isEdit ? 'Actualizar Entrega' : 'Guardar Entrega') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { dbService } from '../services/DatabaseService'
import { useDialog } from '../composables/useDialog'

const props = defineProps({
  id: {
    type: String,
    default: ''
  }
})

const { alert } = useDialog()

const router = useRouter()
const patients = ref([])
const medicines = ref([])
const isEdit = computed(() => !!props.id)

const saving = ref(false)
const initialFormString = ref('')

const form = reactive({
  patientId: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  medicines: [{ medicineId: '', quantity: 30 }],
  status: 'pending' // Default status
})

const errors = reactive({
  patientId: '',
  scheduledDate: '',
  medicines: ''
})

const isDirty = computed(() => {
  return JSON.stringify(form) !== initialFormString.value
})

onMounted(async () => {
  try {
    const [pts, meds] = await Promise.all([
      dbService.getAll('patients'),
      dbService.getAll('medicines')
    ])
    patients.value = pts
    medicines.value = meds

    if (isEdit.value) {
      const delivery = await dbService.getById('deliveries', props.id)
      if (delivery) {
        form.patientId = delivery.patientId
        form.scheduledDate = delivery.scheduledDate
        form.medicines = JSON.parse(JSON.stringify(delivery.medicines))
        form.status = delivery.status
      } else {
        alert('Entrega no encontrada')
        router.push('/')
      }
    }
    
    // Almacenamos el estado inicial una vez cargados los datos para comparar en la edición
    initialFormString.value = JSON.stringify(form)
  } catch (err) {
    console.error('Error loading data:', err)
  }
})

const addMedicineRow = () => {
  form.medicines.push({ medicineId: '', quantity: 30 })
}

const removeMedicine = (index) => {
  form.medicines.splice(index, 1)
}

const validate = () => {
  let valid = true
  errors.patientId = ''
  errors.scheduledDate = ''
  errors.medicines = ''

  if (!form.patientId) {
    errors.patientId = 'Seleccione un paciente'
    valid = false
  }

  if (!form.scheduledDate) {
    errors.scheduledDate = 'La fecha es obligatoria'
    valid = false
  }

  if (form.medicines.length === 0 || form.medicines.some(m => !m.medicineId || m.quantity < 1)) {
    errors.medicines = 'Complete la información del medicamento'
    valid = false
  }

  return valid
}

const handleSubmit = async () => {
  if (!validate()) return

  saving.value = true
  try {
    if (isEdit.value) {
      await dbService.update('deliveries', { ...form, id: props.id })
    } else {
      await dbService.add('deliveries', form)
    }
    router.push('/')
  } catch (err) {
    alert('Error guardando entrega: ' + err.message)
  } finally {
    saving.value = false
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

.error-text {
  color: var(--color-danger, #e74c3c);
  font-size: var(--font-size-sm, 0.85rem);
  margin: 4px 0 8px 0;
  font-weight: 500;
}

input.has-error, select.has-error, textarea.has-error, .medicines-section.has-error {
  border-color: var(--color-danger, #e74c3c);
  outline: none;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}
</style>
