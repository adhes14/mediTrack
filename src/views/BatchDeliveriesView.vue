<template>
  <div class="batch-deliveries-view container">
    <div class="header">
      <h1>Programar Entregas en Lote</h1>
      <button class="btn btn-secondary btn-sm" @click="$router.push('/')">← Volver</button>
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

      <div class="form-row">
        <div class="form-group half">
          <label>Fecha de Inicio</label>
          <input type="date" v-model="form.startDate" :disabled="saving" :class="{ 'has-error': errors.startDate }" />
          <p v-if="errors.startDate" class="error-text">{{ errors.startDate }}</p>
        </div>

        <div class="form-group half">
          <label>Fecha de Fin</label>
          <input type="date" v-model="form.endDate" :disabled="saving" :class="{ 'has-error': errors.endDate }" />
          <p v-if="errors.endDate" class="error-text">{{ errors.endDate }}</p>
        </div>
      </div>

      <div class="form-group">
        <label>Periodicidad</label>
        <select v-model="form.periodicity" :disabled="saving" :class="{ 'has-error': errors.periodicity }">
          <option value="monthly">Mensual (mismo día cada mes)</option>
          <option value="weekly">Semanal (mismo día cada semana)</option>
          <option value="daily">Diario (todos los días)</option>
        </select>
        <p v-if="errors.periodicity" class="error-text">{{ errors.periodicity }}</p>
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

      <div v-if="previewDates.length > 0" class="preview-section card">
        <h3>Se crearán {{ previewDates.length }} entregas en las siguientes fechas:</h3>
        <ul class="dates-list">
          <li v-for="(date, i) in previewDates" :key="i">{{ formatDate(date) }}</li>
        </ul>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="$router.push('/')" :disabled="saving">Cancelar</button>
        <button type="submit" class="btn btn-primary btn-block" :disabled="saving">
          {{ saving ? 'Guardando... ⏳' : 'Generar Entregas' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { dbService } from '../services/DatabaseService'
import { useDialog } from '../composables/useDialog'

const { alert } = useDialog()
const router = useRouter()

const patients = ref([])
const medicines = ref([])
const saving = ref(false)

const getTodayString = () => new Date().toISOString().split('T')[0]

const form = reactive({
  patientId: '',
  startDate: getTodayString(),
  endDate: '',
  periodicity: 'monthly',
  medicines: [{ medicineId: '', quantity: 30 }]
})

const errors = reactive({
  patientId: '',
  startDate: '',
  endDate: '',
  periodicity: '',
  medicines: ''
})

const previewDates = ref([])

onMounted(async () => {
  try {
    const [pts, meds] = await Promise.all([
      dbService.getAll('patients'),
      dbService.getAll('medicines')
    ])
    patients.value = pts.filter(p => p.status !== 'inactive')
    medicines.value = meds
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

// Genera el arreglo de fechas basado en los parámetros
const generateDates = () => {
  if (!form.startDate || !form.endDate) return []
  
  const start = new Date(form.startDate + 'T12:00:00') // Usar mediodía para evitar problemas de zona horaria
  const end = new Date(form.endDate + 'T12:00:00')
  
  if (start > end) return []

  const dates = []
  let current = new Date(start)

  if (form.periodicity === 'monthly') {
    const targetDay = start.getDate()
    while (current <= end) {
      dates.push(new Date(current))
      
      // Mover al mes siguiente
      let targetMonth = current.getMonth() + 1
      let targetYear = current.getFullYear()
      if (targetMonth > 11) {
        targetMonth = 0
        targetYear++
      }

      // Encontrar el último día válido de ese mes si el targetDay excede los días del mes
      const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      const actualDay = Math.min(targetDay, lastDayOfMonth)

      current = new Date(targetYear, targetMonth, actualDay, 12, 0, 0)
    }
  } else if (form.periodicity === 'weekly') {
    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 7)
    }
  } else if (form.periodicity === 'daily') {
    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
  }

  // Filtrar si el bucle causó que el último elemento sea mayor al final debido a la precisión
  return dates.filter(d => {
    // Comparar fecha sin hora
    const dStr = d.toISOString().split('T')[0]
    return dStr <= form.endDate
  })
}

watch([() => form.startDate, () => form.endDate, () => form.periodicity], () => {
  previewDates.value = generateDates()
}, { deep: true })

const validate = () => {
  let valid = true
  errors.patientId = ''
  errors.startDate = ''
  errors.endDate = ''
  errors.periodicity = ''
  errors.medicines = ''

  if (!form.patientId) {
    errors.patientId = 'Seleccione un paciente'
    valid = false
  }

  if (!form.startDate) {
    errors.startDate = 'La fecha de inicio es obligatoria'
    valid = false
  }

  if (!form.endDate) {
    errors.endDate = 'La fecha de fin es obligatoria'
    valid = false
  }
  
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    errors.endDate = 'La fecha final debe ser mayor o igual a la de inicio'
    valid = false
  }

  if (form.medicines.length === 0 || form.medicines.some(m => !m.medicineId || m.quantity < 1)) {
    errors.medicines = 'Complete la información del medicamento'
    valid = false
  }

  if (previewDates.value.length === 0 && form.startDate && form.endDate && form.startDate <= form.endDate) {
     errors.endDate = 'El rango no genera ninguna fecha con esta periodicidad'
     valid = false
  }

  return valid
}

const handleSubmit = async () => {
  if (!validate()) return

  saving.value = true
  try {
    const datesToSchedule = generateDates()
    
    // Preparar el arreglo de promesas para guardar en lote (uno a uno en firebase, o con un batch si tuvieramos un helper, pero dbService.add lo hace uno a uno)
    const promises = datesToSchedule.map(dateObj => {
      const deliveryRecord = {
        patientId: form.patientId,
        scheduledDate: dateObj.toISOString().split('T')[0],
        medicines: JSON.parse(JSON.stringify(form.medicines)), // Clone to avoid references
        status: 'pending'
      }
      return dbService.add('deliveries', deliveryRecord)
    })

    await Promise.all(promises)
    
    alert(`Se programaron ${datesToSchedule.length} entregas correctamente.`)
    router.push('/')
  } catch (err) {
    alert('Error guardando entregas: ' + err.message)
  } finally {
    saving.value = false
  }
}

const formatDate = (date) => {
  return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<style scoped>
.form-row {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.half {
  flex: 1;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
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

.preview-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: rgba(0, 150, 136, 0.05);
  border-left: 4px solid var(--color-primary);
}

.preview-section h3 {
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary-dark);
}

.dates-list {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin: 0;
  padding-left: 20px;
  max-height: 150px;
  overflow-y: auto;
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

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  .half {
    margin-bottom: var(--spacing-md);
  }
}
</style>
