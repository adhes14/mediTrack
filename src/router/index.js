import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PatientsView from '../views/PatientsView.vue'
import MedicinesView from '../views/MedicinesView.vue'
import DeliveriesView from '../views/DeliveriesView.vue'
import PatientReportView from '../views/PatientReportView.vue'
import LoginView from '../views/LoginView.vue'
import UsersView from '../views/UsersView.vue'
import { useAuth } from '../composables/useAuth'

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'dashboard',
        component: DashboardView,
        meta: { requiresAuth: true }
    },
    {
        path: '/patients',
        name: 'patients',
        component: PatientsView,
        meta: { requiresAuth: true, roles: ['admin', 'manager', 'assistant'] }
    },
    {
        path: '/medicines',
        name: 'medicines',
        component: MedicinesView,
        meta: { requiresAuth: true, roles: ['admin', 'manager', 'assistant'] }
    },
    {
        path: '/deliveries/new',
        name: 'new-delivery', // Note: DeliveriesView is used for creating/editing deliveries natively
        component: DeliveriesView,
        meta: { requiresAuth: true, roles: ['admin', 'manager', 'assistant'] }
    },
    {
        path: '/reports',
        name: 'reports',
        component: PatientReportView,
        meta: { requiresAuth: true }
    },
    {
        path: '/users',
        name: 'users',
        component: UsersView,
        meta: { requiresAuth: true, roles: ['admin'] }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const { isAuthenticated, userRole } = useAuth()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

    if (requiresAuth && !isAuthenticated.value) {
        next('/login')
    } else if (to.path === '/login' && isAuthenticated.value) {
        next('/')
    } else if (to.meta.roles && !to.meta.roles.includes(userRole.value)) {
        next('/') // Redirect to dashboard if unauthorized
    } else {
        next()
    }
})

export default router
