import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PatientsView from '../views/PatientsView.vue'
import MedicinesView from '../views/MedicinesView.vue'
import DeliveriesView from '../views/DeliveriesView.vue'
import PatientReportView from '../views/PatientReportView.vue'
import LoginView from '../views/LoginView.vue'
import CompleteProfileView from '../views/CompleteProfileView.vue'
import UsersView from '../views/UsersView.vue'
import BatchDeliveriesView from '../views/BatchDeliveriesView.vue'
import ProfileView from '../views/ProfileView.vue'
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
        path: '/deliveries/edit/:id',
        name: 'edit-delivery',
        component: DeliveriesView,
        props: true,
        meta: { requiresAuth: true, roles: ['admin', 'manager', 'assistant'] }
    },
    {
        path: '/batch-deliveries',
        name: 'batch-deliveries',
        component: BatchDeliveriesView,
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
    },
    {
        path: '/complete-profile',
        name: 'complete-profile',
        component: CompleteProfileView,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView,
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const { isAuthenticated, userRole, isProfileComplete, isEmailVerified } = useAuth()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

    if (requiresAuth && !isAuthenticated.value) {
        next('/login')
    } else if (requiresAuth && !isEmailVerified.value) {
        // Redirigir a login si no está verificado para que vea el aviso
        next('/login')
    } else if (to.path === '/login' && isAuthenticated.value) {
        if (!isProfileComplete.value) {
            next('/complete-profile')
        } else {
            next('/')
        }
    } else if (isAuthenticated.value && !isProfileComplete.value && to.path !== '/complete-profile') {
        next('/complete-profile')
    } else if (isAuthenticated.value && isProfileComplete.value && to.path === '/complete-profile') {
        next('/')
    } else if (to.meta.roles && !to.meta.roles.includes(userRole.value)) {
        next('/') // Redirect to dashboard if unauthorized
    } else {
        next()
    }
})

export default router
