<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Camera, UserPlus, Trash2, Database, RefreshCw, ShieldCheck } from 'lucide-vue-next';

// Estados
const video = ref(null);
const canvas = ref(null);
const capturedPhoto = ref(null);
const loading = ref(false);
const pabellones = ref([]);
const reclusos = ref([]);

const form = ref({
  nombre: '', apellidos: '', ci: '', edad: '', delito: '', pabellon_id: ''
});

// Configuración de Alertas Estilo Bio-Prison
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#111418',
  color: '#fff'
});

// --- LÓGICA DE CÁMARA ---
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 1280, height: 720 } 
    });
    if (video.value) video.value.srcObject = stream;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Sistema de Captura Bloqueado',
      text: 'No se detectó hardware de video o los permisos están denegados.',
      confirmButtonColor: '#10b981',
      background: '#0a0c10',
      color: '#fff'
    });
  }
};

const takePhoto = () => {
  if (!video.value || !canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  canvas.value.width = video.value.videoWidth;
  canvas.value.height = video.value.videoHeight;
  ctx.drawImage(video.value, 0, 0);
  capturedPhoto.value = canvas.value.toDataURL('image/jpeg');
  
  Toast.fire({
    icon: 'success',
    title: 'Patrón Biométrico Capturado'
  });
};

// --- LÓGICA DE GUARDADO ---
const saveRecluso = async () => {
  if (!form.value.nombre || !form.value.ci || !form.value.pabellon_id) {
    return Swal.fire({
      title: 'Campos Incompletos',
      text: 'Nombre, CI y Pabellón son requeridos para el registro.',
      icon: 'warning',
      background: '#111418',
      color: '#fff'
    });
  }
  if (!capturedPhoto.value) {
    return Swal.fire({
      title: 'Falta Escaneo Facial',
      text: 'El protocolo de seguridad requiere biometría facial obligatoria.',
      icon: 'error',
      background: '#111418',
      color: '#fff'
    });
  }

  loading.value = true;
  
  try {
    const blob = await new Promise(resolve => canvas.value.toBlob(resolve, 'image/jpeg', 0.9));
    const formData = new FormData();
    formData.append('nombre', form.value.nombre);
    formData.append('apellidos', form.value.apellidos);
    formData.append('ci', form.value.ci);
    formData.append('edad', form.value.edad);
    formData.append('delito', form.value.delito);
    formData.append('pabellon_id', form.value.pabellon_id);
    formData.append('file', blob, 'recluso_face.jpg');

    await axios.post('http://127.0.0.1:8000/reclusos/register', formData);

    Swal.fire({
      icon: 'success',
      title: 'Registro Finalizado',
      text: 'Interno registrado y codificado en el sistema.',
      confirmButtonColor: '#10b981',
      background: '#111418',
      color: '#fff'
    });

    resetForm();
    fetchReclusos();
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Fallo en Sincronización',
      text: err.response?.data?.detail || 'Error en el motor de reconocimiento facial.',
      confirmButtonColor: '#f43f5e',
      background: '#111418',
      color: '#fff'
    });
  } finally {
    loading.value = false;
  }
};

const fetchReclusos = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:8000/reclusos/');
    reclusos.value = res.data;
  } catch (err) { console.error("Error cargando lista"); }
};

const resetForm = () => {
  form.value = { nombre: '', apellidos: '', ci: '', edad: '', delito: '', pabellon_id: '' };
  capturedPhoto.value = null;
};

onMounted(async () => {
  const resP = await axios.get('http://127.0.0.1:8000/pabellones/');
  pabellones.value = resP.data;
  fetchReclusos();
  startCamera();
});

onUnmounted(() => {
  if (video.value?.srcObject) {
    video.value.srcObject.getTracks().forEach(track => track.stop());
  }
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto p-4">
    
    <div class="bg-[#111418] p-8 rounded-[2rem] border border-white/5 shadow-2xl space-y-6">
      <div class="flex items-center justify-between border-b border-white/5 pb-4">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-brand/10 rounded-2xl"><UserPlus class="text-brand h-6 w-6" /></div>
          <div>
            <h2 class="text-xl font-black text-white uppercase tracking-tighter italic">Registro Penal</h2>
            <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Nacional de Régimen Penitenciario</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Nombres</label>
          <input v-model="form.nombre" type="text" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 focus:bg-black/60 transition-all" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Apellidos</label>
          <input v-model="form.apellidos" type="text" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 focus:bg-black/60 transition-all" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 space-y-1">
          <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Cédula de Identidad</label>
          <input v-model="form.ci" type="text" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 focus:bg-black/60 transition-all" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Edad</label>
          <input v-model="form.edad" type="number" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 focus:bg-black/60 transition-all" />
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Sector Asignado</label>
        <select v-model="form.pabellon_id" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 appearance-none">
          <option value="" disabled>SELECCIONE BLOQUE...</option>
          <option v-for="p in pabellones" :key="p.id_pabellon" :value="p.id_pabellon">{{ p.nombre_pb }}</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Resumen Delictivo</label>
        <textarea v-model="form.delito" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 h-24 resize-none"></textarea>
      </div>

      <button @click="saveRecluso" :disabled="loading" class="w-full py-5 bg-brand text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg hover:shadow-brand/30 hover:scale-[1.01] active:scale-95 disabled:opacity-50">
        <span v-if="!loading" class="flex items-center justify-center gap-2">
          <RefreshCw class="h-4 w-4" /> ENROLAR Y GUARDAR
        </span>
        <span v-else class="animate-pulse">PROCESANDO BIOMETRÍA...</span>
      </button>
    </div>

    <div class="space-y-6">
      <div class="bg-[#111418] p-6 rounded-[2.5rem] border border-white/5 relative shadow-inner">
        <div class="relative aspect-square bg-black rounded-[2rem] overflow-hidden border-2 border-brand/20">
          <video v-show="!capturedPhoto" ref="video" autoplay class="w-full h-full object-cover grayscale opacity-70"></video>
          <img v-if="capturedPhoto" :src="capturedPhoto" class="w-full h-full object-cover transition-all duration-700" />
          
          <div class="absolute inset-0 border-[30px] border-black/40 pointer-events-none"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-brand/20 rounded-full pointer-events-none animate-pulse"></div>
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

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-brand/5 border border-brand/20 p-6 rounded-[2rem] flex items-center gap-4">
          <Database class="text-brand h-8 w-8" />
          <div>
            <p class="text-slate-500 text-[9px] font-black uppercase">Población</p>
            <p class="text-white text-2xl font-black leading-none">{{ reclusos.length }}</p>
          </div>
        </div>
        <div class="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex items-center gap-4">
          <ShieldCheck class="text-slate-500 h-8 w-8" />
          <div>
            <p class="text-slate-500 text-[9px] font-black uppercase">Protocolo</p>
            <p class="text-white text-[10px] font-black uppercase">AES-256 Facial</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>