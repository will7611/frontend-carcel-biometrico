<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Building2, Plus, Trash2, Hash, Layers } from 'lucide-vue-next';

const pabellones = ref([]);
const loading = ref(false);
const error = ref('');
const nuevoPabellon = ref({ nombre_pb: '' });

// 1. Obtener Pabellones
const fetchPabellones = async () => {
  loading.value = true;
  try {
    const res = await axios.get('http://127.0.0.1:8000/pabellones');
    pabellones.value = res.data;
  } catch (err) {
    error.value = 'Error al conectar con el servidor';
  } finally {
    loading.value = false;
  }
};

// 2. Crear Pabellón
const handleCreate = async () => {
  if (!nuevoPabellon.value.nombre_pb) return;
  
  try {
    await axios.post('http://127.0.0.1:8000/pabellones', nuevoPabellon.value);
    nuevoPabellon.value.nombre_pb = '';
    fetchPabellones();
  } catch (err) {
    alert("Error al crear el pabellón");
  }
};

// 3. Eliminar Pabellón
const deletePabellon = async (id) => {
  if (!confirm('¿Seguro que desea eliminar este sector? Los reclusos asociados podrían quedar huérfanos.')) return;
  
  try {
    await axios.delete(`http://127.0.0.1:8000/pabellones/${id}`);
    fetchPabellones();
  } catch (err) {
    alert("No se puede eliminar: el pabellón tiene reclusos asignados.");
  }
};

onMounted(fetchPabellones);
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Building2 class="h-6 w-6 text-brand" />
          Infraestructura Penal
        </h1>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Gestión de Bloques y Sectores</p>
      </div>

      <div class="flex items-center gap-2 bg-[#111418] p-2 rounded-2xl border border-white/5 shadow-2xl">
        <input 
          v-model="nuevoPabellon.nombre_pb" 
          type="text" 
          placeholder="Nombre del nuevo sector..." 
          class="bg-transparent border-none text-xs font-bold text-white px-4 outline-none w-48 lg:w-64"
          @keyup.enter="handleCreate"
        />
        <button 
          @click="handleCreate"
          class="bg-brand hover:scale-105 active:scale-95 transition-all p-3 rounded-xl shadow-lg shadow-brand/20"
        >
          <Plus class="h-4 w-4 text-white" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-32 bg-white/5 animate-pulse rounded-3xl"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="p in pabellones" 
        :key="p.id_pabellon"
        class="group relative bg-[#111418] border border-white/5 p-6 rounded-3xl hover:border-brand/40 transition-all duration-500 overflow-hidden"
      >
        <Layers class="absolute -right-4 -bottom-4 h-24 w-24 text-white/5 group-hover:text-brand/10 transition-colors" />

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div class="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
              <Hash class="h-5 w-5 text-brand" />
            </div>
            <button 
              @click="deletePabellon(p.id_pabellon)"
              class="text-slate-600 hover:text-rose-500 transition-colors p-2"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <h3 class="text-white font-black uppercase text-sm tracking-wider mb-1">{{ p.nombre_pb }}</h3>
          <div class="flex items-center gap-2">
            <span class="text-[9px] font-black text-slate-500 uppercase">Identificador:</span>
            <span class="text-[9px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded">ID-0{{ p.id_pabellon }}</span>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 w-full h-1 bg-white/5">
          <div class="h-full bg-brand w-0 group-hover:w-full transition-all duration-700"></div>
        </div>
      </div>

      <div v-if="pabellones.length === 0" class="col-span-full py-20 flex flex-col items-center opacity-20">
        <Building2 class="h-16 w-16 mb-4" />
        <p class="font-black uppercase text-xs tracking-widest text-center">No hay sectores registrados en la base de datos</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>