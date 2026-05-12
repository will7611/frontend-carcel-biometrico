<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import api from '../../services/api'; 
import Swal from 'sweetalert2';
import { 
  Camera, ShieldAlert, ShieldCheck, Loader2, 
  RefreshCw, AlertCircle, LogIn, LogOut, User, Baby, Activity
} from 'lucide-vue-next';

// --- ESTADOS ---
const video = ref(null);
const canvas = ref(null);
const isSearching = ref(false);
const result = ref(null);
const cameraError = ref(null);
const isCameraReady = ref(false);
const mode = ref('entry'); 

// --- LÓGICA DE HARDWARE ---
const startCamera = async () => {
  cameraError.value = null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 1280, height: 720, facingMode: "user" } 
    });
    await nextTick();
    if (video.value) {
      video.value.srcObject = stream;
      video.value.onloadedmetadata = () => {
        video.value.play();
        isCameraReady.value = true;
      };
    }
  } catch (err) {
    cameraError.value = "Hardware de video no detectado o acceso denegado.";
  }
};

// --- LÓGICA DE ESCANEO ---
const scanFace = async () => {
  if (isSearching.value || !isCameraReady.value) return;
  
  isSearching.value = true;
  result.value = null;

  const context = canvas.value.getContext('2d');
  canvas.value.width = video.value.videoWidth;
  canvas.value.height = video.value.videoHeight;
  context.drawImage(video.value, 0, 0);
  
  canvas.value.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'scan.jpg');
    
    const endpoint = mode.value === 'entry' ? '/access/verify' : '/access/verify-exit';

    try {
      const resp = await api.post(endpoint, formData);
      
      if (resp.data.status === 'success') {
        result.value = resp.data;
        const esHorarioLegal = resp.data.horario_legal;

        Swal.fire({
          icon: esHorarioLegal ? 'success' : 'warning',
          title: esHorarioLegal ? (mode.value === 'entry' ? 'INGRESO AUTORIZADO' : 'SALIDA REGISTRADA') : 'INGRESO FUERA DE HORARIO',
          text: esHorarioLegal 
                ? `${resp.data.nombre} - Registro correcto.` 
                : `${resp.data.nombre} - ¡Atención! Fuera de horario oficial.`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000,
          background: esHorarioLegal ? '#ffffff' : '#fff4f4',
          color: '#1b3022'
        });
      } else {
        result.value = resp.data;
        Swal.fire({
          icon: 'error',
          title: 'SUJETO NO IDENTIFICADO',
          text: resp.data.message,
          background: '#ffffff',
          confirmButtonColor: '#1b3022'
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Fallo de conexión con el servidor central.";
      result.value = { status: 'error', message: errorMsg };
      Swal.fire({
        icon: 'warning',
        title: 'ALERTA DE SEGURIDAD',
        text: errorMsg,
        confirmButtonColor: '#d33'
      });
    } finally {
      isSearching.value = false;
    }
  }, 'image/jpeg');
};

const resetScan = () => { result.value = null; };

onMounted(startCamera);
onBeforeUnmount(() => {
  if (video.value?.srcObject) {
    video.value.srcObject.getTracks().forEach(t => t.stop());
  }
});
</script>

