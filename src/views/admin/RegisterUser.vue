<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { UserPlus, Camera, Save, RefreshCw, CheckCircle, Shield } from 'lucide-vue-next';

const video = ref(null);
const canvas = ref(null);
const photoCaptured = ref(false);
const isSaving = ref(false);
const message = ref({ type: '', text: '' });

// Datos del formulario
const formData = ref({
  username: '', // CI o Escalafón
  full_name: '',
  role: 'visitante',
  password: 'Password123' // Contraseña temporal
});

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.value.srcObject = stream;
  } catch (err) {
    message.value = { type: 'error', text: 'No se pudo acceder a la cámara' };
  }
};

const capturePhoto = () => {
  const context = canvas.value.getContext('2d');
  context.drawImage(video.value, 0, 0, 640, 480);
  photoCaptured.value = true;
};

const saveUser = async () => {
  if (!photoCaptured.value) return;
  isSaving.value = true;
  
  try {
    // 1. Crear el usuario primero
    const userResp = await axios.post('http://127.0.0.1:8000/auth/register', formData.value);
    const userId = userResp.data.id;

    // 2. Enviar la foto para generar el encoding facial
    canvas.value.toBlob(async (blob) => {
      const faceData = new FormData();
      faceData.append('file', blob, 'face.jpg');
      
      await axios.post(`http://127.0.0.1:8000/auth/register-face/${userId}`, faceData);
      
      message.value = { type: 'success', text: 'Personal registrado correctamente en la base de datos biometrizada.' };
      resetForm();
    }, 'image/jpeg');

  } catch (err) {
    message.value = { type: 'error', text: err.response?.data?.detail || 'Error en el registro' };
  } finally {
    isSaving.value = false;
  }
};

const resetForm = () => {
  formData.value = { username: '', full_name: '', role: 'visitante', password: 'Password123' };
  photoCaptured.value = false;
};

onMounted(startCamera);
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-emerald-900/30 pb-4">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-emerald-600/10 rounded-xl border border-emerald-500/20">
          <UserPlus class="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h1 class="text-xl font-black text-white uppercase tracking-tight">Registro de Identidad Biométrica</h1>
          <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Policía Boliviana - Sistema de Control</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-[#16191e] p-6 rounded-2xl border border-white/5 space-y-4">
        <h3 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Datos del Sujeto</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-[10px] font-bold text-slate-500 uppercase ml-1">Nro. de Cédula de Identidad (CI)</label>
            <input v-model="formData.username" type="text" class="w-full mt-1 bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all" placeholder="Ej: 8432123 LP">
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Completo y Apellidos</label>
            <input v-model="formData.full_name" type="text" class="w-full mt-1 bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all" placeholder="Nombre completo">
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-500 uppercase ml-1">Categoría / Rol</label>
            <select v-model="formData.role" class="w-full mt-1 bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none appearance-none">
              <option value="visitante">Interno / Recluso</option>
              <option value="policia">Personal Policial</option>
              <option value="admin">Administrador de Sistema</option>
            </select>
          </div>
        </div>

        <div v-if="message.text" :class="['p-4 rounded-xl text-xs font-bold uppercase tracking-tight', message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20']">
          {{ message.text }}
        </div>
      </div>

      <div class="bg-[#16191e] p-6 rounded-2xl border border-white/5 flex flex-col items-center gap-4">
        <h3 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest self-start mb-2">Captura de Rostro (Frontal)</h3>
        
        <div class="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-emerald-500/20 shadow-inner">
          <video v-show="!photoCaptured" ref="video" autoplay class="w-full h-full object-cover grayscale brightness-110"></video>
          <canvas v-show="photoCaptured" ref="canvas" width="640" height="480" class="w-full h-full object-cover"></canvas>
          
          <div v-if="!photoCaptured" class="absolute inset-0 border-2 border-emerald-500/30 m-12 rounded-[50%] pointer-events-none border-dashed animate-pulse"></div>
        </div>

        <div class="flex gap-4 w-full">
          <button @click="photoCaptured ? (photoCaptured = false) : capturePhoto()" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest transition-all">
            <RefreshCw v-if="photoCaptured" class="h-4 w-4" />
            <Camera v-else class="h-4 w-4" />
            {{ photoCaptured ? 'Repetir Foto' : 'Capturar Rostro' }}
          </button>
          
          <button @click="saveUser" :disabled="!photoCaptured || isSaving" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20">
            <Save v-if="!isSaving" class="h-4 w-4" />
            <div v-else class="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
            {{ isSaving ? 'Guardando...' : 'Finalizar Registro' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>