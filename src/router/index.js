import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import Swal from 'sweetalert2';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      name: 'login',
      component: () => import('../views/auth/Login.vue'),
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { 
          path: 'dashboard', 
          name: 'dashboard', 
          component: () => import('../views/admin/Dashboard.vue'),
          meta: { roles: ['admin', 'policia'] } // Definimos acceso para ambos
        },
        
        // Módulos de Gestión (Solo Alcaide/Admin)
        { 
          path: 'pabellones', 
          name: 'pabellones', 
          component: () => import('../views/admin/Pabellones.vue'),
          meta: { roles: ['admin'] } 
        },
        { 
          path: 'personal', 
          name: 'personal', 
          component: () => import('../views/admin/Personal.vue'),
          meta: { roles: ['admin'] } 
        },
        { 
          path: 'reclusos', 
          name: 'reclusos', 
          component: () => import('../views/admin/Reclusos.vue'), 
          meta: { roles: ['admin'] } 
        },
        { 
          path: 'reportes', 
          name: 'reportes', 
          component: () => import('../views/admin/Reportes.vue'),
          meta: { roles: ['admin'] } 
        },

        // Módulos Operativos (Admin y Policia)
        { 
          path: 'visitantes', 
          name: 'visitantes', 
          component: () => import('../views/admin/Visitantes.vue'),
          meta: { roles: ['admin', 'policia'] } 
        },
        { 
          path: 'scan', 
          name: 'scan', 
          component: () => import('../views/camera/Scan.vue'), 
          meta: { roles: ['admin', 'policia'] }
        },
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

// Guardia de seguridad optimizado
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const userRole = auth.user?.role;

  // 1. Verificar Autenticación
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' };
  }

  // 2. Verificar Roles (Usando la lógica de "roles" en plural siempre)
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    Swal.fire({
      icon: 'error',
      title: 'ACCESO RESTRINGIDO',
      text: 'No tiene los privilegios de Administrador para este módulo.',
      background: '#111418',
      color: '#fff',
      confirmButtonColor: '#10b981'
    });
    return { name: 'dashboard' };
  }
});

export default router;