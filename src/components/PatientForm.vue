<template>
  <div class="patient-form-overlay">
    <div class="card patient-form-card">
      <h2>{{ isEditing ? (readOnly ? 'Detalles del Paciente' : 'Editar Paciente') : 'Nuevo Paciente' }}</h2>
      <form @submit.prevent="handleSubmit">
        <label>CI (Cédula de Identidad)</label>
        <input v-model="form.ci" :disabled="readOnly || saving" placeholder="Ej: 12345678"
          :class="{ 'has-error': errors.ci || ciError }" />
        <p v-if="ciError || errors.ci" class="error-text">{{ ciError || errors.ci }}</p>

        <label>Nombre Completo</label>
        <input v-model="form.name" :disabled="readOnly || saving" placeholder="Ej: Juan Pérez"
          :class="{ 'has-error': errors.name }" />
        <p v-if="errors.name" class="error-text">{{ errors.name }}</p>

        <label>Teléfono</label>
        <input v-model="form.phone" type="tel" :disabled="readOnly || saving" placeholder="Ej: +591 70000000"
          :class="{ 'has-error': errors.phone }" />
        <p v-if="errors.phone" class="error-text">{{ errors.phone }}</p>

        <label>Dirección</label>
        <textarea v-model="form.address" :disabled="readOnly || saving" placeholder="Dirección descriptiva"
          :class="{ 'has-error': errors.address }"></textarea>
        <p v-if="errors.address" class="error-text">{{ errors.address }}</p>

        <div class="row">
          <div class="col">
            <label>Latitud</label>
            <input v-model.number="form.lat" type="number" step="any" :disabled="readOnly || saving"
              placeholder="-17.000" />
          </div>
          <div class="col">
            <label>Longitud</label>
            <input v-model.number="form.lon" type="number" step="any" :disabled="readOnly || saving"
              placeholder="-66.000" />
          </div>
        </div>
        <button v-if="!readOnly" type="button" class="btn btn-secondary btn-sm mb-2" @click="getLocation"
          :disabled="saving">
          📍 Obtener Ubicación Actual
        </button>

        <label class="full-width-label">Enfermedad / Diagnóstico</label>
        <input v-model="form.illness" :disabled="readOnly || saving" placeholder="Ej: Diabetes Tipo 2"
          :class="{ 'has-error': errors.illness }" />
        <p v-if="errors.illness" class="error-text">{{ errors.illness }}</p>

        <label>Tratamiento / Notas</label>
        <textarea v-model="form.treatment_info" :disabled="readOnly || saving"
          placeholder="Descripción del tratamiento..."></textarea>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')" :disabled="saving">{{ readOnly ?
            'Cerrar' : 'Cancelar' }}</button>
          <button v-if="!readOnly" type="submit" class="btn btn-primary" :disabled="saving || (isEditing && !isDirty)">
            {{ saving ? 'Guardando... ⏳' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useDialog } from '../composables/useDialog'
import { dbService } from '../services/DatabaseService'

const { alert } = useDialog()

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])

const isEditing = computed(() => !!props.initialData.id)

const ciError = ref('')

const form = reactive({
  ci: '',
  name: '',
  phone: '',
  address: '',
  lat: -17.514499,
  lon: 63.170764,
  illness: '',
  treatment_info: ''
})

const errors = reactive({
  ci: '',
  name: '',
  phone: '',
  address: '',
  illness: ''
})

const isDirty = computed(() => {
  return form.ci !== (props.initialData.ci || '') ||
    form.name !== (props.initialData.name || '') ||
    form.phone !== (props.initialData.phone || '') ||
    form.address !== (props.initialData.address || '') ||
    form.lat !== (props.initialData.lat || null) ||
    form.lon !== (props.initialData.lon || null) ||
    form.illness !== (props.initialData.illness || '') ||
    form.treatment_info !== (props.initialData.treatment_info || '')
})

onMounted(() => {
  if (props.initialData.id) {
    Object.assign(form, props.initialData)
  }
})

const validate = () => {
  let valid = true
  errors.ci = ''
  errors.name = ''
  errors.phone = ''
  errors.address = ''
  errors.illness = ''

  if (!form.ci.trim()) {
    errors.ci = 'El CI es obligatorio'
    valid = false
  }
  if (!form.name.trim()) {
    errors.name = 'El nombre es obligatorio'
    valid = false
  }
  if (!form.phone.trim()) {
    errors.phone = 'El teléfono es obligatorio'
    valid = false
  }
  if (!form.address.trim()) {
    errors.address = 'La dirección es obligatoria'
    valid = false
  }
  if (!form.illness.trim()) {
    errors.illness = 'La enfermedad es obligatoria'
    valid = false
  }

  return valid
}

const handleSubmit = async () => {
  ciError.value = ''

  if (!validate()) {
    return
  }

  // Validate CI uniqueness
  const ciTrimmed = form.ci.trim()

  try {
    const existing = await dbService.getByField('patients', 'ci', ciTrimmed)
    // If editing, exclude current patient from uniqueness check
    const isDuplicate = existing.some(p => p.id !== form.id)
    if (isDuplicate) {
      ciError.value = 'Ya existe un paciente con este CI'
      return
    }
  } catch (err) {
    console.error('Error validating CI:', err)
  }

  emit('save', { ...form, ci: ciTrimmed })
}

const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.lat = position.coords.latitude
        form.lon = position.coords.longitude
      },
      (error) => {
        alert('Error obteniendo ubicación: ' + error.message)
      }
    )
  } else {
    alert('Geolocalización no soportada en este navegador.')
  }
}
</script>

<style scoped>
.patient-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: var(--spacing-md);
}

.patient-form-card {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.row {
  display: flex;
  gap: var(--spacing-md);
}

.col {
  flex: 1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.mb-2 {
  margin-bottom: var(--spacing-sm);
}

.btn-sm {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.error-text {
  color: var(--color-danger, #e74c3c);
  font-size: var(--font-size-sm, 0.85rem);
  margin: 4px 0 8px 0;
  font-weight: 500;
}

input.has-error,
select.has-error,
textarea.has-error {
  border-color: var(--color-danger, #e74c3c);
  outline: none;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}

.full-width-label {
  display: block;
}
</style>
