import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

// 1. Importación de TODOS los componentes
import Login from '../views/auth/Login.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import Dashboard from '../views/admin/Dashboard.vue';
import Reportes from '../views/admin/Reportes.vue';
import Personal from '../views/admin/Personal.vue';
import Pabellones from '../views/admin/Pabellones.vue';
import Reclusos from '../views/admin/Reclusos.vue';
import Visitantes from '../views/admin/Visitantes.vue';
import Scan from '../views/camera/Scan.vue'; 

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '/dashboard', name: 'dashboard', component: Dashboard },
      { path: '/reportes', name: 'reportes', component: Reportes },
      { path: '/personal', name: 'personal', component: Personal },
      { path: '/pabellones', name: 'pabellones', component: Pabellones },
      { path: '/reclusos', name: 'reclusos', component: Reclusos },
      { path: '/visitantes', name: 'visitantes', component: Visitantes },
      { path: '/scan', name: 'scan', component: Scan }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// ==============================================================================
// GUARDIA DE NAVEGACIÓN (Control por Roles Institucionales)
// ==============================================================================
router.beforeEach((to, from) => {
  const authStore = useAuthStore();
  const userRole = authStore.userRole; // Obtenemos el rol (admin, tecnico, policia)
  
  // 1. Protección de sesión básica
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }; 
  }

  // 2. Redirección si ya está autenticado
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }

  // --------------------------------------------------------------------------
  // 3. RESTRICCIONES DE SEGURIDAD POR ROL
  // --------------------------------------------------------------------------

  // A. Restricción para TÉCNICO: No puede ver Población Penal (Reclusos)
  if (to.name === 'reclusos' && userRole === 'tecnico') {
    console.warn("ALERTA: El Técnico no tiene autorización para ver la Población Penal.");
    return { name: 'dashboard' };
  }

  // B. Restricción para PERSONAL Y PABELLONES: Solo para ADMINISTRADORES
  // Ni el Policía ni el Técnico pueden entrar aquí
  const soloAdmin = ['personal', 'pabellones'];
  if (soloAdmin.includes(to.name) && userRole !== 'admin') {
    console.warn(`ACCESO DENEGADO: El rol ${userRole} no puede gestionar este módulo.`);
    return { name: 'dashboard' };
  }

  // 4. Si pasa todas las pruebas, adelante
  return true;
});

export default router;