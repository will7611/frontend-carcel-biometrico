<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Camera, UserCheck, Search, Baby, ShieldAlert, RefreshCw } from 'lucide-vue-next';

const video = ref(null);
const canvas = ref(null);
const capturedPhoto = ref(null);
const loading = ref(false);
const reclusos = ref([]);
const reclusoBusqueda = ref('');
const reclusosFiltrados = ref([]);

const form = ref({
  nombre_completo: '',
  ci: '',
  edad: null,
  parentesco: '',
  id_recluso: null,
  id_pabellon: null,
  con_ninos: false,
  id_personal: 1 
});

const buscarRecluso = () => {
  if (!reclusoBusqueda.value) { reclusosFiltrados.value = []; return; }
  reclusosFiltrados.value = reclusos.value.filter(r => 
    r.nombre.toLowerCase().includes(reclusoBusqueda.value.toLowerCase()) || r.ci.includes(reclusoBusqueda.value)
  );
};

const seleccionarRecluso = (r) => {
  form.value.id_recluso = r.id_recluso;
  form.value.id_pabellon = r.pabellon_id;
  reclusoBusqueda.value = `${r.nombre} ${r.apellidos} (${r.ci})`;
  reclusosFiltrados.value = [];
};

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    if (video.value) video.value.srcObject = stream;
  } catch (err) {
    Swal.fire('Error', 'No se pudo acceder a la cámara.', 'error');
  }
};

const takePhoto = () => {
  if (!video.value) return;
  const ctx = canvas.value.getContext('2d');
  canvas.value.width = video.value.videoWidth;
  canvas.value.height = video.value.videoHeight;
  ctx.drawImage(video.value, 0, 0);
  capturedPhoto.value = canvas.value.toDataURL('image/jpeg');
};

const saveVisitante = async () => {
  if (!form.value.id_recluso || !capturedPhoto.value) {
    return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Seleccione un interno y capture la foto biométrica.', background: '#111418', color: '#fff' });
  }

  loading.value = true;
  try {
    const blob = await new Promise(resolve => canvas.value.toBlob(resolve, 'image/jpeg', 0.9));
    const fd = new FormData();
    
    // Mapeo manual para asegurar tipos de datos correctos
    fd.append('nombre_completo', form.value.nombre_completo);
    fd.append('ci', form.value.ci);
    fd.append('edad', parseInt(form.value.edad) || 0);
    fd.append('parentesco', form.value.parentesco);
    fd.append('id_recluso', parseInt(form.value.id_recluso));
    fd.append('id_pabellon', parseInt(form.value.id_pabellon));
    fd.append('id_personal', 1); // ID por defecto
    fd.append('con_ninos', String(form.value.con_ninos));
    fd.append('file', blob, 'visitante.jpg');

    await axios.post('http://127.0.0.1:8000/visitantes/enrolar', fd);
    
    Swal.fire({ icon: 'success', title: 'Visitante Registrado', text: 'Acceso autorizado y vinculado.', background: '#111418', color: '#fff' });
    resetForm();
  } catch (err) {
    // Evitar el error de "Expected string, got object" en SweetAlert
    const errorData = err.response?.data?.detail;
    const msg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData || 'Error desconocido');
    
    Swal.fire({ icon: 'error', title: 'Fallo en Registro', text: msg, background: '#111418', color: '#fff' });
  } finally { loading.value = false; }
};

const resetForm = () => {
  form.value = { nombre_completo: '', ci: '', edad: null, parentesco: '', id_recluso: null, id_pabellon: null, con_ninos: false, id_personal: 1 };
  reclusoBusqueda.value = '';
  capturedPhoto.value = null;
};

onMounted(async () => {
  try {
    const res = await axios.get('http://127.0.0.1:8000/reclusos/');
    reclusos.value = res.data;
  } catch (e) { console.error("Error al cargar reclusos"); }
  startCamera();
});

