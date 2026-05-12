<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Building2, Plus, Trash2, Hash, Layers, Edit3, X, Check, Loader2, ShieldCheck } from 'lucide-vue-next';

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
    return Swal.fire({ 
      icon: 'warning', 
      title: 'Nombre muy corto', 
      text: 'Debe ingresar al menos 3 caracteres.',
      confirmButtonColor: '#2d5a27' 
    });
  }
  
  submitting.value = true;
  try {
    await api.post('/pabellones', nuevoPabellon.value);
    nuevoPabellon.value.nombre_pb = '';
    fetchPabellones();
    Swal.fire({ 
      icon: 'success', 
      title: 'Sector Registrado', 
      toast: true, 
      position: 'top-end', 
      showConfirmButton: false, 
      timer: 3000 
    });
  } catch (err) {
    Swal.fire({ 
      icon: 'error', 
      title: 'Error de Registro', 
      text: err.response?.data?.detail || 'No se pudo crear el sector',
      confirmButtonColor: '#1b3022'
    });
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
    Swal.fire({ icon: 'error', title: 'Fallo al actualizar', confirmButtonColor: '#1b3022' });
  }
};

const deletePabellon = async (id) => {
  const result = await Swal.fire({
    title: '¿Eliminar Sector?',
    text: "Esta acción no se puede deshacer si existen internos asignados.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#1b3022',
    confirmButtonText: 'SÍ, ELIMINAR',
    cancelButtonText: 'CANCELAR'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/pabellones/${id}`);
      fetchPabellones();
      Swal.fire({ title: 'Sector Eliminado', icon: 'success', confirmButtonColor: '#2d5a27' });
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Acceso Denegado', 
        text: err.response?.data?.detail || 'El sector contiene registros activos.',
        confirmButtonColor: '#1b3022'
      });
    }
  }
};

onMounted(fetchPabellones);
</script>

<template>
  <div class="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
    
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 lg:p-8 rounded-[2rem] border border-gray-200 shadow-xl">
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 bg-[#2d5a27]/10 rounded-2xl flex items-center justify-center text-[#2d5a27]">
          <Building2 class="h-8 w-8" />
        </div>
        <div>
          <h1 class="text-xl lg:text-2xl font-black text-[#1b3022] uppercase tracking-tighter">Infraestructura Penal</h1>
          <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gestión de Bloques y Poblaciones</p>
        </div>
      </div>

      <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-[#d4af37] transition-all w-full lg:w-auto shadow-inner">
        <input 
          v-model="nuevoPabellon.nombre_pb" 
          type="text" 
          placeholder="Nombre del nuevo sector..." 
          class="bg-transparent border-none text-xs font-bold text-gray-800 px-4 outline-none flex-1 lg:w-64 uppercase"
          @keyup.enter="handleCreate"
        />
        <button 
          @click="handleCreate"
          :disabled="submitting || nuevoPabellon.nombre_pb.length < 3"
          class="bg-[#1b3022] hover:bg-[#2d5a27] text-white transition-all p-3 rounded-xl shadow-lg disabled:opacity-50"
        >
          <Plus v-if="!submitting" class="h-5 w-5" />
          <Loader2 v-else class="h-5 w-5 animate-spin" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-44 bg-white animate-pulse rounded-[2rem] border border-gray-100"></div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="p in pabellones" 
        :key="p.id_pabellon"
        class="group relative bg-white border border-gray-200 p-6 lg:p-8 rounded-[2rem] hover:border-[#d4af37] hover:shadow-xl transition-all duration-500 overflow-hidden"
      >
        <Layers class="absolute -right-4 -bottom-4 h-24 w-24 text-gray-50 group-hover:text-[#2d5a27]/5 transition-colors" />

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-6">
            <div class="h-12 w-12 rounded-2xl bg-[#2d5a27]/10 flex items-center justify-center border border-[#2d5a27]/10">
              <Hash class="h-6 w-6 text-[#2d5a27]" />
            </div>
            
            <div class="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button @click="startEdit(p)" class="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                <Edit3 class="h-4 w-4" />
              </button>
              <button @click="deletePabellon(p.id_pabellon)" class="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div v-if="editId === p.id_pabellon" class="space-y-3">
            <input 
              v-model="editNombre" 
              class="w-full bg-gray-50 border border-[#d4af37] rounded-xl p-3 text-xs text-gray-800 font-bold outline-none uppercase shadow-inner"
              @keyup.enter="handleUpdate(p.id_pabellon)"
            />
            <div class="flex gap-2">
              <button @click="handleUpdate(p.id_pabellon)" class="flex-1 bg-[#2d5a27] text-white py-2 rounded-lg text-[10px] font-black uppercase hover:brightness-110 transition-all flex items-center justify-center gap-1 shadow-md">
                <Check class="h-3 w-3" /> Guardar
              </button>
              <button @click="cancelEdit" class="flex-1 bg-gray-100 text-gray-500 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-gray-200 transition-all">
                Cancelar
              </button>
            </div>
          </div>

          <div v-else>
            <h3 class="text-[#1b3022] font-black uppercase text-lg tracking-tight mb-1 group-hover:text-[#2d5a27] transition-colors leading-tight">
              {{ p.nombre_pb }}
            </h3>
            <div class="flex items-center gap-2">
              <ShieldCheck class="h-3 w-3 text-[#d4af37]" />
              <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cod. Registro:</span>
              <span class="text-[9px] font-black text-[#d4af37] italic">#PB-0{{ p.id_pabellon }}</span>
            </div>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 w-full h-1.5 bg-gray-50">
          <div :class="editId === p.id_pabellon ? 'w-full bg-[#d4af37]' : 'w-0 group-hover:w-full bg-[#2d5a27]'" class="h-full transition-all duration-700"></div>
        </div>
      </div>

      <div v-if="pabellones.length === 0 && !loading" class="col-span-full py-32 flex flex-col items-center opacity-20 border-2 border-dashed border-gray-300 rounded-[3rem]">
        <Building2 class="h-20 w-20 mb-4" />
        <p class="font-black uppercase text-sm tracking-[0.4em] text-center">Sin sectores detectados en el sistema</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animación suave para la cuadrícula */
.grid > div {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scrollbar para cuando hay muchos sectores */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-thumb {
  background: #2d5a27;
  border-radius: 10px;
}
</style>