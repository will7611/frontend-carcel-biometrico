<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Building2, Plus, Trash2, Hash, Layers, Edit3, X, Check, Loader2 } from 'lucide-vue-next';

const pabellones = ref([]);
const loading = ref(false);
const submitting = ref(false);
const nuevoPabellon = ref({ nombre_pb: '' });

// Estado para edición
const editId = ref(null);
const editNombre = ref('');

const fetchPabellones = async () => {
  loading.value = true;
  try {
    const res = await api.get('/pabellones');
    pabellones.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (nuevoPabellon.value.nombre_pb.length < 3) {
    return Swal.fire({ icon: 'warning', title: 'Nombre muy corto', background: '#111418', color: '#fff' });
  }
  
  submitting.value = true;
  try {
    await api.post('/pabellones', nuevoPabellon.value);
    nuevoPabellon.value.nombre_pb = '';
    fetchPabellones();
    Swal.fire({ icon: 'success', title: 'Sector Registrado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Error al crear', background: '#111418', color: '#fff' });
  } finally {
    submitting.value = false;
  }
};

const startEdit = (p) => {
  editId.value = p.id_pabellon;
  editNombre.value = p.nombre_pb;
};

const cancelEdit = () => {
  editId.value = null;
  editNombre.value = '';
};

const handleUpdate = async (id) => {
  if (editNombre.value.length < 3) return;
  
  try {
    await api.put(`/pabellones/${id}`, { nombre_pb: editNombre.value });
    editId.value = null;
    fetchPabellones();
    Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Fallo al actualizar', background: '#111418', color: '#fff' });
  }
};

const deletePabellon = async (id) => {
  const result = await Swal.fire({
    title: '¿Eliminar Sector?',
    text: "Esta acción no se puede deshacer si el sector está vacío.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f43f5e',
    confirmButtonText: 'SÍ, ELIMINAR',
    background: '#111418', color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/pabellones/${id}`);
      fetchPabellones();
      Swal.fire({ title: 'Eliminado', icon: 'success', background: '#111418', color: '#fff' });
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Acceso Denegado', 
        text: err.response?.data?.detail || 'Error al eliminar',
        background: '#111418', color: '#fff' 
      });
    }
  }
};

onMounted(fetchPabellones);
</script>

<template>
  <div class="p-6 space-y-8">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#111418] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Building2 class="h-7 w-7 text-brand" />
          Infraestructura Penal
        </h1>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Gestión de Bloques y Áreas de Contención</p>
      </div>

      <div class="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 focus-within:border-brand/50 transition-all">
        <input 
          v-model="nuevoPabellon.nombre_pb" 
          type="text" 
          placeholder="Nombre del nuevo sector (Ej: PABELLÓN A)..." 
          class="bg-transparent border-none text-xs font-bold text-white px-4 outline-none w-64 uppercase"
          @keyup.enter="handleCreate"
        />
        <button 
          @click="handleCreate"
          :disabled="submitting || nuevoPabellon.nombre_pb.length < 3"
          class="bg-brand hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all p-3 rounded-xl shadow-lg shadow-brand/20"
        >
          <Plus v-if="!submitting" class="h-5 w-5 text-white" />
          <Loader2 v-else class="h-5 w-5 text-white animate-spin" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-40 bg-white/5 animate-pulse rounded-[2rem]"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="p in pabellones" 
        :key="p.id_pabellon"
        class="group relative bg-[#111418] border border-white/5 p-8 rounded-[2rem] hover:border-brand/40 transition-all duration-500 overflow-hidden"
      >
        <Layers class="absolute -right-4 -bottom-4 h-24 w-24 text-white/5 group-hover:text-brand/10 transition-colors" />

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-6">
            <div class="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20 shadow-inner">
              <Hash class="h-6 w-6 text-brand" />
            </div>
            
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button @click="startEdit(p)" class="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                <Edit3 class="h-4 w-4" />
              </button>
              <button @click="deletePabellon(p.id_pabellon)" class="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div v-if="editId === p.id_pabellon" class="space-y-3">
            <input 
              v-model="editNombre" 
              class="w-full bg-black/60 border border-brand/50 rounded-xl p-3 text-xs text-white font-bold outline-none uppercase"
              @keyup.enter="handleUpdate(p.id_pabellon)"
            />
            <div class="flex gap-2">
              <button @click="handleUpdate(p.id_pabellon)" class="flex-1 bg-brand/20 text-brand py-2 rounded-lg text-[10px] font-black uppercase hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-1">
                <Check class="h-3 w-3" /> Guardar
              </button>
              <button @click="cancelEdit" class="flex-1 bg-white/5 text-slate-400 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-white/10 transition-all">
                Cancelar
              </button>
            </div>
          </div>

          <div v-else>
            <h3 class="text-white font-black uppercase text-lg tracking-tight mb-1 group-hover:text-brand transition-colors">{{ p.nombre_pb }}</h3>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-black text-slate-600 uppercase tracking-widest">Cod. Sector:</span>
              <span class="text-[9px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/10 italic">#SEC-0{{ p.id_pabellon }}</span>
            </div>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 w-full h-1.5 bg-white/5">
          <div :class="editId === p.id_pabellon ? 'w-full bg-blue-500' : 'w-0 group-hover:w-full bg-brand'" class="h-full transition-all duration-700"></div>
        </div>
      </div>

      <div v-if="pabellones.length === 0" class="col-span-full py-32 flex flex-col items-center opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
        <Building2 class="h-20 w-20 mb-4" />
        <p class="font-black uppercase text-sm tracking-[0.4em] text-center">Sin sectores detectados</p>
      </div>
    </div>
  </div>
</template>