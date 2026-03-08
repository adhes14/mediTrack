<template>
  <div class="medicine-form-overlay">
    <div class="card medicine-form-card">
      <h2>{{ isEditing ? (readOnly ? 'Detalles del Medicamento' : 'Editar Medicamento') : 'Nuevo Medicamento' }}</h2>
      <form @submit.prevent="handleSubmit">
        <label>Nombre del Medicamento</label>
        <input v-model="form.name" required :disabled="readOnly" placeholder="Ej: Paracetamol" />

        <label>Unidad</label>
        <select v-model="form.unit" required :disabled="readOnly">
          <option value="" disabled>Seleccione unidad</option>
          <option value="mg">mg</option>
          <option value="ml">ml</option>
          <option value="tabletas">tabletas</option>
          <option value="cápsulas">cápsulas</option>
          <option value="unidades">unidades</option>
          <option value="cajas">cajas</option>
        </select>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')">{{ readOnly ? 'Cerrar' : 'Cancelar' }}</button>
          <button v-if="!readOnly" type="submit" class="btn btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, computed } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  readOnly: {
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

onMounted(() => {
  if (props.initialData.id) {
    Object.assign(form, props.initialData)
  }
})

const handleSubmit = () => {
  emit('save', { ...form })
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
</style>
