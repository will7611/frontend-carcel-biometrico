import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      name: 'login',
      component: () => import('../views/auth/Login.vue') 
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('../views/admin/Dashboard.vue') },
        
        // Módulos de Gestión (Solo Admin)
        { 
          path: 'pabellones', 
          name: 'pabellones', 
          component: () => import('../views/admin/Pabellones.vue'),
          meta: { role: 'admin' } 
        },
        { 
          path: 'personal', 
          name: 'personal', 
          component: () => import('../views/admin/Personal.vue'),
          meta: { role: 'admin' } 
        },

        // Módulos Operativos (Admin y Policia)
        { 
          path: 'reclusos', 
          name: 'reclusos', 
          component: () => import('../views/admin/Reclusos.vue') 
        },
        { 
          path: 'visitantes', 
          name: 'visitantes', 
          component: () => import('../views/admin/Visitantes.vue') 
        },
        { 
          path: 'scan', 
          name: 'scan', 
          component: () => import('../views/camera/Scan.vue') 
        },
        // NUEVA RUTA DE REPORTES
        { 
          path: 'reportes', 
          name: 'reportes', 
          component: () => import('../views/admin/Reportes.vue') 
        },
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

// Navegación segura (Sintaxis moderna sin next() callback)
router.beforeEach((to) => {
  const auth = useAuthStore();
  
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' };
  }
  
  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return { name: 'dashboard' };
  }
});

export default router;