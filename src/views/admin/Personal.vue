<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../services/api'; 
import Swal from 'sweetalert2';
import { 
  UserPlus, Search, IdCard, UserCog, X, Loader2, 
  User, ChevronDown, Edit3, Trash2, ShieldCheck, Info
} from 'lucide-vue-next';

// --- ESTADOS ---
const staff = ref([]);
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentUserId = ref(null);
const search = ref('');

const form = ref({
  nombre: '', apellidos: '', ci: '', cargo: '', sexo: 'M',
  username: '', password: '', rol: 'policia'
});

// --- VALIDACIÓN DE CI (Pattern Bolivia) ---
const ciPattern = /^[0-9]{5,10}([- ]?[0-9A-Z]{1,2})?$/;

// --- LÓGICA ---
const fetchStaff = async () => {
  loading.value = true;
  try {
    const res = await api.get('/auth/staff');
    staff.value = res.data;
  } catch (err) { console.error("Error al cargar:", err); }
  finally { loading.value = false; }
};

const openCreateModal = () => {
  isEditing.value = false;
  resetForm();
  showModal.value = true;
};

const editStaff = (person) => {
  isEditing.value = true;
  currentUserId.value = person.id; 
  form.value = {
    nombre: person.nombre,
    apellidos: person.apellidos,
    ci: person.ci,
    cargo: person.cargo,
    sexo: person.sexo || 'M',
    username: person.username,
    password: '', 
    rol: person.rol
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  // Validaciones preventivas en Frontend
  if (!ciPattern.test(form.value.ci)) {
    return Swal.fire({
      icon: 'error', title: 'CI Inválido',
      text: 'El formato debe ser números seguidos opcionalmente de un complemento (Ej: 8548125-1A)',
      background: '#111418', color: '#fff'
    });
  }

  submitting.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/auth/staff/${currentUserId.value}`, form.value);
    } else {
      await api.post('/auth/register-staff', form.value);
    }
    
    Swal.fire({
      icon: 'success',
      title: isEditing.value ? 'Actualizado' : 'Registrado',
      text: 'Protocolo de seguridad actualizado correctamente.',
      background: '#111418', color: '#fff', confirmButtonColor: '#10b981'
    });

    showModal.value = false;
    fetchStaff();
  } catch (err) {
    Swal.fire({
      icon: 'error', title: 'Fallo de Validación',
      text: err.response?.data?.detail || 'Error en la integridad de datos',
      background: '#111418', color: '#fff'
    });
  } finally { submitting.value = false; }
};

const deleteStaff = async (userId) => {
  const result = await Swal.fire({
    title: '¿Revocar Acceso?',
    text: "El funcionario será eliminado permanentemente del escalafón.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f43f5e',
    confirmButtonText: 'SÍ, ELIMINAR',
    background: '#111418', color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/auth/staff/${userId}`);
      fetchStaff();
      Swal.fire({ title: 'Baja Procesada', icon: 'success', background: '#111418', color: '#fff' });
    } catch (err) {
      Swal.fire({ title: 'Error al eliminar', icon: 'error', background: '#111418', color: '#fff' });
    }
  }
};

const filteredStaff = computed(() => {
  const s = search.value.toLowerCase();
  return staff.value.filter(p => 
    p.nombre.toLowerCase().includes(s) || p.apellidos.toLowerCase().includes(s) || p.ci.includes(s)
  );
});

const resetForm = () => {
  form.value = { nombre: '', apellidos: '', ci: '', cargo: '', sexo: 'M', username: '', password: '', rol: 'policia' };
};

onMounted(fetchStaff);
</script>

