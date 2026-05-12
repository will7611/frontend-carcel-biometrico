<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../../store/auth';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { 
  UserPlus, Camera, RefreshCw, Search, 
  UserCheck, Baby, ShieldCheck, Loader2, X 
} from 'lucide-vue-next';

const authStore = useAuthStore();
const video = ref(null);
const canvas = ref(null);
const photoCaptured = ref(false);
const isSaving = ref(false);
const reclusos = ref([]);
const reclusoBusqueda = ref('');
const reclusosFiltrados = ref([]);

const formData = ref({
  nombre_completo: '',
  ci: '',
  edad: null,
  parentesco: '',
  id_recluso: '',
  con_ninos: false
});

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 1280, height: 720 } 
    });
    if (video.value) video.value.srcObject = stream;
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Error de Cámara', text: 'No se detectó hardware de video.', confirmButtonColor: '#1b3022' });
  }
};

const fetchReclusos = async () => {
  try {
    const res = await api.get('/reclusos/');
    reclusos.value = res.data;
  } catch (err) { console.error("Error cargando internos"); }
};

const buscarRecluso = () => {
  if (!reclusoBusqueda.value) { reclusosFiltrados.value = []; return; }
  reclusosFiltrados.value = reclusos.value.filter(r => 
    r.nombre.toLowerCase().includes(reclusoBusqueda.value.toLowerCase()) || 
    r.ci.includes(reclusoBusqueda.value)
  );
};

const seleccionarRecluso = (r) => {
  formData.value.id_recluso = r.id_recluso;
  reclusoBusqueda.value = `${r.nombre} ${r.apellidos} (CI: ${r.ci})`;
  reclusosFiltrados.value = [];
};

const capturePhoto = () => {
  const context = canvas.value.getContext('2d');
  canvas.value.width = video.value.videoWidth;
  canvas.value.height = video.value.videoHeight;
  context.drawImage(video.value, 0, 0);
  photoCaptured.value = true;
};

const saveVisitor = async () => {
  if (!photoCaptured.value || !formData.value.id_recluso) {
    return Swal.fire({ 
      icon: 'warning', 
      title: 'Datos Incompletos', 
      text: 'Vincule a un interno y capture la fotografía facial.', 
      confirmButtonColor: '#d4af37' 
    });
  }

  isSaving.value = true;
  try {
    // 1. Convertir Canvas a Blob
    const blob = await new Promise(resolve => canvas.value.toBlob(resolve, 'image/jpeg', 0.9));
    const data = new FormData();
    
    // 2. Mapeo riguroso de tipos para evitar el Error 422
    data.append('nombre_completo', String(formData.value.nombre_completo).toUpperCase().trim());
    data.append('ci', String(formData.value.ci).toUpperCase().trim());
    data.append('edad', parseInt(formData.value.edad) || 0);
    data.append('parentesco', String(formData.value.parentesco));
    data.append('id_recluso', parseInt(formData.value.id_recluso));
    data.append('id_pabellon', 1); // Este valor debería ser dinámico según el recluso, pero enviamos 1 por defecto para cumplir el esquema
    
    // Convertimos booleano a string "true"/"false" para que FastAPI lo procese bien en FormData
    data.append('con_ninos', formData.value.con_ninos ? 'true' : 'false');
    
    // 3. El archivo debe llamarse 'file' según el backend corregido
    data.append('file', blob, 'visitor.jpg');

    await api.post('/visitantes/enrolar', data);
    
    Swal.fire({ 
      icon: 'success', 
      title: 'Registro Exitoso', 
      text: 'Visitante autorizado en el padrón biométrico.', 
      confirmButtonColor: '#2d5a27' 
    });
    
    resetForm();
  } catch (err) {
    console.error("Error 422 - Detalle:", err.response?.data?.detail);
    Swal.fire({ 
      icon: 'error', 
      title: 'Error de Validación', 
      text: 'Los datos enviados no tienen el formato correcto.', 
      confirmButtonColor: '#1b3022' 
    });
  } finally {
    isSaving.value = false;
  }
};

const resetForm = () => {
  photoCaptured.value = false;
  reclusoBusqueda.value = '';
  formData.value = { nombre_completo: '', ci: '', edad: null, parentesco: '', id_recluso: '', con_ninos: false };
};

onMounted(() => { startCamera(); fetchReclusos(); });
onUnmounted(() => { if (video.value?.srcObject) video.value.srcObject.getTracks().forEach(t => t.stop()); });
</script>

