<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Camera, UserPlus, Trash2, Database, RefreshCw, ShieldCheck, Edit3, X, Search, Loader2, UserCircle } from 'lucide-vue-next';

// --- ESTADOS ---
const video = ref(null);
const canvas = ref(null);
const capturedPhoto = ref(null);
const loading = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const search = ref('');

const pabellones = ref([]);
const reclusos = ref([]);

const form = ref({
  nombre: '', apellidos: '', ci: '', edad: '', delito: '', pabellon_id: ''
});

const ciPattern = /^[0-9]{5,10}([- ]?[0-9A-Z]{1,2})?$/;

// --- LÓGICA DE CARGA ---
const fetchData = async () => {
  try {
    const [resP, resR] = await Promise.all([
      api.get('/pabellones/'),
      api.get('/reclusos/')
    ]);
    pabellones.value = resP.data;
    reclusos.value = resR.data;
  } catch (err) { console.error("Error de sincronización"); }
};

// --- PREPARAR EDICIÓN ---
const editRecluso = (r) => {
  isEditing.value = true;
  currentId.value = r.id_recluso;
  form.value = {
    nombre: r.nombre,
    apellidos: r.apellidos,
    ci: r.ci,
    edad: r.edad,
    delito: r.delito,
    pabellon_id: r.pabellon_id
  };
  capturedPhoto.value = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- GUARDAR / ACTUALIZAR ---
const saveRecluso = async () => {
  if (!ciPattern.test(form.value.ci)) {
    return Swal.fire({ icon: 'error', title: 'CI Inválido', text: 'Formato: 1234567 o 1234567-1A', confirmButtonColor: '#1b3022' });
  }
  if (!isEditing.value && !capturedPhoto.value) {
    return Swal.fire({ title: 'Biometría Requerida', text: 'Capture el rostro para el nuevo registro.', icon: 'warning', confirmButtonColor: '#1b3022' });
  }

  loading.value = true;
  try {
    const formData = new FormData();
    Object.keys(form.value).forEach(key => formData.append(key, form.value[key]));
    
    if (capturedPhoto.value) {
      const blob = await new Promise(resolve => canvas.value.toBlob(resolve, 'image/jpeg', 0.9));
      formData.append('file', blob, 'face.jpg');
    }

    if (isEditing.value) {
      await api.put(`/reclusos/${currentId.value}`, formData);
    } else {
      await api.post('/reclusos/register', formData);
    }

    Swal.fire({ icon: 'success', title: isEditing.value ? 'Ficha Actualizada' : 'Interno Enrolado', confirmButtonColor: '#2d5a27' });
    cancelEdit();
    fetchData();
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Fallo en Registro', text: err.response?.data?.detail, confirmButtonColor: '#1b3022' });
  } finally { loading.value = false; }
};

// --- ELIMINAR ---
const deleteRecluso = async (id) => {
  const result = await Swal.fire({
    title: '¿Eliminar Registro?',
    text: "Esta acción borrará la biometría y el historial del interno.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'SÍ, BORRAR',
    cancelButtonText: 'CANCELAR'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/reclusos/${id}`);
      fetchData();
      Swal.fire({ title: 'Eliminado', icon: 'success', confirmButtonColor: '#2d5a27' });
    } catch (err) { console.error(err); }
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  currentId.value = null;
  form.value = { nombre: '', apellidos: '', ci: '', edad: '', delito: '', pabellon_id: '' };
  capturedPhoto.value = null;
};

const reclusosFiltrados = computed(() => {
  const s = search.value.toLowerCase();
  return reclusos.value.filter(r => r.nombre.toLowerCase().includes(s) || r.ci.includes(s));
});

// --- CÁMARA ---
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    if (video.value) video.value.srcObject = stream;
  } catch (err) {
    console.error("No se pudo acceder a la cámara");
  }
};

const takePhoto = () => {
  const ctx = canvas.value.getContext('2d');
  canvas.value.width = video.value.videoWidth;
  canvas.value.height = video.value.videoHeight;
  ctx.drawImage(video.value, 0, 0);
  capturedPhoto.value = canvas.value.toDataURL('image/jpeg');
};

onMounted(() => { fetchData(); startCamera(); });
onUnmounted(() => { if (video.value?.srcObject) video.value.srcObject.getTracks().forEach(t => t.stop()); });
</script>

<template>
  <div class="space-y-6 lg:space-y-8 max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
    
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
      <div class="lg:col-span-3 bg-white p-6 lg:p-8 rounded-[2.5rem] border border-gray-200 shadow-xl space-y-6">
        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <div class="flex items-center gap-4">
            <div :class="isEditing ? 'bg-blue-50 text-blue-600' : 'bg-[#2d5a27]/10 text-[#2d5a27]'" class="p-3 rounded-2xl">
              <UserPlus v-if="!isEditing" class="h-6 w-6" />
              <Edit3 v-else class="h-6 w-6" />
            </div>
            <h2 class="text-xl font-black text-[#1b3022] uppercase tracking-tighter italic">
              {{ isEditing ? 'Actualizar Ficha Penal' : 'Enrolamiento de Interno' }}
            </h2>
          </div>
          <button v-if="isEditing" @click="cancelEdit" class="text-gray-400 hover:text-[#1b3022]"><X/></button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Nombres</label>
            <input v-model="form.nombre" placeholder="EJ: MARIO" type="text" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] transition-all" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Apellidos</label>
            <input v-model="form.apellidos" placeholder="EJ: CONDE" type="text" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] transition-all" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2 space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Documento de Identidad (CI)</label>
            <input v-model="form.ci" @input="form.ci = form.ci.toUpperCase()" placeholder="EJ: 8548125" type="text" 
              :class="form.ci && !ciPattern.test(form.ci) ? 'border-red-500 text-red-500' : 'border-gray-200 text-gray-800'"
              class="w-full bg-gray-50 border p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#d4af37] transition-all" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Edad</label>
            <input v-model="form.edad" type="number" placeholder="00" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37]" />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] font-black text-[#2d5a27] uppercase ml-2 italic">Ubicación de Custodia (Sector)</label>
          <select v-model="form.pabellon_id" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] appearance-none shadow-inner">
            <option value="" disabled>SELECCIONE DESTINO...</option>
            <option v-for="p in pabellones" :key="p.id_pabellon" :value="p.id_pabellon">{{ p.nombre_pb }}</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Detalle de la Causa (Delito)</label>
          <textarea v-model="form.delito" placeholder="Descripción de la sentencia o cargo..." class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] h-20 resize-none shadow-inner"></textarea>
        </div>

        <button @click="saveRecluso" :disabled="loading" 
          :class="isEditing ? 'bg-blue-600' : 'bg-[#1b3022]'"
          class="w-full py-5 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-3">
          <Loader2 v-if="loading" class="animate-spin h-5 w-5" />
          <template v-else>
            <ShieldCheck class="h-5 w-5 text-[#d4af37]" />
            {{ isEditing ? 'ACTUALIZAR DATOS' : 'REGISTRAR BIOMETRÍA' }}
          </template>
        </button>
      </div>

      <div class="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-xl flex flex-col justify-center">
        <div class="relative aspect-square bg-gray-100 rounded-[2rem] overflow-hidden border-4" :class="capturedPhoto ? 'border-[#d4af37]' : 'border-gray-100 shadow-inner'">
          <video v-show="!capturedPhoto" ref="video" autoplay class="w-full h-full object-cover grayscale opacity-70"></video>
          <img v-if="capturedPhoto" :src="capturedPhoto" class="w-full h-full object-cover animate-in zoom-in duration-300" />
          
          <div v-if="!capturedPhoto" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-64 h-64 border border-[#d4af37]/30 rounded-full animate-pulse"></div>
            <div class="absolute w-full h-0.5 bg-[#d4af37]/10"></div>
            <div class="absolute h-full w-0.5 bg-[#d4af37]/10"></div>
          </div>
          
          <canvas ref="canvas" class="hidden"></canvas>
        </div>
        
        <div class="flex justify-center mt-6">
          <button @click="capturedPhoto ? capturedPhoto = null : takePhoto()" 
            class="p-6 rounded-full bg-[#1b3022] border-4 border-[#d4af37] text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
            <Camera v-if="!capturedPhoto" class="h-8 w-8" />
            <RefreshCw v-else class="h-8 w-8" />
          </button>
        </div>
        <p class="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest mt-4">
          {{ capturedPhoto ? 'Muestra capturada con éxito' : 'Alinee el rostro con el sensor' }}
        </p>
      </div>
    </div>

    <div class="bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-xl">
      <div class="p-6 lg:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 bg-[#2d5a27] rounded-xl flex items-center justify-center shadow-lg">
            <Database class="text-white h-5 w-5" />
          </div>
          <h2 class="text-[#1b3022] font-black uppercase italic tracking-tighter">Población Penitenciaria</h2>
        </div>
        <div class="relative w-full sm:w-80">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input v-model="search" placeholder="Nombre o CI..." class="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#d4af37] shadow-inner uppercase" />
        </div>
      </div>
      
      <div class="overflow-x-auto custom-scroll">
        <table class="w-full text-left text-[11px]">
          <thead class="bg-gray-100 text-[#1b3022] uppercase font-black tracking-widest">
            <tr>
              <th class="px-8 py-5">Interno</th>
              <th class="px-8 py-5">Cédula</th>
              <th class="px-8 py-5">Sector</th>
              <th class="px-8 py-5 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in reclusosFiltrados" :key="r.id_recluso" class="hover:bg-gray-50/50 transition-all group">
              <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                  <UserCircle class="h-5 w-5 text-gray-300" />
                  <span class="font-bold text-gray-800 uppercase">{{ r.nombre }} {{ r.apellidos }}</span>
                </div>
              </td>
              <td class="px-8 py-5 font-mono text-gray-500">{{ r.ci }}</td>
              <td class="px-8 py-5">
                <span class="px-3 py-1 bg-[#2d5a27]/10 text-[#2d5a27] rounded-lg text-[10px] font-black border border-[#2d5a27]/5">
                  BLOQUE-0{{ r.pabellon_id }}
                </span>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="editRecluso(r)" class="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 class="h-4 w-4"/></button>
                  <button @click="deleteRecluso(r.id_recluso)" class="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 class="h-4 w-4"/></button>
                </div>
              </td>
            </tr>
            <tr v-if="reclusosFiltrados.length === 0">
              <td colspan="4" class="py-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-50">
                Sin coincidencias en la base de datos
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { height: 6px; width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

tr { animation: slideUp 0.3s ease-out forwards; }
</style>