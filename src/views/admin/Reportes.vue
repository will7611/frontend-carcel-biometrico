<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Download, Search, FileSpreadsheet, Calendar, User, Clock } from 'lucide-vue-next';

const registros = ref([]);
const loading = ref(true);
const filtroTiempo = ref('todos');
const busqueda = ref('');

const fetchReporte = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`http://127.0.0.1:8000/access/reporte-detallado?rango=${filtroTiempo.value}`);
    registros.value = res.data;
  } catch (err) {
    console.error("Error al cargar reportes", err);
  } finally {
    loading.value = false;
  }
};

const registrosFiltrados = computed(() => {
  if (!busqueda.value) return registros.value;
  const b = busqueda.value.toLowerCase();
  return registros.value.filter(r => 
    r.visitante.toLowerCase().includes(b) || 
    r.ci.includes(b) || 
    r.recluso.toLowerCase().includes(b)
  );
});

const descargarExcel = () => {
  window.open('http://127.0.0.1:8000/access/exportar-excel', '_blank');
};

onMounted(fetchReporte);
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
          <FileSpreadsheet class="text-brand h-6 w-6" />
          Libro de Guardia y Visitas
        </h2>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Auditoría Biométrica de Flujo Penal</p>
      </div>

      <button @click="descargarExcel" class="group flex items-center gap-3 px-8 py-3.5 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-105 transition-all">
        <Download class="h-4 w-4 group-hover:animate-bounce" /> Descargar Reporte Completo
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-[#111418] p-2 rounded-2xl border border-white/5 flex gap-1">
        <button v-for="t in ['hoy', 'semana', 'mes', 'todos']" :key="t"
          @click="filtroTiempo = t; fetchReporte()"
          :class="filtroTiempo === t ? 'bg-brand text-white' : 'text-slate-500 hover:text-white'"
          class="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all"
        >{{ t }}</button>
      </div>

      <div class="relative group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand transition-colors" />
        <input v-model="busqueda" placeholder="Buscar por Visitante, CI o Interno..." 
          class="w-full bg-[#111418] border border-white/5 pl-12 pr-4 py-4 rounded-2xl text-[11px] text-white outline-none focus:border-brand/50 transition-all shadow-inner" />
      </div>
    </div>

    <div class="bg-[#111418] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr class="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th class="px-8 py-5 border-b border-white/5">Identificación Visitante</th>
              <th class="px-8 py-5 border-b border-white/5">Pabellón</th>
              <th class="px-8 py-5 border-b border-white/5">Interno Asignado</th>
              <th class="px-8 py-5 border-b border-white/5"><div class="flex items-center gap-2"><Clock class="h-3 w-3" /> Entrada</div></th>
              <th class="px-8 py-5 border-b border-white/5"><div class="flex items-center gap-2"><Clock class="h-3 w-3" /> Salida</div></th>
              <th class="px-8 py-5 border-b border-white/5 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="text-[11px] font-bold text-white/90">
            <tr v-for="r in registrosFiltrados" :key="r.id" class="hover:bg-white/[0.02] transition-colors group">
              <td class="px-8 py-5 border-b border-white/5">
                <div class="flex flex-col">
                  <span class="text-white tracking-tight">{{ r.visitante }}</span>
                  <span class="text-[9px] text-slate-500 font-black">CI: {{ r.ci }}</span>
                </div>
              </td>
              <td class="px-8 py-5 border-b border-white/5">
                <span class="px-3 py-1 bg-brand/10 border border-brand/20 text-brand rounded-lg text-[9px] font-black uppercase">
                  {{ r.pabellon_id || r.pabellon }}
                </span>
              </td>
              <td class="px-8 py-5 border-b border-white/5 opacity-60">
                <div class="flex items-center gap-2">
                  <User class="h-3 w-3 text-slate-700" /> {{ r.recluso }}
                </div>
              </td>
              <td class="px-8 py-5 border-b border-white/5 text-slate-400 font-mono">{{ r.entrada }}</td>
              <td class="px-8 py-5 border-b border-white/5 font-mono">
                <span :class="!r.fecha_salida || r.salida === 'DENTRO' ? 'text-brand animate-pulse' : 'text-slate-500'">
                  {{ r.salida }}
                </span>
              </td>
              <td class="px-8 py-5 border-b border-white/5 text-right">
                <span :class="!r.fecha_salida || r.salida === 'DENTRO' ? 'bg-brand/20 text-brand' : 'bg-white/5 text-slate-500'" 
                  class="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                  {{ !r.fecha_salida || r.salida === 'DENTRO' ? 'En Recinto' : 'Finalizado' }}
                </span>
              </td>
            </tr>
            <tr v-if="registrosFiltrados.length === 0">
              <td colspan="6" class="px-8 py-20 text-center">
                <div class="flex flex-col items-center opacity-20">
                  <FileSpreadsheet class="h-12 w-12 mb-4" />
                  <p class="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron registros en este periodo</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>