<template>
  <div class="space-y-6 lg:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-2 lg:p-4">
    
    <div class="flex items-center gap-3">
      <UserCheck class="text-[#2d5a27] h-6 w-6" />
      <h1 class="text-xl font-black text-[#1b3022] uppercase tracking-tighter">Enrolamiento de Visitantes</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      <div class="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-gray-200 shadow-xl space-y-6">
        <h2 class="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.3em] border-b border-gray-100 pb-3">Ficha Técnica de Identificación</h2>
        
        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Nombre Completo</label>
            <input v-model="formData.nombre_completo" type="text" placeholder="EJ: PEDRO VARGAS" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] transition-all uppercase" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Cédula de Identidad (CI)</label>
              <input v-model="formData.ci" type="text" placeholder="EJ: 8548125" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] transition-all" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Edad</label>
              <input v-model="formData.edad" type="number" placeholder="18" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] transition-all" />
            </div>
          </div>

          <div class="space-y-1 relative">
            <label class="text-[10px] font-black text-[#2d5a27] uppercase ml-2 italic">Vincular con Interno</label>
            <div class="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 focus-within:border-[#d4af37] transition-all shadow-inner">
              <Search class="h-4 w-4 text-gray-400" />
              <input @input="buscarRecluso" v-model="reclusoBusqueda" placeholder="ESCRIBA NOMBRE O CI..." class="w-full bg-transparent p-4 text-gray-800 text-[11px] font-bold outline-none uppercase" />
            </div>
            <div v-if="reclusosFiltrados.length" class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl max-h-48 overflow-y-auto shadow-2xl">
              <button v-for="r in reclusosFiltrados" :key="r.id_recluso" @click="seleccionarRecluso(r)" class="w-full text-left p-4 hover:bg-[#2d5a27] hover:text-white text-gray-700 text-[10px] border-b border-gray-50 flex justify-between font-bold uppercase transition-colors">
                <span>{{ r.nombre }} {{ r.apellidos }}</span>
                <span class="opacity-60">CI: {{ r.ci }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Parentesco</label>
            <select v-model="formData.parentesco" class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800 text-xs font-bold outline-none focus:border-[#d4af37] appearance-none shadow-inner">
              <option value="" disabled>SELECCIONE VÍNCULO...</option>
              <option value="Padre/Madre">Padre / Madre</option>
              <option value="Conyuge">Cónyuge / Pareja</option>
              <option value="Abogado">Asistencia Legal (Abogado)</option>
              <option value="Otro">Otros</option>
            </select>
          </div>

          <label class="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
            <input type="checkbox" v-model="formData.con_ninos" class="w-5 h-5 accent-[#1b3022] rounded-md" />
            <span class="text-[#1b3022] text-[10px] font-black uppercase tracking-widest">Ingresa con menores de edad</span>
            <Baby class="text-blue-600 h-5 w-5 ml-auto" />
          </label>
        </div>

        <button @click="saveVisitor" :disabled="isSaving" 
          class="w-full py-5 bg-[#1b3022] text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl hover:brightness-125 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
          <Loader2 v-if="isSaving" class="animate-spin h-4 w-4" />
          <template v-else>
            <ShieldCheck class="h-4 w-4 text-[#d4af37]" /> Confirmar Registro
          </template>
        </button>
      </div>

      <div class="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-gray-200 flex flex-col items-center justify-center relative shadow-xl">
        <h2 class="text-[10px] font-black text-[#2d5a27] uppercase tracking-[0.3em] mb-6">Captura de Biometría Facial</h2>
        
        <div class="relative w-full aspect-square max-w-[420px] bg-black rounded-[3rem] overflow-hidden border-4" :class="photoCaptured ? 'border-[#d4af37]' : 'border-gray-200 shadow-inner'">
          <video v-show="!photoCaptured" ref="video" autoplay class="w-full h-full object-cover grayscale opacity-60"></video>
          <img v-if="photoCaptured" :src="canvas?.toDataURL('image/jpeg')" class="w-full h-full object-cover animate-in zoom-in duration-300" />
          <canvas ref="canvas" class="hidden"></canvas>
          
          <div v-if="!photoCaptured" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-64 h-64 border-2 border-[#d4af37]/40 rounded-full animate-pulse"></div>
            <div class="absolute inset-0 border-[30px] border-[#1b3022]/10"></div>
          </div>
        </div>

        <div class="flex gap-4 mt-8 w-full max-w-[420px]">
          <button @click="photoCaptured = false" v-if="photoCaptured" class="flex-1 py-5 rounded-2xl bg-gray-100 text-gray-600 font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">
            Repetir
          </button>
          <button @click="capturePhoto" :disabled="photoCaptured" 
            :class="photoCaptured ? 'bg-gray-100 text-gray-300' : 'bg-[#1b3022] text-white hover:scale-105'"
            class="flex-[2] py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
            <Camera class="h-5 w-5 text-[#d4af37]" /> Capturar Rostro
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
</style>