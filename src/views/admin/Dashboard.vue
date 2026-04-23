<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Users, LogIn, LogOut, Baby, ShieldCheck, Download, Search } from 'lucide-vue-next';

const reporte = ref([]);
const stats = ref({ total_hoy: 0, dentro_ahora: 0, con_menores: 0 });
const filtroSearch = ref('');

const loadData = async () => {
  const [resReporte, resStats] = await Promise.all([
    axios.get('http://127.0.0.1:8000/access/reporte-general'),
    axios.get('http://127.0.0.1:8000/access/estadisticas')
  ]);
  reporte.value = resReporte.data;
  stats.value = resStats.data;
};

const reporteFiltrado = computed(() => {
  return reporte.value.filter(r => 
    r.visitante.toLowerCase().includes(filtroSearch.value.toLowerCase()) ||
    r.ci.includes(filtroSearch.value)
  );
});

onMounted(loadData);
</script>

<template>
  <div class="p-6 space-y-8 bg-[#0a0c10] min-h-screen">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-[#111418] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
        <div class="p-4 bg-brand/10 rounded-2xl"><LogIn class="text-brand h-6 w-6" /></div>
        <div>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingresos Hoy</p>
          <h3 class="text-2xl font-black text-white">{{ stats.total_hoy }}</h3>
        </div>
      </div>
      <div class="bg-[#111418] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
        <div class="p-4 bg-blue-500/10 rounded-2xl"><Users class="text-blue-500 h-6 w-6" /></div>
        <div>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actualmente Dentro</p>
          <h3 class="text-2xl font-black text-white">{{ stats.dentro_ahora }}</h3>
        </div>
      </div>
      <div class="bg-[#111418] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
        <div class="p-4 bg-amber-500/10 rounded-2xl"><Baby class="text-amber-500 h-6 w-6" /></div>
        <div>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visitas con Menores</p>
          <h3 class="text-2xl font-black text-white">{{ stats.con_menores }}</h3>
        </div>
      </div>
    </div>

    <div class="bg-[#111418] rounded-[2.5rem] border border-white/5 overflow-hidden">
      <div class="p-8 border-b border-white/5 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-black text-white uppercase italic tracking-tighter">Historial Biométrico</h2>
          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Registro detallado de movimientos</p>
        </div>
        <div class="flex gap-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input v-model="filtroSearch" placeholder="Buscar por Nombre o CI..." class="bg-black/40 border border-white/10 pl-10 pr-4 py-2 rounded-xl text-xs text-white outline-none focus:border-brand/50" />
          </div>
          <button class="bg-white/5 p-2 rounded-xl text-white hover:bg-white/10 transition-all"><Download class="h-4 w-4" /></button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-[11px]">
          <thead class="bg-black/20 text-slate-500 uppercase font-black">
            <tr>
              <th class="px-8 py-4">Visitante / CI</th>
              <th class="px-8 py-4">Pabellón</th>
              <th class="px-8 py-4">Interno Visitado</th>
              <th class="px-8 py-4">Entrada</th>
              <th class="px-8 py-4">Salida</th>
              <th class="px-8 py-4">Estado</th>
            </tr>
          </thead>
          <tbody class="text-white font-bold">
            <tr v-for="r in reporteFiltrado" :key="r.id" class="border-b border-white/5 hover:bg-white/[0.02]">
              <td class="px-8 py-4">
                <div class="flex flex-col">
                  <span>{{ r.visitante }}</span>
                  <span class="text-[9px] text-slate-500 uppercase">{{ r.ci }}</span>
                </div>
              </td>
              <td class="px-8 py-4"><span class="px-2 py-1 bg-brand/10 text-brand rounded-lg text-[10px]">PAB {{ r.pabellon }}</span></td>
              <td class="px-8 py-4 opacity-80">{{ r.recluso }}</td>
              <td class="px-8 py-4 opacity-60">{{ r.entrada }}</td>
              <td class="px-8 py-4">
                <span :class="r.salida === 'DENTRO' ? 'text-brand animate-pulse' : 'opacity-60'">{{ r.salida }}</span>
              </td>
              <td class="px-8 py-4">
                <span :class="r.estado === 'En Curso' ? 'bg-brand/20 text-brand' : 'bg-slate-800 text-slate-400'" class="px-3 py-1 rounded-full text-[9px] uppercase font-black">
                  {{ r.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>