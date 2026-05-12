<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter, useRoute } from 'vue-router';
import { 
  LayoutDashboard, Camera, LogOut, Shield, 
  ChevronLeft, ChevronRight, Building2, Users2, 
  Contact, ShieldCheck, BarChart3, Menu, X, User
} from 'lucide-vue-next';
import escudoPoliciaUrl from '../assets/escudo_policia.jpg';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isCollapsed = ref(false);
const isMobileMenuOpen = ref(false);
const showLogoutModal = ref(false);

// --- 🎨 IDENTIDAD VISUAL ---
const theme = {
  policeDark: '#1b3022',
  gold: '#d4af37',
  bgBody: '#f1f5f9'
};

// --- 📱 CONTROL RESPONSIVO ---
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Cerrar menú móvil al cambiar de ruta
const navigateTo = (path) => {
  router.push(path);
  isMobileMenuOpen.value = false;
};

// --- 🛡️ NAVEGACIÓN ---
const navigation = computed(() => {
  const role = authStore.userRole;
  const menu = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Panel Operativo', roles: ['admin', 'policia', 'tecnico'] },
    { path: '/pabellones', icon: Building2, label: 'Sectores', roles: ['admin'] },
    { path: '/personal', icon: Shield, label: 'Staff Seguridad', roles: ['admin'] },
    { path: '/reclusos', icon: Users2, label: 'Población Penal', roles: ['admin'] },
    { path: '/visitantes', icon: Contact, label: 'Enrolar Visita', roles: ['admin', 'tecnico'] },
    { path: '/scan', icon: Camera, label: 'Control Biométrico', roles: ['admin', 'policia'] },
    { path: '/reportes', icon: BarChart3, label: 'Reportes', roles: ['admin'] }
  ];
  return menu.filter(item => item.roles.includes(role));
});

const handleLogout = () => { showLogoutModal.value = true; };
const confirmLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<template>
  <div class="flex h-screen overflow-hidden font-sans" :style="{ backgroundColor: theme.bgBody }">
    
    <transition name="fade">
      <div v-if="isMobileMenuOpen" 
           @click="isMobileMenuOpen = false"
           class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden">
      </div>
    </transition>

    <aside :class="[
      'fixed inset-y-0 left-0 z-[70] flex flex-col transition-all duration-300 transform lg:relative lg:translate-x-0 border-r border-white/5 shadow-2xl', 
      isCollapsed ? 'lg:w-20' : 'lg:w-64',
      isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
    ]"
    :style="{ backgroundColor: theme.policeDark }">
      
      <div class="h-24 flex flex-col items-center justify-center border-b border-white/10 px-6 relative">
        <div v-if="!isCollapsed || isMobileMenuOpen" class="flex flex-col items-center text-center">
          <img :src="escudoPoliciaUrl" class="h-10 w-auto mb-1 drop-shadow-md" />
          <span class="text-[10px] font-black tracking-widest text-white uppercase">Policía Boliviana</span>
          <span class="text-[8px] font-bold text-[#d4af37] uppercase tracking-[0.2em] opacity-80">Bio-Control</span>
        </div>
        <img v-else :src="escudoPoliciaUrl" class="h-8 w-auto" />
        
        <button @click="isMobileMenuOpen = false" class="absolute top-4 right-4 text-white/50 lg:hidden">
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto custom-scroll">
        <button v-for="item in navigation" :key="item.path" @click="navigateTo(item.path)"
                :class="['flex items-center gap-3 w-full p-3.5 rounded-xl transition-all relative group', 
                route.path === item.path ? 'bg-white/10 text-[#d4af37]' : 'text-white/60 hover:bg-white/5 hover:text-white']">
          <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
          <span v-if="!isCollapsed || isMobileMenuOpen" class="text-[10px] font-bold uppercase tracking-wider truncate">
            {{ item.label }}
          </span>
          <div v-if="route.path === item.path" class="absolute right-0 w-1 h-6 bg-[#d4af37] rounded-l-full"></div>
        </button>
      </nav>

      <div class="p-4 border-t border-white/10">
        <button @click="handleLogout" class="flex items-center gap-3 w-full p-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut class="h-5 w-5" />
          <span v-if="!isCollapsed || isMobileMenuOpen" class="text-[10px] font-bold uppercase tracking-widest">Salir</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0">
      
      <header class="h-20 flex items-center justify-between px-4 lg:px-10 z-40 shadow-xl shrink-0"
              :style="{ backgroundColor: theme.policeDark, borderBottom: '1px solid rgba(255,255,255,0.1)' }">
        
        <div class="flex items-center gap-3 lg:gap-4">
          <button @click="lg:isCollapsed = !isCollapsed; isMobileMenuOpen = true" 
                  class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
            <Menu class="h-5 w-5" />
          </button>

          <div class="flex flex-col border-l border-white/20 pl-4">
            <span class="text-[9px] lg:text-[11px] font-black text-white uppercase tracking-tighter leading-tight">
              {{ isCollapsed ? 'PB' : 'Comando General Penitenciario' }}
            </span>
            <div class="flex items-center gap-2">
               <div class="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
               <span class="text-[7px] lg:text-[9px] font-bold text-white/60 uppercase tracking-widest truncate">Seguridad Activa</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 lg:gap-5">
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-[10px] font-black text-white uppercase leading-none">{{ authStore.user?.username }}</span>
            <span class="text-[8px] font-bold text-[#d4af37] uppercase tracking-tighter">{{ authStore.userRole }}</span>
          </div>
          <div class="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#1b3022] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] font-black shadow-lg">
            {{ authStore.user?.username?.[0].toUpperCase() }}
          </div>
        </div>
      </header>

      <section class="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#f8fafc]">
        <div class="max-w-7xl mx-auto h-full">
          <router-view v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </section>
    </main>

    <div v-if="showLogoutModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div class="bg-white rounded-[2rem] shadow-2xl p-8 lg:p-10 w-full max-w-sm border-t-[8px] border-[#1b3022] animate-in zoom-in duration-200">
        <div class="text-center">
          <div class="bg-gray-100 text-[#1b3022] rounded-full w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center mx-auto mb-6 border-4 border-[#d4af37]">
            <ShieldCheck class="h-8 w-8 lg:h-10 lg:w-10" />
          </div>
          <h3 class="text-xl font-black text-[#1b3022] uppercase mb-2">Finalizar Turno</h3>
          <p class="text-gray-500 text-[11px] lg:text-xs font-medium mb-8">¿Confirmar cierre seguro de sesión operativa?</p>
          <div class="flex gap-3">
            <button @click="showLogoutModal = false" class="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-[9px]">Volver</button>
            <button @click="confirmLogout" class="flex-1 py-3.5 bg-[#1b3022] text-white rounded-xl font-bold uppercase text-[9px] shadow-lg">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar Personalizada */
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

/* Transiciones de Página */
.page-fade-enter-active, .page-fade-leave-active { transition: all 0.2s ease-out; }
.page-fade-enter-from { opacity: 0; transform: translateY(5px); }
.page-fade-leave-to { opacity: 0; transform: translateY(-5px); }

/* Transición de Overlay */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>