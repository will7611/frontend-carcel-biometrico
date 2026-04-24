<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter, useRoute } from 'vue-router';
import { 
  LayoutDashboard, Camera, LogOut, Menu, X, 
  ShieldCheck, Palette, ChevronLeft, ChevronRight,
  Building2, Users2, Contact, ShieldAlert, BarChart3
} from 'lucide-vue-next';
import escudoPoliciaUrl from '../assets/escudo_policia.jpg';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isMobileOpen = ref(false);
const isCollapsed = ref(false);
const showProfileMenu = ref(false);

// --- SISTEMA DE TEMAS ---
const themes = {
  emerald: { primary: '#10b981', shadow: 'rgba(16, 185, 129, 0.3)' },
  sky: { primary: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.3)' },
  rose: { primary: '#f43f5e', shadow: 'rgba(244, 63, 94, 0.3)' },
  amber: { primary: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.3)' }
};
const currentTheme = ref('emerald');

// --- NAVEGACIÓN DINÁMICA POR ROL ---
const navigation = computed(() => {
  const role = authStore.user?.role;
  
  const menu = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Panel Operativo', roles: ['admin', 'policia'] },
    { path: '/pabellones', icon: Building2, label: 'Pabellones', roles: ['admin'] },
    { path: '/personal', icon: ShieldAlert, label: 'Personal Policial', roles: ['admin'] },
    { path: '/reclusos', icon: Users2, label: 'Población Penal', roles: ['admin', 'policia'] },
    { path: '/visitantes', icon: Contact, label: 'Registro Visitas', roles: ['admin', 'policia'] },
    { path: '/scan', icon: Camera, label: 'Control Biométrico', roles: ['admin', 'policia'] },
    { path: '/reportes', icon: BarChart3, label: 'Reportes y Auditoría', roles: ['admin'] } // <-- Módulo añadido
  ];

  return menu.filter(item => item.roles.includes(role));
});

const themeStyles = computed(() => ({
  '--brand-color': themes[currentTheme.value].primary,
  '--brand-shadow': themes[currentTheme.value].shadow,
}));

const handleLogout = () => {
  if(confirm('¿Desea finalizar su turno y cerrar sesión?')) {
    authStore.logout();
    router.push('/');
  }
};
</script>

