<template>
  <div class="dashboard-view container">
    <div class="header">
      <h1>Calendario de Entregas</h1>
      <div class="month-nav">
        <button class="btn btn-secondary btn-sm" @click="changeMonth(-1)">←</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button class="btn btn-secondary btn-sm" @click="changeMonth(1)">→</button>
      </div>
    </div>
    
    <!-- Calendar Grid -->
    <div class="calendar-grid card">
      <div class="weekday" v-for="day in weekDays" :key="day">{{ day }}</div>
      
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="day-cell"
        :class="{ 
          'is-today': isToday(day.date),
          'is-selected': isSelected(day.date),
          'is-other-month': !day.isCurrentMonth
        }"
        @click="selectDate(day.date)"
      >
        <div class="day-number">{{ day.dayNumber }}</div>
        <div class="day-indicators">
          <span v-if="hasPending(day.date)" class="dot pending"></span>
          <span v-if="hasDelivered(day.date)" class="dot delivered"></span>
        </div>
      </div>
    </div>

    <!-- Daily Deliveries -->
    <div class="daily-deliveries">
      <div class="section-header">
        <h2>Entregas: {{ formatDate(selectedDate) }}</h2>
        <button class="btn btn-primary btn-sm" @click="$router.push('/deliveries/new')">+ Programar</button>
      </div>

      <div v-if="selectedDayDeliveries.length === 0" class="card empty-state">
        <p>No hay entregas programadas para este día.</p>
      </div>

      <div v-else class="delivery-list">
        <div 
          v-for="delivery in selectedDayDeliveries" 
          :key="delivery.id" 
          class="card delivery-item"
          :class="{ 'overdue': isOverdue(delivery) }"
        >
          <div class="delivery-header">
            <h3>{{ getPatientName(delivery.patientId) }}</h3>
            <span class="status-badge" :class="delivery.status" @click="toggleStatus(delivery)">
              {{ delivery.status === 'delivered' ? 'Entregado' : 'Pendiente' }}
            </span>
          </div>
          <p class="address">{{ getPatientAddress(delivery.patientId) }}</p>
          <div class="medicines-summary">
            <ul>
              <li v-for="item in delivery.medicines" :key="item.medicineId">
                {{ getMedicineName(item.medicineId) }}: {{ item.quantity }}
              </li>
            </ul>
          </div>
          <div v-if="isOverdue(delivery) && delivery.status !== 'delivered'" class="alert-text">
            ⚠️ Retrasado
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dbService } from '../services/DatabaseService'

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const deliveries = ref([])
const patients = ref([])
const medicines = ref([])

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
    try {
    const [dels, pts, meds] = await Promise.all([
      dbService.getAll('deliveries'),
      dbService.getAll('patients'),
      dbService.getAll('medicines')
    ])
    deliveries.value = dels
    patients.value = pts
    medicines.value = meds
  } catch (err) {
    console.error('Error loading data:', err)
  }
}

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())
})

const currentYear = computed(() => currentDate.value.getFullYear())

const changeMonth = (delta) => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + delta)
  currentDate.value = newDate
}

const calendarDays = computed(() => {
  const fileDate = currentDate.value
  const year = fileDate.getFullYear()
  const month = fileDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
  
  const days = []
  
  // Previous month fill
  for (let i = 0; i < startingDayOfWeek; i++) {
    const d = new Date(year, month, -startingDayOfWeek + i + 1)
    days.push({
      date: d,
      dayNumber: d.getDate(),
      isCurrentMonth: false
    })
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: true
    })
  }
  
  // Next month fill (to complete 6 rows or just rectangular)
  const remainingCells = 42 - days.length
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: false
    })
  }
  
  return days
})

const selectDate = (date) => {
  selectedDate.value = date
}

const isToday = (date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const isSelected = (date) => {
  return date.toDateString() === selectedDate.value.toDateString()
}

// Helpers for Data
const formatDate = (date) => {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const getDeliveriesForDate = (date) => {
  const dateStr = date.toISOString().split('T')[0]
  return deliveries.value.filter(d => d.scheduledDate === dateStr)
}

const hasPending = (date) => {
  return getDeliveriesForDate(date).some(d => d.status === 'pending')
}

const hasDelivered = (date) => {
  return getDeliveriesForDate(date).some(d => d.status === 'delivered')
}

const selectedDayDeliveries = computed(() => {
  return getDeliveriesForDate(selectedDate.value)
})

const getPatientName = (id) => patients.value.find(p => p.id === id)?.name || 'Desconocido'
const getPatientAddress = (id) => patients.value.find(p => p.id === id)?.address || ''
const getMedicineName = (id) => medicines.value.find(m => m.id === id)?.name || ''

const isOverdue = (delivery) => {
  if (delivery.status === 'delivered') return false
  const deliveryDate = new Date(delivery.scheduledDate)
  const today = new Date()
  today.setHours(0,0,0,0) // Reset time to start of day
  // If delivery date is before today, it's overdue
  return deliveryDate < today
}

const toggleStatus = async (delivery) => {
  const newStatus = delivery.status === 'pending' ? 'delivered' : 'pending'
  const updated = { ...delivery, status: newStatus }
  
  try {
    await dbService.update('deliveries', updated)
    // Update local state
    const index = deliveries.value.findIndex(d => d.id === delivery.id)
    if (index !== -1) {
      deliveries.value[index] = updated
    }
  } catch (err) {
    alert('Error actualizando estado: ' + err.message)
  }
}
</script>

<style scoped>
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.month-nav h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-primary-dark);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: var(--color-border);
  padding: 1px;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
}

.weekday {
  background-color: var(--color-bg);
  text-align: center;
  padding: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: bold;
  color: var(--color-text-light);
}

.day-cell {
  background-color: var(--color-surface);
  aspect-ratio: 1; /* Square cells */
  padding: var(--spacing-xs);
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.day-cell:hover {
  background-color: #fafafa;
}

.day-cell.is-selected {
  background-color: rgba(0, 150, 136, 0.1);
  box-shadow: inset 0 0 0 2px var(--color-primary);
}

.day-cell.is-today .day-number {
  background-color: var(--color-primary);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell.is-other-month {
  background-color: #f9f9f9;
  color: #ccc;
}

.day-indicators {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot.pending { background-color: var(--color-secondary); }
.dot.delivered { background-color: var(--color-success); }

/* Daily Deliveries */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.delivery-item {
  border-left: 4px solid var(--color-border);
}

.delivery-item.overdue {
  border-left-color: var(--color-danger);
  background-color: rgba(231, 76, 60, 0.05);
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.address {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  margin-bottom: var(--spacing-sm);
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
}

.status-badge.pending {
  background-color: rgba(255, 152, 0, 0.2);
  color: var(--color-secondary);
}

.status-badge.delivered {
  background-color: rgba(46, 204, 113, 0.2);
  color: var(--color-success);
}

.medicines-summary ul {
  padding-left: 20px;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.alert-text {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  font-weight: bold;
  margin-top: var(--spacing-xs);
}
</style>

