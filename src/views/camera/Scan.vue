<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import axios from 'axios';
import { Camera, ShieldAlert, ShieldCheck, Loader2, RefreshCw, AlertCircle } from 'lucide-vue-next';

const video = ref(null);
const canvas = ref(null);
const isSearching = ref(false);
const result = ref(null);
const cameraError = ref(null);
const isCameraReady = ref(false);

const startCamera = async () => {
  cameraError.value = null;
  try {
    // 1. Pedir permisos de cámara
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user" 
      } 
    });

    // 2. Asegurarnos de que el elemento DOM existe
    await nextTick();
    
    if (video.value) {
      video.value.srcObject = stream;
      video.value.onloadedmetadata = () => {
        video.value.play();
        isCameraReady.value = true;
      };
    }
  } catch (err) {
    console.error("Error de cámara:", err);
    if (err.name === 'NotAllowedError') {
      cameraError.value = "Permiso denegado. Por favor, habilite la cámara en su navegador.";
    } else {
      cameraError.value = "No se pudo detectar ninguna cámara conectada.";
    }
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

    try {
      // Asegúrate de que esta URL coincida con tu Backend en Postgres
      const resp = await axios.post('http://127.0.0.1:8000/access/verify-face', formData);
      result.value = resp.data;
    } catch (err) {
      console.error("Error en el servidor:", err);
      result.value = { match: false, detail: "Error de conexión con el servidor central." };
    } finally {
      isSearching.value = false;
    }
  }, 'image/jpeg');
};

onMounted(() => {
  startCamera();
});

onBeforeUnmount(() => {
  if (video.value && video.value.srcObject) {
    video.value.srcObject.getTracks().forEach(track => track.stop());
  }
});
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] p-4 space-y-6">
    
    <div class="relative w-full max-w-2xl aspect-video rounded-3xl border-4 border-emerald-900/30 bg-[#0f1115] overflow-hidden shadow-2xl shadow-emerald-900/10">
      
      <div v-if="!isCameraReady || cameraError" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f1115] p-6 text-center">
        <div v-if="cameraError" class="animate-in zoom-in duration-300">
          <AlertCircle class="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <p class="text-white font-bold uppercase tracking-tight">{{ cameraError }}</p>
          <button @click="startCamera" class="mt-4 px-6 py-2 bg-emerald-600 rounded-full text-xs font-black uppercase text-white">Reintentar</button>
        </div>
        <div v-else class="flex flex-col items-center">
          <Loader2 class="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p class="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Inicializando Sensor...</p>
        </div>
      </div>

      <video 
        ref="video" 
        autoplay 
        playsinline 
        muted 
        class="w-full h-full object-cover transition-opacity duration-500"
        :class="isCameraReady ? 'opacity-100' : 'opacity-0'"
      ></video>

      <canvas ref="canvas" class="hidden"></canvas>

      <div v-if="isSearching" class="absolute inset-0 z-10 pointer-events-none">
        <div class="h-1 w-full bg-emerald-500 shadow-[0_0_20px_#10b981] absolute top-0 animate-[scan_2s_linear_infinite]"></div>
        <div class="absolute inset-0 bg-emerald-500/5"></div>
      </div>

      <div v-if="result" 
           class="absolute bottom-6 left-6 right-6 p-4 rounded-2xl backdrop-blur-xl border-2 flex items-center gap-4 transition-all animate-in slide-in-from-bottom-5"
           :class="result.match ? 'bg-emerald-900/90 border-emerald-400/50' : 'bg-rose-900/90 border-rose-400/50'">
        
        <div class="p-3 rounded-xl" :class="result.match ? 'bg-emerald-500' : 'bg-rose-500'">
          <ShieldCheck v-if="result.match" class="h-6 w-6 text-white" />
          <ShieldAlert v-else class="h-6 w-6 text-white" />
        </div>

        <div class="flex-1 text-white">
          <p class="text-[9px] font-black uppercase tracking-widest">{{ result.match ? 'Sujeto Identificado' : 'Acceso Denegado' }}</p>
          <p class="text-xl font-black uppercase leading-tight">{{ result.match ? result.user.full_name : 'No Registrado' }}</p>
        </div>
      </div>
    </div>

    <div class="flex gap-4">
      <button 
        @click="scanFace" 
        :disabled="isSearching || !isCameraReady"
        class="group flex items-center gap-3 px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 rounded-full text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/40"
      >
        <Loader2 v-if="isSearching" class="h-5 w-5 animate-spin" />
        <Camera v-else class="h-5 w-5 group-active:scale-90 transition-transform" />
        {{ isSearching ? 'Analizando...' : 'Escanear Rostro' }}
      </button>

      <button v-if="result" @click="result = null" class="p-4 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-all">
        <RefreshCw class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes scan {
  0% { top: 0%; }
  100% { top: 100%; }
}
</style>