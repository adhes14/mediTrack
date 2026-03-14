<template>
  <div class="medicine-form-overlay">
    <div class="card medicine-form-card">
      <h2>{{ isEditing ? (readOnly ? 'Detalles del Medicamento' : 'Editar Medicamento') : 'Nuevo Medicamento' }}</h2>
      <form @submit.prevent="handleSubmit">
        <label>Nombre del Medicamento</label>
        <input 
          v-model="form.name" 
          :disabled="readOnly || saving" 
          placeholder="Ej: Paracetamol" 
          :class="{ 'has-error': errors.name }"
        />
        <p v-if="errors.name" class="error-text">{{ errors.name }}</p>

        <label>Unidad</label>
        <select 
          v-model="form.unit" 
          :disabled="readOnly || saving"
          :class="{ 'has-error': errors.unit }"
        >
          <option value="" disabled>Seleccione unidad</option>
          <option value="mg">mg</option>
          <option value="ml">ml</option>
          <option value="tabletas">tabletas</option>
          <option value="cápsulas">cápsulas</option>
          <option value="unidades">unidades</option>
          <option value="cajas">cajas</option>
        </select>
        <p v-if="errors.unit" class="error-text">{{ errors.unit }}</p>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')" :disabled="saving">{{ readOnly ? 'Cerrar' : 'Cancelar' }}</button>
          <button 
            v-if="!readOnly" 
            type="submit" 
            class="btn btn-primary"
            :disabled="saving || (isEditing && !isDirty)"
          >
            {{ saving ? 'Guardando... ⏳' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, computed, ref } from 'vue'

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

const form = reactive({
  name: '',
  unit: ''
})

const errors = reactive({
  name: '',
  unit: ''
})

const isDirty = computed(() => {
  return form.name !== (props.initialData.name || '') || form.unit !== (props.initialData.unit || '')
})

onMounted(() => {
  if (props.initialData.id) {
    Object.assign(form, props.initialData)
  }
})

const validate = () => {
  let valid = true
  errors.name = ''
  errors.unit = ''

  if (!form.name.trim()) {
    errors.name = 'El nombre es obligatorio'
    valid = false
  }
  
  if (!form.unit) {
    errors.unit = 'La unidad es obligatoria'
    valid = false
  }

  return valid
}

const handleSubmit = () => {
  if (validate()) {
    emit('save', { ...form })
  }
}
</script>

<style scoped>
.medicine-form-overlay {
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

.medicine-form-card {
  width: 100%;
  max-width: 400px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.error-text {
  color: var(--color-danger, #e74c3c);
  font-size: var(--font-size-sm, 0.85rem);
  margin: 4px 0 8px 0;
  font-weight: 500;
}

input.has-error, select.has-error {
  border-color: var(--color-danger, #e74c3c);
  outline: none;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}
</style>
