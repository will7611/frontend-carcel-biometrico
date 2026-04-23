<script setup>
import { useAuthStore } from '../../store/auth';
import { useRouter, useRoute } from 'vue-router'; // Importamos useRoute para saber dónde estamos
import { 
  LayoutDashboard, Users, Camera, History, 
  ShieldCheck, UserCheck, AlertTriangle, LogOut, Search, UserPlus
} from 'lucide-vue-next';
import escudoPoliciaUrl from '../../assets/escudo_policia.jpg';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute(); // Para resaltar el botón activo

const stats = [
  { name: 'Personal Activo', value: '32', icon: ShieldCheck, color: 'text-emerald-500' },
  { name: 'Población Penal', value: '842', icon: Users, color: 'text-amber-500' },
  { name: 'Accesos/Hora', value: '124', icon: UserCheck, color: 'text-sky-500' },
  { name: 'Alertas Sistema', value: '2', icon: AlertTriangle, color: 'text-rose-500' },
];

// Función para navegar
const navigateTo = (path) => {
  router.push(path);
};
</script>

<template>
  <div class="flex h-screen bg-[#0f1115] text-slate-300 font-sans">
    
    <aside class="w-64 border-r border-emerald-900/20 bg-[#16191e] flex flex-col shadow-2xl">
      <div class="p-6 flex items-center gap-3 border-b border-emerald-900/10">
        <div class="bg-white/5 p-1.5 rounded-lg border border-emerald-500/20">
          <img :src="escudoPoliciaUrl" alt="Escudo" class="h-9 w-auto cursor-pointer" @click="navigateTo('/dashboard')" />
        </div>
        <div>
          <h2 class="text-sm font-black text-white tracking-tighter">BIO-PRISON</h2>
          <p class="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Policía Boliviana</p>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1.5">
        <p class="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Operaciones</p>
        
        <button 
          @click="navigateTo('/dashboard')"
          :class="route.path === '/dashboard' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'text-slate-400 hover:bg-white/5'"
          class="flex items-center gap-3 w-full p-2.5 rounded-xl border border-transparent transition-all"
        >
          <LayoutDashboard class="h-4 w-4" />
          <span class="text-xs font-bold uppercase tracking-wide">Panel Central</span>
        </button>

        <button 
          @click="navigateTo('/register')"
          :class="route.path === '/register' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'text-slate-400 hover:bg-white/5'"
          class="flex items-center gap-3 w-full p-2.5 rounded-xl border border-transparent transition-all"
        >
          <UserPlus class="h-4 w-4" />
          <span class="text-xs font-bold uppercase tracking-wide text-left">Registro Biométrico</span>
        </button>

        <button 
          @click="navigateTo('/scan')"
          :class="route.path === '/scan' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'text-slate-400 hover:bg-white/5'"
          class="flex items-center gap-3 w-full p-2.5 rounded-xl border border-transparent transition-all"
        >
          <Camera class="h-4 w-4" />
          <span class="text-xs font-bold uppercase tracking-wide text-left">Escaneo Facial</span>
        </button>
      </nav>

      <div class="p-4 bg-emerald-950/10 border-t border-emerald-900/10">
        <button @click="authStore.logout(); router.push('/')" class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all group">
          <LogOut class="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span class="text-xs font-black uppercase tracking-widest">Desconectarse</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col">
      <header class="h-16 border-b border-white/5 bg-[#16191e]/80 backdrop-blur-xl flex items-center justify-between px-8">
        <div class="flex items-center bg-[#0f1115] border border-white/5 rounded-full px-4 py-1.5">
          <Search class="h-3.5 w-3.5 text-slate-500" />
          <input type="text" placeholder="Buscar por CI o Nombre..." class="bg-transparent border-none text-[11px] focus:ring-0 w-64 text-white" />
        </div>
        
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-[11px] font-black text-white uppercase">{{ authStore.user?.username }}</p>
            <p class="text-[9px] text-emerald-500 font-bold uppercase">{{ authStore.user?.role }}</p>
          </div>
          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/30 flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <span class="text-sm font-black text-white uppercase">{{ authStore.user?.username[0] }}</span>
          </div>
        </div>
      </header>

      <section class="flex-1 overflow-y-auto p-8 space-y-6 bg-[#0f1115]">
        <div v-if="route.path === '/dashboard'" class="space-y-6 animate-in fade-in duration-500">
           <h2 class="text-xl font-black text-white tracking-tight uppercase">Resumen Operativo</h2>
           
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div v-for="stat in stats" :key="stat.name" class="p-5 rounded-2xl bg-[#16191e] border border-white/5 shadow-sm">
                <div class="flex justify-between items-start">
                  <component :is="stat.icon" :class="['h-5 w-5', stat.color]" />
                  <span class="text-2xl font-black text-white tracking-tighter">{{ stat.value }}</span>
                </div>
                <p class="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{{ stat.name }}</p>
             </div>
           </div>

           <div class="rounded-2xl bg-[#16191e] border border-white/5 p-8 flex flex-col items-center justify-center space-y-4">
              <Camera class="h-12 w-12 text-emerald-900" />
              <button @click="navigateTo('/scan')" class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-full transition-all shadow-xl shadow-emerald-900/40">
                Iniciar Escaneo de Control en Puerta
              </button>
           </div>
        </div>

        <router-view v-else></router-view>
      </section>
    </main>
  </div>
</template>