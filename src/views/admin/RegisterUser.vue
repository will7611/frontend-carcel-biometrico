<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import { UserPlus, Camera, Save, RefreshCw, Search } from 'lucide-vue-next';

const video = ref(null);
const canvas = ref(null);
const photoCaptured = ref(false);
const isSaving = ref(false);
const reclusos = ref([]);
const message = ref({ type: '', text: '' });

const formData = ref({
  nombre_completo: '',
  ci: '',
  edad: null,
  parentesco: 'Familiar',
  id_recluso: '',
  con_ninos: false
});

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.value.srcObject = stream;
  } catch (err) {
    message.value = { type: 'error', text: 'Cámara no detectada.' };
  }
};

const fetchReclusos = async () => {
  try {
    const res = await api.get('/reclusos'); // Asegúrate de tener este endpoint
    reclusos.value = res.data;
  } catch (err) { console.error("Error cargando reclusos"); }
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
    message.value = { type: 'error', text: 'Faltan datos o captura facial.' };
    return;
  }
  isSaving.value = true;

  try {
    canvas.value.toBlob(async (blob) => {
      const data = new FormData();
      // Campos requeridos por el backend (Form)
      data.append('nombre_completo', formData.value.nombre_completo);
      data.append('ci', formData.value.ci);
      data.append('edad', formData.value.edad);
      data.append('parentesco', formData.value.parentesco);
      data.append('id_recluso', formData.value.id_recluso);
      data.append('id_personal_enrola', 1); // Aquí deberías usar el ID del oficial logueado
      data.append('con_ninos', formData.value.con_ninos);
      data.append('file', blob, 'visitor.jpg');

      await api.post('/auth/register-visitante', data);
      message.value = { type: 'success', text: 'Visitante enrolado correctamente.' };
      resetForm();
    }, 'image/jpeg');
  } catch (err) {
    message.value = { type: 'error', text: 'Error en el registro.' };
  } finally { isSaving.value = false; }
};

const resetForm = () => {
  photoCaptured.value = false;
  formData.value = { nombre_completo: '', ci: '', edad: null, parentesco: 'Familiar', id_recluso: '', con_ninos: false };
};

onMounted(() => {
  startCamera();
  fetchReclusos();
});
</script>

<template>
  <div class="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div class="bg-[#111418] border border-white/5 p-8 rounded-3xl space-y-6">
      <h2 class="text-brand font-black uppercase tracking-widest text-sm">Registro de Visitante</h2>
      
      <div class="space-y-4">
        <input v-model="formData.nombre_completo" type="text" placeholder="Nombre Completo" class="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand" />
        <div class="grid grid-cols-2 gap-4">
          <input v-model="formData.ci" type="text" placeholder="Cédula (CI)" class="bg-black/20 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand" />
          <input v-model="formData.edad" type="number" placeholder="Edad" class="bg-black/20 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand" />
        </div>
        
        <select v-model="formData.id_recluso" class="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand">
          <option value="" disabled>Seleccionar Recluso a visitar</option>
          <option v-for="r in reclusos" :key="r.id_recluso" :value="r.id_recluso">{{ r.nombre }} {{ r.apellidos }} ({{ r.ci }})</option>
        </select>

        <select v-model="formData.parentesco" class="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand">
          <option value="Familiar">Familiar Directo</option>
          <option value="Abogado">Abogado</option>
          <option value="Otro">Otros</option>
        </select>
      </div>

      <div v-if="message.text" :class="['p-4 rounded-xl text-xs font-bold uppercase', message.type === 'success' ? 'bg-brand/10 text-brand' : 'bg-rose-500/10 text-rose-500']">
        {{ message.text }}
      </div>
    </div>

    <div class="bg-[#111418] border border-white/5 p-8 rounded-3xl flex flex-col items-center gap-6">
      <div class="relative w-full aspect-square max-w-sm rounded-full overflow-hidden border-4 border-brand/20 shadow-2xl">
        <video v-show="!photoCaptured" ref="video" autoplay class="w-full h-full object-cover grayscale"></video>
        <canvas v-show="photoCaptured" ref="canvas" class="w-full h-full object-cover"></canvas>
      </div>
      
      <div class="flex gap-4 w-full max-w-sm">
        <button @click="photoCaptured ? (photoCaptured = false) : capturePhoto()" class="flex-1 p-4 rounded-2xl bg-white/5 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">
          <RefreshCw v-if="photoCaptured" class="h-4 w-4 mx-auto" />
          <Camera v-else class="h-4 w-4 mx-auto" />
        </button>
        <button @click="saveVisitor" :disabled="isSaving" class="flex-[3] p-4 rounded-2xl bg-brand text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand/20 disabled:opacity-50">
          {{ isSaving ? 'Guardando...' : 'Finalizar Enrolamiento' }}
        </button>
      </div>
    </div>
  </div>
</template>