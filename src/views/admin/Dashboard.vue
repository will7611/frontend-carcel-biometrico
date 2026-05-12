<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '../../services/api';
import { Users, Building2, UserCheck, Activity, ShieldCheck, BarChart3, Clock, RefreshCw, ChevronRight } from 'lucide-vue-next';

const loading = ref(true);
const stats = ref({ total_reclusos: 0, total_visitantes: 0, en_recinto: 0 });
const sectorData = ref([]);
const securityFeed = ref([]);
let autoRefresh = null;

const loadData = async () => {
  loading.value = true;
  try {
    const [resStats, resFeed] = await Promise.all([
      api.get('/access/estadisticas'),
      api.get('/access/reporte-general')
    ]);
    stats.value = resStats.data || { total_reclusos: 0, total_visitantes: 0, en_recinto: 0 };
    sectorData.value = resFeed.data.grafico_pabellones || [];
    securityFeed.value = resFeed.data.ultimos_movimientos || [];
  } catch (err) { console.error("Error cargando Dashboard"); } 
  finally { loading.value = false; }
};

onMounted(() => {
  loadData();
  autoRefresh = setInterval(loadData, 15000);
});

onUnmounted(() => clearInterval(autoRefresh));
</script>

<template>
  <div class="min-h-screen bg-[#f4f7f5] p-6 font-sans text-slate-800">
    <header class="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-5">
        <div class="p-3 bg-[#2d5a27] rounded-2xl shadow-lg"><ShieldCheck class="h-8 w-8 text-white" /></div>
        <div>
          <h1 class="text-2xl font-black text-[#1a3818] uppercase">Bioprison <span class="text-[#2d5a27]">Control</span></h1>
          <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Policía Boliviana</p>
        </div>
      </div>
      <button @click="loadData" class="p-3 bg-[#2d5a27] hover:bg-[#21421c] rounded-xl text-white shadow-md">
        <RefreshCw :class="{'animate-spin': loading}" class="h-5 w-5" />
      </button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm"><p class="text-5xl font-black text-[#1a3818]">{{ stats.total_reclusos }}</p><p class="text-[10px] font-bold text-slate-400 uppercase">Internos</p></div>
      <div class="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm"><p class="text-5xl font-black text-[#1a3818]">{{ stats.total_visitantes }}</p><p class="text-[10px] font-bold text-slate-400 uppercase">Enrolados</p></div>
      <div class="bg-[#2d5a27] p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        <div class="flex justify-between mb-4"><Activity class="animate-pulse" /><span class="px-2 py-1 bg-white/20 text-[8px] font-black rounded-full uppercase">Live</span></div>
        <p class="text-5xl font-black">{{ stats.en_recinto }}</p>
        <p class="text-[10px] font-bold text-white/70 uppercase">En Recinto</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-8">
        <h2 class="text-xs font-black uppercase text-slate-400 mb-8 flex items-center gap-3"><BarChart3 class="text-[#2d5a27] h-5 w-5" /> Distribución</h2>
        <div v-for="pab in sectorData" :key="pab.name" class="mb-4 flex justify-between text-[11px] font-black uppercase">
          <span class="text-slate-500">{{ pab.name }}</span><span class="text-[#2d5a27]">{{ pab.value }} PNAS</span>
        </div>
      </div>
      <div class="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <h2 class="text-xs font-black uppercase text-slate-400 mb-8 flex items-center gap-3"><Activity class="text-[#2d5a27] h-5 w-5" /> Actividad Reciente</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-[11px] font-bold uppercase">
            <thead class="border-b border-slate-100 text-[10px] text-slate-400"><tr><th class="pb-4">Sujeto</th><th class="pb-4">Documento</th><th class="pb-4">Hora</th><th class="pb-4 text-right">Evento</th></tr></thead>
            <tbody>
              <tr v-for="log in securityFeed" :key="log.id" class="border-b border-slate-50">
                <td class="py-4 text-slate-700">{{ log.visitante }}</td>
                <td class="py-4 text-slate-400">{{ log.ci }}</td>
                <td class="py-4 text-slate-500 font-mono">{{ log.hora }}</td>
                <td class="py-4 text-right"><span :class="log.tipo === 'INGRESO' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'" class="px-3 py-1.5 rounded-lg text-[8px] font-black border">{{ log.tipo }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>