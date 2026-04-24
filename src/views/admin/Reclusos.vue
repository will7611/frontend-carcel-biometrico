<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Camera, UserPlus, Trash2, Database, RefreshCw, ShieldCheck, Edit3, X, Search, Loader2 } from 'lucide-vue-next';

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
  capturedPhoto.value = null; // Opcional: volver a tomar foto o dejar la anterior
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- GUARDAR / ACTUALIZAR ---
const saveRecluso = async () => {
  // Validaciones
  if (!ciPattern.test(form.value.ci)) {
    return Swal.fire({ icon: 'error', title: 'CI Inválido', text: 'Formato: 1234567 o 1234567-1A', background: '#111418', color: '#fff' });
  }
  if (!isEditing.value && !capturedPhoto.value) {
    return Swal.fire({ title: 'Biometría Requerida', text: 'Debe capturar el rostro para nuevos registros.', icon: 'warning', background: '#111418', color: '#fff' });
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

    Swal.fire({ icon: 'success', title: isEditing.value ? 'Ficha Actualizada' : 'Interno Enrolado', background: '#111418', color: '#fff' });
    cancelEdit();
    fetchData();
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Fallo en Registro', text: err.response?.data?.detail, background: '#111418', color: '#fff' });
  } finally { loading.value = false; }
};

// --- ELIMINAR ---
const deleteRecluso = async (id) => {
  const result = await Swal.fire({
    title: '¿Eliminar Registro?',
    text: "Esta acción borrará la biometría y el historial del interno.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f43f5e',
    confirmButtonText: 'SÍ, BORRAR',
    background: '#111418', color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/reclusos/${id}`);
      fetchData();
      Swal.fire({ title: 'Eliminado', icon: 'success', background: '#111418', color: '#fff' });
    } catch (err) { console.error(err); }
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  currentId.value = null;
  form.value = { nombre: '', apellidos: '', ci: '', edad: '', delito: '', pabellon_id: '' };
  capturedPhoto.value = null;
};

// --- BÚSQUEDA ---
const reclusosFiltrados = computed(() => {
  const s = search.value.toLowerCase();
  return reclusos.value.filter(r => r.nombre.toLowerCase().includes(s) || r.ci.includes(s));
});

// --- CÁMARA (Lógica igual a la tuya) ---
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
  if (video.value) video.value.srcObject = stream;
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
  <div class="space-y-8 max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-[#111418] p-8 rounded-[2rem] border border-white/5 shadow-2xl space-y-6">
        <div class="flex items-center justify-between border-b border-white/5 pb-4">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-brand/10 rounded-2xl">
              <UserPlus v-if="!isEditing" class="text-brand h-6 w-6" />
              <Edit3 v-else class="text-blue-500 h-6 w-6" />
            </div>
            <div>
              <h2 class="text-xl font-black text-white uppercase tracking-tighter italic">
                {{ isEditing ? 'Actualizar Ficha' : 'Registro Penal' }}
              </h2>
            </div>
          </div>
          <button v-if="isEditing" @click="cancelEdit" class="text-slate-500 hover:text-white"><X/></button>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Nombres</label>
            <input v-model="form.nombre" placeholder="Ej: JUAN PABLO" type="text" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Apellidos</label>
            <input v-model="form.apellidos" placeholder="Ej: MAMANI" type="text" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2 space-y-1">
            <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">CI (Opcional complemento)</label>
            <input v-model="form.ci" @input="form.ci = form.ci.toUpperCase()" placeholder="8548125 o 8548125-1A" type="text" 
              :class="form.ci && !ciPattern.test(form.ci) ? 'border-red-500/50' : 'border-white/10'"
              class="w-full bg-black/40 border p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Edad</label>
            <input v-model="form.edad" type="number" placeholder="25" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50" />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Ubicación (Pabellón)</label>
          <select v-model="form.pabellon_id" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 appearance-none">
            <option value="" disabled>SELECCIONE BLOQUE...</option>
            <option v-for="p in pabellones" :key="p.id_pabellon" :value="p.id_pabellon">{{ p.nombre_pb }}</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Causa Penatenciaria (Delito)</label>
          <textarea v-model="form.delito" placeholder="Descripción breve del motivo de ingreso..." class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 h-24 resize-none"></textarea>
        </div>

        <button @click="saveRecluso" :disabled="loading" 
          :class="isEditing ? 'bg-blue-600' : 'bg-brand'"
          class="w-full py-5 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50">
          <span v-if="!loading" class="flex items-center justify-center gap-2">
            <ShieldCheck class="h-4 w-4" /> {{ isEditing ? 'GUARDAR CAMBIOS' : 'ENROLAR BIOMETRÍA' }}
          </span>
          <Loader2 v-else class="animate-spin h-4 w-4" />
        </button>
      </div>

      <div class="bg-[#111418] p-6 rounded-[2.5rem] border border-white/5 relative shadow-inner">
        <div class="relative aspect-square bg-black rounded-[2rem] overflow-hidden border-2" :class="capturedPhoto ? 'border-brand' : 'border-white/5'">
          <video v-show="!capturedPhoto" ref="video" autoplay class="w-full h-full object-cover grayscale opacity-60"></video>
          <img v-if="capturedPhoto" :src="capturedPhoto" class="w-full h-full object-cover" />
          <div class="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
          <canvas ref="canvas" class="hidden"></canvas>
        </div>
        <div class="flex justify-center mt-6">
          <button @click="capturedPhoto ? capturedPhoto = null : takePhoto()" 
            class="p-6 rounded-full bg-brand shadow-xl shadow-brand/20 hover:scale-110 active:scale-90 transition-all">
            <Camera v-if="!capturedPhoto" class="text-white h-8 w-8" />
            <RefreshCw v-else class="text-white h-8 w-8" />
          </button>
        </div>
      </div>
    </div>

    <div class="bg-[#111418] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div class="flex items-center gap-4">
          <Database class="text-brand h-6 w-6" />
          <h2 class="text-white font-black uppercase italic tracking-tighter">Población Penitenciaria</h2>
        </div>
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input v-model="search" placeholder="Buscar por Nombre o CI..." class="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 rounded-xl text-[10px] text-white outline-none focus:border-brand/50" />
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[11px]">
          <thead class="bg-black/20 text-slate-500 uppercase font-black tracking-widest">
            <tr>
              <th class="px-8 py-5">Interno</th>
              <th class="px-8 py-5">Documento</th>
              <th class="px-8 py-5">Sector</th>
              <th class="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-white/80 font-bold">
            <tr v-for="r in reclusosFiltrados" :key="r.id_recluso" class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td class="px-8 py-5 uppercase italic text-brand">{{ r.nombre }} {{ r.apellidos }}</td>
              <td class="px-8 py-5 font-mono">{{ r.ci }}</td>
              <td class="px-8 py-5">
                <span class="px-2 py-1 bg-white/5 rounded text-[9px] uppercase">PB-0{{ r.pabellon_id }}</span>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="editRecluso(r)" class="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><Edit3 class="h-4 w-4"/></button>
                  <button @click="deleteRecluso(r.id_recluso)" class="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 class="h-4 w-4"/></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>