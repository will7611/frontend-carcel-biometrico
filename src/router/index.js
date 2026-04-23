import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../views/auth/Login.vue') },
    { 
      path: '/dashboard', 
      component: () => import('../views/admin/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
        path: '/register', component: () => import('../views/admin/RegisterUser.vue')
    },
    { 
      path: '/scan', 
      component: () => import('../views/camera/Scan.vue'),
      meta: { requiresAuth: true }
    },
  ]
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;