<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Camera, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  LogIn, 
  LogOut,
  User,
  Info
} from 'lucide-vue-next';

// Estados del hardware y escaneo
const video = ref(null);
const canvas = ref(null);
const isSearching = ref(false);
const result = ref(null);
const cameraError = ref(null);
const isCameraReady = ref(false);

// Modo de control: 'entry' para ingresos, 'exit' para salidas
const mode = ref('entry'); 

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
    cameraError.value = "No se pudo acceder al hardware de video.";
  }
};

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
    
    // Cambiamos dinámicamente el endpoint según el modo seleccionado
    const endpoint = mode.value === 'entry' ? '/access/verify' : '/access/verify-exit';

    try {
      const resp = await axios.post(`http://127.0.0.1:8000${endpoint}`, formData);
      result.value = resp.data;

      if (resp.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: mode.value === 'entry' ? 'INGRESO AUTORIZADO' : 'SALIDA REGISTRADA',
          text: `${resp.data.nombre} - ${mode.value === 'entry' ? 'Bienvenido' : 'Retiro confirmado'}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          background: '#111418',
          color: '#fff'
        });
      }
    } catch (err) {
      result.value = { 
        status: 'error', 
        message: err.response?.data?.detail || "Fallo de comunicación con el sensor central." 
      };
    } finally {
      isSearching.value = false;
    }
  }, 'image/jpeg');
};

onMounted(startCamera);
onBeforeUnmount(() => {
  if (video.value?.srcObject) video.value.srcObject.getTracks().forEach(t => t.stop());
});
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[75vh] space-y-8 animate-in zoom-in duration-500">
    
    <div class="text-center space-y-2">
      <h2 class="text-3xl font-black text-white uppercase italic tracking-tighter">Control Biométrico Penal</h2>
      <p class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Sincronización de Identidad en Tiempo Real</p>
    </div>

    <div class="flex bg-[#111418] p-1.5 rounded-3xl border border-white/5 shadow-2xl scale-110">
      <button 
        @click="mode = 'entry'; result = null"
        :class="mode === 'entry' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:text-white'"
        class="flex items-center gap-3 px-10 py-3 rounded-2xl text-[11px] font-black uppercase transition-all duration-300"
      >
        <LogIn class="h-4 w-4" /> INGRESO
      </button>
      <button 
        @click="mode = 'exit'; result = null"
        :class="mode === 'exit' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-white'"
        class="flex items-center gap-3 px-10 py-3 rounded-2xl text-[11px] font-black uppercase transition-all duration-300"
      >
        <LogOut class="h-4 w-4" /> SALIDA
      </button>
    </div>

    <div class="relative w-full max-w-4xl aspect-video rounded-[3rem] border-[10px] border-[#111418] bg-[#0a0c10] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
      
      <video ref="video" autoplay playsinline muted class="w-full h-full object-cover transition-opacity duration-700" :class="isCameraReady ? 'opacity-70' : 'opacity-0'"></video>
      <canvas ref="canvas" class="hidden"></canvas>

      <div v-if="!isCameraReady || cameraError" class="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0c10] z-30">
        <div v-if="cameraError" class="p-8 text-center">
          <AlertCircle class="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <p class="text-sm font-black text-white uppercase">{{ cameraError }}</p>
          <button @click="startCamera" class="mt-6 px-10 py-4 bg-brand text-white text-[11px] font-black uppercase rounded-full tracking-widest">Reconectar Sensor</button>
        </div>
        <div v-else class="space-y-4">
          <Loader2 class="h-12 w-12 text-brand animate-spin mx-auto" />
          <p class="text-[10px] font-black text-brand uppercase tracking-[0.5em]">Iniciando Motor Facial...</p>
        </div>
      </div>

      <div v-if="isSearching" class="absolute inset-0 z-20 pointer-events-none">
        <div :class="mode === 'entry' ? 'bg-brand' : 'bg-rose-500'" class="h-1 w-full shadow-[0_0_40px_currentColor] absolute top-0 animate-[scan_1.5s_linear_infinite]"></div>
        <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
      </div>

      <div v-if="result" 
           class="absolute inset-x-8 bottom-8 p-6 rounded-[2.5rem] border-2 backdrop-blur-3xl flex items-center gap-6 animate-in slide-in-from-bottom-12 z-40"
           :class="result.status === 'success' ? (mode === 'entry' ? 'bg-brand/20 border-brand/40 shadow-brand/20' : 'bg-rose-500/20 border-rose-500/40 shadow-rose-500/20') : 'bg-rose-950/40 border-rose-500/40'">
        
        <div :class="['p-5 rounded-2xl shadow-xl', result.status === 'success' ? (mode === 'entry' ? 'bg-brand' : 'bg-rose-500') : 'bg-rose-600']">
          <ShieldCheck v-if="result.status === 'success'" class="h-10 w-10 text-white" />
          <ShieldAlert v-else class="h-10 w-10 text-white" />
        </div>

        <div class="flex-1">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            {{ result.status === 'success' ? 'Verificación Exitosa' : 'Denegado' }}
          </p>
          <h4 class="text-3xl font-black text-white uppercase tracking-tighter leading-none">
            {{ result.status === 'success' ? result.nombre : 'Sujeto No Identificado' }}
          </h4>
          
          <div v-if="result.status === 'success'" class="mt-4 flex items-center gap-6">
            <div class="flex items-center gap-2 text-[11px] font-bold text-white/80">
              <User class="h-4 w-4 text-brand" /> Visita: <span class="text-white font-black">{{ result.visitando_a }}</span>
            </div>
            <div v-if="result.con_ninos" class="flex items-center gap-2 text-[11px] font-bold text-amber-500">
              <Info class="h-4 w-4" /> Con Menores
            </div>
          </div>
          <p v-else class="text-[11px] font-bold text-rose-500 mt-2">{{ result.message }}</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-6">
      <button @click="scanFace" :disabled="isSearching || !isCameraReady"
        :class="mode === 'entry' ? 'bg-brand shadow-brand/20' : 'bg-rose-500 shadow-rose-500/20'"
        class="flex items-center gap-4 px-20 py-7 rounded-[2rem] text-white font-black uppercase tracking-[0.4em] text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-30 shadow-2xl">
        <Loader2 v-if="isSearching" class="h-6 w-6 animate-spin" />
        <Camera v-else class="h-6 w-6" />
        {{ isSearching ? 'Procesando...' : (mode === 'entry' ? 'Registrar Ingreso' : 'Registrar Salida') }}
      </button>

      <button v-if="result" @click="result = null" class="p-7 bg-[#111418] border border-white/10 rounded-full text-white hover:bg-white/5 transition-all shadow-xl">
        <RefreshCw class="h-7 w-7" />
      </button>
    </div>

  </div>
</template>

<style scoped>
@keyframes scan {
  0% { top: 0%; opacity: 0; }
  50% { top: 100%; opacity: 1; }
  100% { top: 0%; opacity: 0; }
}

.shadow-brand { box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.3); }
.shadow-rose-500 { box-shadow: 0 20px 40px -15px rgba(244, 63, 94, 0.3); }

/* Personalización de scrollbars si es necesario */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #111418; border-radius: 10px; }
</style>