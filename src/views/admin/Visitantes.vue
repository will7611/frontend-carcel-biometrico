<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Camera, UserCheck, Search, Baby, RefreshCw, Edit3, Trash2, X, Database, Loader2 } from 'lucide-vue-next';

// --- ESTADOS ---
const video = ref(null);
const canvas = ref(null);
const capturedPhoto = ref(null);
const loading = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const searchTable = ref('');

const reclusos = ref([]);
const visitantes = ref([]);
const reclusoBusqueda = ref('');
const reclusosFiltrados = ref([]);

const form = ref({
  nombre_completo: '',
  ci: '',
  edad: null,
  parentesco: '',
  id_recluso: null,
  id_pabellon: null,
  con_ninos: false
});

// REGEX ESTRICTO: 7 a 8 números obligatorios + opcional guion y complemento
const ciPattern = /^[0-9]{7,8}(-[0-9A-Z]{1,2})?$/;

// --- CARGA DE DATOS ---
const fetchData = async () => {
  try {
    const [resR, resV] = await Promise.all([
      api.get('/reclusos/'),
      api.get('/visitantes/')
    ]);
    reclusos.value = resR.data;
    visitantes.value = resV.data;
  } catch (e) { console.error("Error cargando datos"); }
};

// --- BÚSQUEDA DE RECLUSOS ---
const buscarRecluso = () => {
  if (!reclusoBusqueda.value) { reclusosFiltrados.value = []; return; }
  reclusosFiltrados.value = reclusos.value.filter(r => 
    r.nombre.toLowerCase().includes(reclusoBusqueda.value.toLowerCase()) || 
    r.ci.includes(reclusoBusqueda.value)
  );
};

const seleccionarRecluso = (r) => {
  form.value.id_recluso = r.id_recluso;
  form.value.id_pabellon = r.pabellon_id;
  reclusoBusqueda.value = `${r.nombre} ${r.apellidos} (${r.ci})`;
  reclusosFiltrados.value = [];
};

// --- GUARDAR (ENROLAR / ACTUALIZAR) ---
const saveVisitante = async () => {
  // 1. Limpieza de CI antes de validar
  const ciLimpio = form.value.ci.toUpperCase().replace(/\s+/g, '');
  
  // 2. Validación de Formato Estricta (7-8 dígitos)
  if (!ciPattern.test(ciLimpio)) {
    return Swal.fire({ 
      icon: 'error', 
      title: 'Identificación Inválida', 
      text: 'El CI debe tener exactamente 7 u 8 números. Ejemplo: 8548125 o 8548125-1A',
      background: '#111418', color: '#fff' 
    });
  }

  if (!form.value.id_recluso) {
    return Swal.fire({ icon: 'warning', title: 'Vínculo faltante', text: 'Debe vincular al visitante con un interno.', background: '#111418', color: '#fff' });
  }

  if (!isEditing.value && !capturedPhoto.value) {
    return Swal.fire({ icon: 'warning', title: 'Biometría faltante', text: 'Capture la foto obligatoria.', background: '#111418', color: '#fff' });
  }

  loading.value = true;
  try {
    const fd = new FormData();
    
    // Mapeo manual para evitar Error 422 en el Backend
    fd.append('nombre_completo', form.value.nombre_completo.toUpperCase().trim());
    fd.append('ci', ciLimpio);
    fd.append('edad', String(form.value.edad || 0));
    fd.append('parentesco', String(form.value.parentesco));
    fd.append('id_recluso', String(form.value.id_recluso));
    fd.append('id_pabellon', String(form.value.id_pabellon));
    fd.append('id_personal', "1");
    fd.append('con_ninos', String(form.value.con_ninos));

    if (capturedPhoto.value) {
      const blob = await new Promise(resolve => canvas.value.toBlob(resolve, 'image/jpeg', 0.9));
      fd.append('file', blob, 'visitante.jpg');
    }

    if (isEditing.value) {
      await api.put(`/visitantes/${currentId.value}`, fd);
    } else {
      await api.post('/visitantes/enrolar', fd);
    }

    Swal.fire({ icon: 'success', title: 'Acceso Autorizado', background: '#111418', color: '#fff' });
    cancelEdit();
    fetchData();
  } catch (err) {
    const detail = err.response?.data?.detail;
    Swal.fire({ 
      icon: 'error', 
      title: 'Error de Servidor', 
      text: typeof detail === 'string' ? detail : 'Fallo en la validación de datos.', 
      background: '#111418', color: '#fff' 
    });
  } finally { loading.value = false; }
};

