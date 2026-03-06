<template>
  <div class="patient-form-overlay">
    <div class="card patient-form-card">
      <h2>{{ isEditing ? 'Editar Paciente' : 'Nuevo Paciente' }}</h2>
      <form @submit.prevent="handleSubmit">
        <label>Nombre Completo</label>
        <input v-model="form.name" required placeholder="Ej: Juan Pérez" />

        <label>Teléfono</label>
        <input v-model="form.phone" type="tel" required placeholder="Ej: +591 70000000" />

        <label>Dirección</label>
        <textarea v-model="form.address" required placeholder="Dirección descriptiva"></textarea>

        <div class="row">
          <div class="col">
            <label>Latitud</label>
            <input v-model.number="form.lat" type="number" step="any" placeholder="-17.000" />
          </div>
          <div class="col">
            <label>Longitud</label>
            <input v-model.number="form.lon" type="number" step="any" placeholder="-66.000" />
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm mb-2" @click="getLocation">
          📍 Obtener Ubicación Actual
        </button>

        <label>Enfermedad / Diagnóstico</label>
        <input v-model="form.illness" placeholder="Ej: Diabetes Tipo 2" />

        <label>Tratamiento / Notas</label>
        <textarea v-model="form.treatment_info" placeholder="Descripción del tratamiento..."></textarea>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, computed } from 'vue'
import { useDialog } from '../composables/useDialog'

const { alert } = useDialog()

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['save', 'cancel'])

const isEditing = computed(() => !!props.initialData.id)

const form = reactive({
  name: '',
  phone: '',
  address: '',
  lat: null,
  lon: null,
  illness: '',
  treatment_info: ''
})

onMounted(() => {
  if (props.initialData.id) {
    Object.assign(form, props.initialData)
  }
})

const handleSubmit = () => {
  emit('save', { ...form })
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
</style>
