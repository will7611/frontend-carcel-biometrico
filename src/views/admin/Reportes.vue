<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '../../services/api';
import { FileSpreadsheet, Search, RefreshCw, Download, FileText, Calendar } from 'lucide-vue-next';

const registros = ref([]);
const loading = ref(true);
const filtroTiempo = ref('todos');
const busqueda = ref('');
const fechaInicio = ref('');
const fechaFin = ref('');

const fetchReporte = async () => {
  loading.value = true;
  try {
    const params = { rango: filtroTiempo.value, busqueda: busqueda.value };
    if (fechaInicio.value && fechaFin.value) {
      params.fecha_inicio = fechaInicio.value;
      params.fecha_fin = fechaFin.value;
    }
    const res = await api.get('/access/reporte-detallado', { params });
    registros.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) { console.error("Error", err); } finally { loading.value = false; }
};

const exportar = (tipo) => {
  let url = `http://127.0.0.1:8000/access/exportar-${tipo}?rango=${filtroTiempo.value}&busqueda=${busqueda.value}`;
  if (fechaInicio.value && fechaFin.value) {
    url += `&fecha_inicio=${fechaInicio.value}&fecha_fin=${fechaFin.value}`;
  }
  window.open(url, '_blank');
};

const setFiltro = (t) => { filtroTiempo.value = t; fechaInicio.value = ''; fechaFin.value = ''; fetchReporte(); };

onMounted(fetchReporte);
watch(busqueda, () => fetchReporte());
</script>

<template>
  <div class="p-6 lg:p-10 bg-[#f8fafc] min-h-screen">
    <header class="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-10 rounded-[2.5rem] border-2 border-slate-200 shadow-xl mb-8">
      <div class="flex items-center gap-6">
        <div class="p-4 bg-[#2d5a27] rounded-3xl shadow-xl"><FileSpreadsheet class="h-10 w-10 text-white" /></div>
        <div>
          <h1 class="text-3xl font-black text-[#1a3818] uppercase">Libro de Guardia</h1>
          <p class="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Policía Boliviana</p>
        </div>
      </div>
      <div class="flex gap-4">
        <button @click="exportar('excel')" class="px-8 py-4 bg-[#2d5a27] text-white rounded-2xl text-xs font-black uppercase shadow-lg"><Download class="h-5 w-5 inline mr-2" /> EXCEL</button>
        <button @click="exportar('pdf')" class="px-8 py-4 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase shadow-lg"><FileText class="h-5 w-5 inline mr-2" /> PDF</button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-8">
      <div class="lg:col-span-3 bg-white p-2 rounded-2xl border-2 border-slate-200 flex gap-1">
        <button v-for="t in ['hoy', 'semana', 'mes', 'todos']" :key="t" @click="setFiltro(t)" :class="filtroTiempo === t ? 'bg-[#2d5a27] text-white' : 'text-slate-400'" class="flex-1 py-3 rounded-xl text-[11px] font-black uppercase">{{ t }}</button>
      </div>
      <div class="lg:col-span-4 bg-white p-2 rounded-2xl border-2 border-slate-200 flex items-center gap-3">
        <Calendar class="h-5 w-5 text-[#2d5a27] ml-2" />
        <input type="date" v-model="fechaInicio" class="text-xs font-bold outline-none bg-transparent" />
        <span class="text-slate-400 font-bold text-xs">AL</span>
        <input type="date" v-model="fechaFin" @change="fetchReporte" class="text-xs font-bold outline-none bg-transparent" />
      </div>
      <div class="lg:col-span-5 relative">
        <Search class="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-[#2d5a27]" />
        <input v-model="busqueda" placeholder="BUSCAR NOMBRE O CÉDULA..." class="w-full bg-white border-2 border-slate-200 pl-16 pr-6 py-4 rounded-[1.5rem] text-sm font-black text-slate-800 outline-none focus:border-[#2d5a27] shadow-sm" />
      </div>
    </div>

    <div class="bg-white rounded-[3rem] border-2 border-slate-200 overflow-hidden shadow-2xl">
      <div v-if="loading" class="py-20 text-center"><RefreshCw class="animate-spin h-10 w-10 mx-auto text-[#2d5a27]" /></div>
      <table v-else class="w-full text-left text-[12px] font-bold uppercase">
        <thead class="bg-slate-100 border-b-2 border-slate-200 text-slate-600 tracking-widest">
          <tr><th class="px-10 py-6">Visitante</th><th class="px-10 py-6 text-center">Interno</th><th class="px-10 py-6 text-center">Entrada</th><th class="px-10 py-6 text-center">Salida</th><th class="px-10 py-6 text-right">Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in registros" :key="r.id" class="border-b-2 border-slate-50 hover:bg-slate-50">
            <td class="px-10 py-5"><span class="text-slate-900 block font-black">{{ r.visitante }}</span><span class="text-[10px] text-[#2d5a27] font-black">CI: {{ r.ci }}</span></td>
            <td class="px-10 py-5 text-center text-slate-800">{{ r.recluso }}</td>
            <td class="px-10 py-5 text-center font-mono text-[#2d5a27] font-black">{{ r.entrada }}</td>
            <td class="px-10 py-5 text-center font-mono text-slate-900 font-black"><span :class="r.esta_dentro ? 'animate-pulse text-[#2d5a27]' : ''">{{ r.salida }}</span></td>
            <td class="px-10 py-5 text-right"><span :class="r.esta_dentro ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-600 border-slate-300'" class="px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2">{{ r.esta_dentro ? 'En Recinto' : 'Finalizado' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>