<template>
  <div class="flex flex-col items-center justify-start lg:justify-center min-h-screen lg:min-h-[80vh] space-y-6 lg:space-y-8 animate-in zoom-in duration-500 p-2">
    
    <div class="text-center space-y-2">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2d5a27]/10 rounded-full border border-[#2d5a27]/20 mb-2">
        <Activity class="h-3 w-3 text-[#2d5a27] animate-pulse" />
        <span class="text-[9px] font-black text-[#2d5a27] uppercase tracking-widest">Protocolo Biométrico - Vigilancia Real</span>
      </div>
      <h2 class="text-2xl lg:text-3xl font-black text-[#1b3022] uppercase italic tracking-tighter">Punto de Control</h2>
    </div>

    <div class="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-lg w-full max-w-md">
      <button 
        @click="mode = 'entry'; resetScan()"
        :class="mode === 'entry' ? 'bg-[#1b3022] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'"
        class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300"
      >
        <LogIn class="h-4 w-4" /> Ingreso
      </button>
      <button 
        @click="mode = 'exit'; resetScan()"
        :class="mode === 'exit' ? 'bg-red-700 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'"
        class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300"
      >
        <LogOut class="h-4 w-4" /> Salida
      </button>
    </div>

    <div class="relative w-full max-w-4xl aspect-video rounded-[2.5rem] lg:rounded-[3.5rem] border-[6px] lg:border-[12px] border-white bg-black overflow-hidden shadow-2xl ring-1 ring-gray-200">
      
      <video ref="video" autoplay playsinline muted class="w-full h-full object-cover transition-opacity duration-700" :class="isCameraReady ? 'opacity-80' : 'opacity-0'"></video>
      <canvas ref="canvas" class="hidden"></canvas>

      <div v-if="!isCameraReady || cameraError" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-30">
        <div v-if="cameraError" class="p-8 text-center">
          <AlertCircle class="h-16 w-16 text-red-600 mx-auto mb-4" />
          <p class="text-sm font-black text-[#1b3022] uppercase">{{ cameraError }}</p>
          <button @click="startCamera" class="mt-6 px-8 py-3 bg-[#1b3022] text-white text-[10px] font-black uppercase rounded-xl tracking-widest">Reconectar Cámara</button>
        </div>
        <div v-else class="space-y-4 text-center">
          <Loader2 class="h-10 w-10 text-[#2d5a27] animate-spin mx-auto" />
          <p class="text-[9px] font-black text-[#2d5a27] uppercase tracking-[0.4em] animate-pulse">Sincronizando Sensor...</p>
        </div>
      </div>

      <div v-if="isSearching" class="absolute inset-0 z-20 pointer-events-none">
        <div :class="mode === 'entry' ? 'bg-[#d4af37]' : 'bg-red-500'" class="h-1 w-full shadow-[0_0_30px_currentColor] absolute top-0 animate-scan-line"></div>
        <div class="absolute inset-0 bg-[#1b3022]/10 backdrop-blur-[1px]"></div>
      </div>

      <div v-if="result && result.status === 'success'" 
           class="absolute inset-x-4 lg:inset-x-8 bottom-4 lg:bottom-8 p-4 lg:p-6 rounded-[2rem] border-2 backdrop-blur-xl flex items-center gap-4 lg:gap-6 animate-in slide-in-from-bottom-12 z-40 shadow-2xl"
           :class="result.horario_legal || mode === 'exit' ? 'bg-white/90 border-[#2d5a27]/30' : 'bg-red-50/95 border-red-400'">
        
        <div :class="['p-4 rounded-2xl shadow-lg', (result.horario_legal || mode === 'exit') ? (mode === 'entry' ? 'bg-[#2d5a27]' : 'bg-red-700') : 'bg-red-600 animate-pulse']">
          <ShieldCheck v-if="result.horario_legal || mode === 'exit'" class="h-8 w-8 text-white" />
          <ShieldAlert v-else class="h-8 w-8 text-white" />
        </div>

        <div class="flex-1">
          <div class="flex justify-between items-start">
            <p class="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">
              Identidad Verificada
            </p>
            <span v-if="mode === 'entry'" 
                  :class="result.horario_legal ? 'bg-emerald-100 text-emerald-800' : 'bg-red-600 text-white'" 
                  class="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm">
              {{ result.horario_legal ? 'Horario Oficial' : 'Infracción de Horario' }}
            </span>
          </div>

          <h4 class="text-xl lg:text-2xl font-black text-[#1b3022] uppercase tracking-tighter truncate">
            {{ result.nombre }}
          </h4>
          
          <div class="mt-2 flex flex-wrap items-center gap-3 lg:gap-6">
            <p :class="result.horario_legal || mode === 'exit' ? 'text-slate-600' : 'text-red-700 font-bold'" class="text-[10px] font-black uppercase">
              {{ result.message }}
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="result && result.status === 'error'" 
           class="absolute inset-x-4 lg:inset-x-8 bottom-4 lg:bottom-8 p-6 rounded-[2rem] bg-red-950/90 border-2 border-red-500 backdrop-blur-xl flex items-center gap-6 animate-in slide-in-from-bottom-12 z-40">
        <div class="p-4 rounded-2xl bg-red-600">
          <ShieldAlert class="h-8 w-8 text-white" />
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-red-200">Acceso Denegado</p>
          <h4 class="text-xl font-black text-white uppercase">{{ result.message }}</h4>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md lg:max-w-4xl">
      <button @click="scanFace" :disabled="isSearching || !isCameraReady"
        :class="mode === 'entry' ? 'bg-[#1b3022]' : 'bg-red-700'"
        class="flex-1 flex items-center justify-center gap-4 px-10 py-6 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 shadow-xl w-full group">
        <Loader2 v-if="isSearching" class="h-5 w-5 animate-spin" />
        <Camera v-else class="h-5 w-5 text-[#d4af37]" />
        {{ isSearching ? 'Procesando Muestra...' : 'Validar Biometría' }}
      </button>

      <button v-if="result" @click="resetScan" class="p-6 bg-white border border-gray-200 rounded-2xl text-[#1b3022] hover:bg-gray-50 transition-all shadow-md active:rotate-180 duration-500">
        <RefreshCw class="h-5 w-5" />
      </button>
    </div>

    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] pb-8">Policía Boliviana - Protocolo Biométrico D.N.S.P.</p>

  </div>
</template>

<style scoped>
@keyframes scanLine {
  0% { top: 0%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.animate-scan-line {
  animation: scanLine 2.5s linear infinite;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #1b3022; border-radius: 10px; }
</style>