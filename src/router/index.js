import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PatientsView from '../views/PatientsView.vue'
import MedicinesView from '../views/MedicinesView.vue'
import DeliveriesView from '../views/DeliveriesView.vue'

const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: DashboardView
    },
    {
        path: '/patients',
        name: 'patients',
        component: PatientsView
    },
    {
        path: '/medicines',
        name: 'medicines',
        component: MedicinesView
    },
    {
        path: '/deliveries/new',
        name: 'new-delivery',
        component: DeliveriesView
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