const editVisitante = (v) => {
  isEditing.value = true;
  currentId.value = v.id;
  form.value = {
    nombre_completo: v.nombre_completo,
    ci: v.ci,
    edad: v.edad,
    parentesco: v.parentesco,
    id_recluso: v.id_recluso,
    id_pabellon: v.id_pabellon,
    con_ninos: v.con_ninos === true
  };
  reclusoBusqueda.value = v.nombre_privado_libertad;
  capturedPhoto.value = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteVisitante = async (id) => {
  const result = await Swal.fire({
    title: '¿Revocar Autorización?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f43f5e',
    background: '#111418', color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/visitantes/${id}`);
      fetchData();
      Swal.fire({ title: 'Registro Eliminado', icon: 'success', background: '#111418', color: '#fff' });
    } catch (e) { console.error(e); }
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  currentId.value = null;
  form.value = { nombre_completo: '', ci: '', edad: null, parentesco: '', id_recluso: null, id_pabellon: null, con_ninos: false };
  reclusoBusqueda.value = '';
  capturedPhoto.value = null;
};

const visitantesFiltrados = computed(() => {
  const s = searchTable.value.toLowerCase();
  return visitantes.value.filter(v => v.nombre_completo.toLowerCase().includes(s) || v.ci.includes(s));
});

// --- CÁMARA ---
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    if (video.value) video.value.srcObject = stream;
  } catch (err) { console.error("No se detectó cámara"); }
};

const takePhoto = () => {
  const ctx = canvas.value.getContext('2d');
  canvas.value.width = video.value.videoWidth;
  canvas.value.height = video.value.videoHeight;
  ctx.drawImage(video.value, 0, 0);
  capturedPhoto.value = canvas.value.toDataURL('image/jpeg');
};

const resetCamera = () => { capturedPhoto.value = null; };

onMounted(() => { fetchData(); startCamera(); });
onUnmounted(() => { if (video.value?.srcObject) video.value.srcObject.getTracks().forEach(t => t.stop()); });
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <div class="bg-[#111418] p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-white/5 pb-4">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-brand/10 rounded-2xl"><UserCheck class="text-brand h-6 w-6" /></div>
            <h2 class="text-xl font-black text-white uppercase italic tracking-tighter">
              {{ isEditing ? 'Actualizar Visitante' : 'Registro Biométrico' }}
            </h2>
          </div>
          <button v-if="isEditing" @click="cancelEdit" class="text-slate-500 hover:text-white transition-colors"><X/></button>
        </div>

        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Nombre del Visitante</label>
            <input v-model="form.nombre_completo" placeholder="EJ: PEDRO VARGAS" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 uppercase transition-all" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">CI (7-8 dígitos)</label>
              <input 
                v-model="form.ci" 
                @input="form.ci = form.ci.toUpperCase().replace(/\s+/g, '')"
                placeholder="Ej: 8548125" 
                :class="form.ci && !ciPattern.test(form.ci.toUpperCase().replace(/\s+/g, '')) ? 'border-red-500 text-red-500' : 'border-white/10 text-white'"
                class="w-full bg-black/40 border p-4 rounded-2xl text-xs font-bold outline-none focus:border-brand/50 uppercase transition-all" 
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Edad</label>
              <input v-model="form.edad" type="number" placeholder="18" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50" />
            </div>
          </div>

          <div class="space-y-1 relative">
            <label class="text-[10px] font-black text-brand uppercase ml-2 italic">Interno a Visitar</label>
            <div class="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 focus-within:border-brand/50 transition-colors shadow-inner">
              <Search class="h-4 w-4 text-brand" />
              <input @input="buscarRecluso" v-model="reclusoBusqueda" placeholder="BUSCAR POR NOMBRE O CI..." class="w-full bg-transparent p-4 text-white text-[11px] font-bold outline-none" />
            </div>
            <div v-if="reclusosFiltrados.length" class="absolute z-50 w-full mt-2 bg-[#1a1f26] border border-white/10 rounded-2xl max-h-48 overflow-y-auto shadow-2xl">
              <button v-for="r in reclusosFiltrados" :key="r.id_recluso" @click="seleccionarRecluso(r)" class="w-full text-left p-4 hover:bg-brand text-white text-[10px] border-b border-white/5 flex justify-between">
                <span>{{ r.nombre }} {{ r.apellidos }}</span>
                <span class="font-mono">CI: {{ r.ci }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Parentesco</label>
              <select v-model="form.parentesco" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-[11px] font-bold outline-none focus:border-brand/50 appearance-none">
                <option value="" disabled>SELECCIONE VÍNCULO...</option>
                <option value="Padre/Madre">Padre / Madre</option>
                <option value="Hijo/a">Hijo / a</option>
                <option value="Conyuge">Cónyuge / Pareja</option>
                <option value="Abogado">Abogado</option>
                <option value="Otro">Otros</option>
              </select>
            </div>
          </div>

          <label class="flex items-center gap-3 p-4 bg-brand/5 border border-brand/20 rounded-2xl cursor-pointer hover:bg-brand/10 transition-all">
            <input type="checkbox" v-model="form.con_ninos" class="w-5 h-5 accent-brand rounded-md shadow-lg" />
            <span class="text-white text-[10px] font-black uppercase tracking-widest">Ingresa con menores de edad</span>
            <Baby class="text-brand h-5 w-5 ml-auto" />
          </label>
        </div>

        <button @click="saveVisitante" :disabled="loading" 
          class="w-full py-5 bg-brand text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl hover:shadow-brand/20 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
          <Loader2 v-if="loading" class="animate-spin h-4 w-4" />
          <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Registrar y Vincular' }}</span>
        </button>
      </div>

      <div class="bg-[#111418] p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center relative shadow-2xl">
        <div class="relative w-full aspect-square max-w-[440px] bg-black rounded-[3rem] overflow-hidden border-2 border-brand/20 shadow-2xl">
          <video v-show="!capturedPhoto" ref="video" autoplay class="w-full h-full object-cover grayscale opacity-50"></video>
          <img v-if="capturedPhoto" :src="capturedPhoto" class="w-full h-full object-cover animate-in zoom-in duration-300" />
          <canvas ref="canvas" class="hidden"></canvas>
          <div class="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
          <div v-if="!capturedPhoto" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-brand/10 rounded-full animate-pulse pointer-events-none"></div>
        </div>

        <div class="flex gap-4 mt-8">
          <button @click="resetCamera" v-if="capturedPhoto" class="p-5 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all shadow-lg">
            <RefreshCw class="h-6 w-6" />
          </button>
          <button @click="takePhoto" :disabled="capturedPhoto" class="p-6 rounded-full bg-brand shadow-2xl shadow-brand/40 hover:scale-110 active:scale-95 disabled:opacity-50 transition-all">
            <Camera class="text-white h-8 w-8" />
          </button>
        </div>
      </div>
    </div>

    <div class="bg-[#111418] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
      <div class="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
        <h2 class="text-white font-black uppercase italic tracking-tighter flex items-center gap-3">
          <Database class="text-brand h-6 w-6" /> Padrón de Visitas
        </h2>
        <div class="relative w-full md:w-80">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input v-model="searchTable" placeholder="FILTRAR POR CI O NOMBRE..." class="w-full bg-black/40 border border-white/10 pl-12 pr-4 py-3 rounded-2xl text-[10px] text-white outline-none focus:border-brand/50 transition-all uppercase" />
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-black/30 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th class="px-8 py-5">Visitante</th>
              <th class="px-8 py-5">Cédula</th>
              <th class="px-8 py-5">Interno</th>
              <th class="px-8 py-5 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody class="text-white font-bold text-[11px]">
            <tr v-for="v in visitantesFiltrados" :key="v.id" class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-black uppercase">{{ v.nombre_completo[0] }}</div>
                  <div class="flex flex-col">
                    <span class="uppercase italic">{{ v.nombre_completo }}</span>
                    <span class="text-[8px] text-brand uppercase font-black">{{ v.parentesco }}</span>
                  </div>
                </div>
              </td>
              <td class="px-8 py-5 font-mono text-slate-500 uppercase italic">{{ v.ci }}</td>
              <td class="px-8 py-5 uppercase text-[10px] text-slate-400">
                {{ v.nombre_privado_libertad }}
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="editVisitante(v)" class="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"><Edit3 class="h-4 w-4"/></button>
                  <button @click="deleteVisitante(v.id)" class="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"><Trash2 class="h-4 w-4"/></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.animate-progress { animation: progress 2s infinite linear; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-thumb { background: #1a1f26; border-radius: 10px; }
</style>