<template>
  <div :style="themeStyles" class="flex h-screen bg-[#0a0c10] text-slate-300 font-sans overflow-hidden">
    
    <div v-if="isMobileOpen" @click="isMobileOpen = false" class="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"></div>

    <aside :class="[
        'fixed inset-y-0 left-0 z-50 bg-[#111418] border-r border-white/5 flex flex-col transition-all duration-500 lg:relative lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      ]">
      
      <div class="h-20 flex items-center px-6 border-b border-white/5 justify-between bg-black/20">
        <div v-if="!isCollapsed || isMobileOpen" class="flex items-center gap-3 animate-in fade-in duration-500">
          <img :src="escudoPoliciaUrl" alt="Escudo" class="h-9 w-auto filter drop-shadow-[0_0_8px_var(--brand-color)]" />
          <div class="truncate">
            <h2 class="text-[11px] font-black text-white tracking-widest uppercase italic leading-none">BIO-PRISON</h2>
            <p class="text-[8px] text-brand font-bold uppercase tracking-[0.2em] mt-1">SISTEMA BOLIVIA</p>
          </div>
        </div>
        <button @click="isCollapsed = !isCollapsed" class="hidden lg:flex p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors">
          <ChevronLeft v-if="!isCollapsed" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>
      </div>

      <nav class="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <button v-for="item in navigation" :key="item.path" 
          @click="router.push(item.path); isMobileOpen = false"
          :class="[
            'flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all duration-300 group relative',
            route.path === item.path ? 'bg-brand/10 text-white shadow-[inset_0_0_15px_var(--brand-shadow)]' : 'text-slate-500 hover:bg-white/5'
          ]">
          <div v-if="route.path === item.path" class="absolute left-0 w-1 h-6 bg-brand rounded-r-full shadow-[0_0_15px_var(--brand-color)]"></div>
          <component :is="item.icon" :class="['h-5 w-5 transition-colors', route.path === item.path ? 'text-brand' : 'group-hover:text-white']" />
          <span v-if="!isCollapsed" class="text-[10px] font-black uppercase tracking-[0.15em]">{{ item.label }}</span>
        </button>
      </nav>

      <div v-if="!isCollapsed" class="p-6 border-t border-white/5 bg-black/20 space-y-4">
        <div class="flex items-center gap-2">
          <Palette class="h-3 w-3 text-brand" />
          <span class="text-[9px] font-black text-slate-600 uppercase tracking-widest">Personalizar Tema</span>
        </div>
        <div class="flex justify-between items-center px-1">
          <button v-for="(color, name) in themes" :key="name" @click="currentTheme = name"
            :style="{ backgroundColor: color.primary }"
            :class="['h-6 w-6 rounded-lg border-2 transition-all hover:scale-125', 
            currentTheme === name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40']">
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="h-20 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 shrink-0 z-40">
        <button @click="isMobileOpen = true" class="lg:hidden p-3 rounded-xl bg-white/5 text-brand shadow-lg">
          <Menu class="h-6 w-6" />
        </button>

        <div class="hidden sm:flex items-center gap-6">
           <div class="flex flex-col">
             <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Estado de Red</span>
             <div class="flex items-center gap-2 mt-1.5">
                <div class="h-1.5 w-1.5 rounded-full bg-brand animate-pulse"></div>
                <span class="text-[10px] font-bold text-white uppercase tracking-tighter">Terminal Centralizado</span>
             </div>
           </div>
        </div>

        <div class="relative">
          <button @click="showProfileMenu = !showProfileMenu" class="flex items-center gap-4 group p-1.5 rounded-2xl transition-all hover:bg-white/5">
            <div class="text-right hidden md:block">
              <p class="text-[11px] font-black text-white uppercase leading-none mb-1">{{ authStore.user?.username }}</p>
              <span :class="['px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter', 
                authStore.user?.role === 'admin' ? 'bg-rose-500/20 text-rose-500' : 'bg-brand/20 text-brand']">
                {{ authStore.user?.role }}
              </span>
            </div>
            <div class="h-11 w-11 rounded-2xl bg-brand p-0.5 shadow-brand group-hover:scale-105 transition-all">
              <div class="h-full w-full bg-[#111418] rounded-[14px] flex items-center justify-center border border-white/5">
                <span class="text-sm font-black text-white italic">{{ authStore.user?.username?.[0].toUpperCase() }}</span>
              </div>
            </div>
          </button>

          <transition name="dropdown">
            <div v-if="showProfileMenu" class="absolute right-0 mt-4 w-64 bg-[#16191e] border border-white/10 rounded-[2rem] shadow-2xl py-4 z-50 animate-in fade-in zoom-in duration-300">
              <div class="px-6 py-4 border-b border-white/5 mb-2">
                <p class="text-xs font-black text-white uppercase tracking-tight">Oficial Control Facial</p>
                <p class="text-[9px] text-brand font-bold uppercase mt-1 tracking-widest">ID Terminal: #00{{ authStore.user?.id_personal }}</p>
              </div>
              <button @click="handleLogout" class="w-full flex items-center gap-4 px-6 py-4 text-[11px] text-rose-500 hover:bg-rose-500/10 transition-all font-black uppercase tracking-[0.2em]">
                <LogOut class="h-4 w-4" /> Cerrar Turno
              </button>
            </div>
          </transition>
        </div>
      </header>

      <section class="flex-1 overflow-y-auto p-4 lg:p-10 bg-[#0a0c10] custom-scrollbar">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  --brand-color: #10b981;
  --brand-shadow: rgba(16, 185, 129, 0.3);
}

.text-brand { color: var(--brand-color); }
.bg-brand { background-color: var(--brand-color); }
.border-brand { border-color: var(--brand-color); }
.shadow-brand { box-shadow: 0 10px 25px -5px var(--brand-shadow); }

/* Transiciones de Página */
.page-enter-active, .page-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); filter: blur(4px); }

/* Scrollbar Personalizado */
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1f26; border-radius: 20px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--brand-color); }

/* Dropdown Animación */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.3s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>