<template>
  <div class="p-6 space-y-8 animate-in fade-in duration-700">
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111418] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
      <div>
        <h2 class="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
          <UserCog class="text-brand h-7 w-7" /> Escalafón de Seguridad
        </h2>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">D.N.S.P. - Comando Penitenciario</p>
      </div>

      <div class="flex gap-4 w-full md:w-auto">
        <div class="relative flex-1 md:w-80">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input v-model="search" placeholder="Buscar por Nombre o CI..." 
            class="w-full bg-black/40 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-[11px] text-white outline-none focus:border-brand/50 transition-all shadow-inner" />
        </div>
        <button @click="openCreateModal" class="bg-brand text-white p-4 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-brand/20">
          <UserPlus class="h-6 w-6" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20"><Loader2 class="h-10 w-10 text-brand animate-spin" /></div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="person in filteredStaff" :key="person.id" 
        class="bg-[#111418] p-6 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-all group relative overflow-hidden">
        
        <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="editStaff(person)" class="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><Edit3 class="h-4 w-4"/></button>
          <button @click="deleteStaff(person.id)" class="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 class="h-4 w-4"/></button>
        </div>

        <div class="flex items-center gap-4">
          <div class="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-brand font-black text-xl border border-white/5 uppercase">
            {{ person.nombre[0] }}{{ person.apellidos[0] }}
          </div>
          <div>
            <h3 class="text-white font-black uppercase italic text-sm leading-tight">{{ person.nombre }} <br/> {{ person.apellidos }}</h3>
            <span :class="person.rol === 'admin' ? 'text-brand' : 'text-blue-400'" class="text-[9px] font-black uppercase tracking-widest">{{ person.rol }}</span>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
          <div class="flex flex-col">
            <span class="text-[9px] text-slate-600 font-black uppercase tracking-tighter">Identificación</span>
            <span class="text-white text-xs font-mono tracking-tighter">{{ person.ci }}</span>
          </div>
          <div class="flex flex-col items-end text-right">
            <span class="text-[9px] text-slate-600 font-black uppercase tracking-tighter">Rango/Puesto</span>
            <span class="text-slate-300 text-[10px] font-bold uppercase truncate w-full">{{ person.cargo }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-[#111418] w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 class="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
             <ShieldCheck class="text-brand h-6 w-6" /> {{ isEditing ? 'Actualizar Ficha' : 'Nuevo Enrolamiento' }}
          </h2>
          <button @click="showModal = false" class="text-slate-500 hover:text-white transition-colors"><X/></button>
        </div>

        <form @submit.prevent="handleSubmit" class="p-8 space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Nombres</label>
              <input v-model="form.nombre" required type="text" placeholder="Ej: Juan Pablo" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all placeholder:text-slate-700" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Apellidos</label>
              <input v-model="form.apellidos" required type="text" placeholder="Ej: Perez Mamani" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all placeholder:text-slate-700" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Cédula de Identidad</label>
              <input 
                v-model="form.ci" 
                required 
                type="text" 
                placeholder="Ej: 8548125 o 8548125-1A"
                @input="form.ci = form.ci.toUpperCase().replace(/\s+/g, '')"
                :class="form.ci && !ciPattern.test(form.ci) ? 'border-red-500/50 text-red-500' : 'border-white/10 text-white'"
                class="w-full bg-black/40 border p-4 rounded-2xl text-xs font-bold outline-none focus:border-brand/50 transition-all" 
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Género</label>
              <select v-model="form.sexo" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 appearance-none">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Cargo / Rango</label>
              <input v-model="form.cargo" required type="text" placeholder="Ej: Sargento Primero" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all placeholder:text-slate-700" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2 italic">Privilegios</label>
              <select v-model="form.rol" class="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-xs font-bold outline-none focus:border-brand/50 appearance-none">
                <option value="policia">👮 Personal Operativo</option>
                <option value="admin">🔑 Administrador</option>
              </select>
            </div>
          </div>

          <div class="space-y-4 p-6 bg-white/[0.03] rounded-[2.5rem] border border-white/5 mt-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[9px] font-black text-slate-500 uppercase ml-2 italic">Username de Red</label>
                <input v-model="form.username" required type="text" placeholder="Ej: jperez_2024" @input="form.username = form.username.toLowerCase().replace(/\s+/g, '')" class="w-full bg-black/60 border border-white/10 p-4 rounded-xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all" />
              </div>
              <div class="space-y-1">
                <label class="text-[9px] font-black text-slate-500 uppercase ml-2 italic">{{ isEditing ? 'Nueva Clave (Opcional)' : 'Contraseña Central' }}</label>
                <input v-model="form.password" :required="!isEditing" type="password" placeholder="••••••••" class="w-full bg-black/60 border border-white/10 p-4 rounded-xl text-white text-xs font-bold outline-none focus:border-brand/50 transition-all placeholder:text-slate-700" />
              </div>
            </div>
            <div class="flex items-center gap-2 px-2">
              <Info class="h-3 w-3 text-slate-600" />
              <p class="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Mínimo 6 caracteres alfanuméricos para la seguridad del sistema.</p>
            </div>
          </div>

          <div class="flex justify-end gap-4 mt-8">
            <button type="button" @click="showModal = false" class="px-8 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
            <button type="submit" :disabled="submitting" 
              class="px-10 py-4 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2">
              <span v-if="!submitting">{{ isEditing ? 'Guardar Cambios' : 'Confirmar Registro' }}</span>
              <Loader2 v-else class="animate-spin h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Evitar scroll horizontal en nombres largos */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>