onUnmounted(() => {
  if (video.value?.srcObject) {
    video.value.srcObject.getTracks().forEach(t => t.stop());
  }
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto p-4">
    <div class="bg-[#111418] p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
      <div class="flex items-center gap-4 border-b border-white/5 pb-4">
        <div class="p-3 bg-brand/10 rounded-2xl"><UserCheck class="text-brand h-6 w-6" /></div>
        <div>
          <h2 class="text-xl font-black text-white uppercase italic">Control de Visitas</h2>
          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sincronización con base de datos penal</p>
        </div>
      </div>

      <div class="space-y-4">
        <input v-model="form.nombre_completo" placeholder="NOMBRE COMPLETO" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50" />
        
        <div class="grid grid-cols-2 gap-4">
          <input v-model="form.ci" placeholder="CI / DOCUMENTO" class="bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50" />
          <input v-model="form.edad" type="number" placeholder="EDAD" class="bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50" />
        </div>

        <div class="relative">
          <div class="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 focus-within:border-brand/50 transition-colors">
            <Search class="h-4 w-4 text-brand" />
            <input @input="buscarRecluso" v-model="reclusoBusqueda" placeholder="VINCULAR CON INTERNO..." class="w-full bg-transparent p-4 text-white text-xs font-bold outline-none" />
          </div>
          <div v-if="reclusosFiltrados.length" class="absolute z-50 w-full mt-2 bg-[#1a1f26] border border-white/10 rounded-2xl max-h-40 overflow-y-auto shadow-2xl">
            <button v-for="r in reclusosFiltrados" :key="r.id_recluso" @click="seleccionarRecluso(r)" class="w-full text-left p-4 hover:bg-brand/10 text-white text-[10px] border-b border-white/5 flex justify-between">
              <span>{{ r.nombre }} {{ r.apellidos }}</span>
              <span class="text-brand font-black">CI: {{ r.ci }}</span>
            </button>
          </div>
        </div>

        <select v-model="form.parentesco" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50">
          <option value="" disabled>GRADO DE PARENTESCO</option>
          <option value="Padre/Madre">Padre / Madre</option>
          <option value="Hijo/a">Hijo / a</option>
          <option value="Conyuge">Cónyuge / Pareja</option>
          <option value="Abogado">Abogado</option>
          <option value="Otro">Otros</option>
        </select>

        <label class="flex items-center gap-3 p-4 bg-brand/5 border border-brand/20 rounded-2xl cursor-pointer hover:bg-brand/10 transition-colors">
          <input type="checkbox" v-model="form.con_ninos" class="w-5 h-5 accent-brand rounded-md" />
          <span class="text-white text-[10px] font-black uppercase">Ingresa con menores de edad</span>
          <Baby class="text-brand h-4 w-4 ml-auto" />
        </label>
      </div>

      <button @click="saveVisitante" :disabled="loading" class="w-full py-5 bg-brand text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg hover:shadow-brand/20 hover:scale-[1.01] transition-all disabled:opacity-50">
        {{ loading ? 'Sincronizando Biometría...' : 'REGISTRAR Y AUTORIZAR' }}
      </button>
    </div>

    <div class="bg-[#111418] p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center space-y-6">
      <div class="relative w-full aspect-square max-w-[420px] bg-black rounded-[3rem] overflow-hidden border-2 border-brand/20">
        <video v-show="!capturedPhoto" ref="video" autoplay class="w-full h-full object-cover grayscale opacity-50"></video>
        <img v-if="capturedPhoto" :src="capturedPhoto" class="w-full h-full object-cover animate-in fade-in" />
        <canvas ref="canvas" class="hidden"></canvas>
        <div class="absolute inset-0 border-[30px] border-black/40 pointer-events-none"></div>
        <div class="absolute top-6 left-6 flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-brand animate-ping"></div>
          <span class="text-[8px] font-black text-brand uppercase italic">Sensor Activo</span>
        </div>
      </div>

      <button @click="capturedPhoto ? capturedPhoto = null : takePhoto()" class="p-6 rounded-full bg-brand shadow-xl shadow-brand/20 hover:scale-110 active:scale-95 transition-all">
        <Camera v-if="!capturedPhoto" class="text-white h-8 w-8" />
        <RefreshCw v-else class="text-white h-8 w-8" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #1a1f26; border-radius: 10px; }
</style>