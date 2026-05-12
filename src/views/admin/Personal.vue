<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import { 
  Users, ShieldCheck, UserPlus, RefreshCw, Briefcase, Key, Power, PowerOff
} from 'lucide-vue-next';

const staffList = ref([]);
const loading = ref(true);
const saving = ref(false);

// Formulario reactivo actualizado con el campo 'rol'
const form = ref({
  nombre_completo: '',
  ci: '',
  cargo: '',
  usuario: '',
  password: '',
  rol: 'policia' // Por defecto, el rol más bajo
});

const loadStaff = async () => {
  loading.value = true;
  try {
    const res = await api.get('/auth/staff');
    staffList.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Error al cargar personal", err);
  } finally {
    loading.value = false;
  }
};

const registerStaff = async () => {
  if (!form.value.ci || !form.value.nombre_completo) {
    alert("El CI y el Nombre son obligatorios.");
    return;
  }
  
  saving.value = true;
  try {
    const res = await api.post('/auth/register-staff', form.value);
    if (res.data.status === 'success') {
      form.value = { nombre_completo: '', ci: '', cargo: '', usuario: '', password: '', rol: 'policia' };
      loadStaff(); 
    } else {
      alert(res.data.message);
    }
  } catch (err) {
    console.error("Error al guardar:", err);
    alert("Ocurrió un error al registrar al funcionario.");
  } finally {
    saving.value = false;
  }
};

// Nueva función para cambiar el estado (Activar/Inhabilitar)
const toggleStatus = async (id, estadoActual) => {
  const nuevoEstado = estadoActual === 'Activo' ? false : true;
  const accion = nuevoEstado ? 'habilitar' : 'inhabilitar';
  
  if(confirm(`¿Estás seguro de que deseas ${accion} a este funcionario?`)) {
    try {
      // Hacemos una petición PUT/PATCH al backend (tendremos que crear esta ruta)
      await api.patch(`/auth/staff/${id}/status`, { estado: nuevoEstado });
      loadStaff(); // Recargamos para ver el cambio
    } catch(err) {
      alert("Error al cambiar el estado del funcionario.");
      console.error(err);
    }
  }
}

onMounted(loadStaff);
</script>

<template>
  <div class="p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
    
    <header class="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-10 rounded-[2.5rem] border-2 border-slate-200 shadow-xl">
      <div class="flex items-center gap-6">
        <div class="p-4 bg-[#2d5a27] rounded-3xl shadow-xl shadow-[#2d5a27]/30">
          <ShieldCheck class="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-[#1a3818] uppercase tracking-tighter">Gestión de Personal</h1>
          <p class="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.4em]">Policía Boliviana - Dirección General</p>
        </div>
      </div>
      <button @click="loadStaff" class="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all shadow-sm">
        <RefreshCw :class="{'animate-spin': loading}" class="h-6 w-6 text-[#2d5a27]" />
      </button>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <div class="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-xl h-fit">
        <h2 class="text-sm font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
          <UserPlus class="h-5 w-5 text-[#2d5a27]" /> Nuevo Registro
        </h2>
        
        <form @submit.prevent="registerStaff" class="space-y-5">
          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre Completo</label>
            <input v-model="form.nombre_completo" type="text" required placeholder="Ej. Juan Perez" 
              class="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#2d5a27]" />
          </div>

          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cédula de Identidad</label>
            <input v-model="form.ci" type="text" required placeholder="Nro. Documento" 
              class="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#2d5a27]" />
          </div>

          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rango / Cargo Físico</label>
            <div class="relative">
              <Briefcase class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select v-model="form.cargo" class="w-full bg-slate-50 border-2 border-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#2d5a27] appearance-none">
                <option value="" disabled>Seleccione rango...</option>
                <option value="Comandante">Comandante</option>
                <option value="Sargento">Sargento</option>
                <option value="Cabo">Cabo</option>
                <option value="Oficial de Guardia">Oficial de Guardia</option>
              </select>
            </div>
          </div>

          <div class="pt-4 border-t-2 border-slate-100">
            <h3 class="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Credenciales y Permisos</h3>
            
            <div class="space-y-4">
              
              <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nivel de Acceso</label>
                <select v-model="form.rol" class="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#2d5a27] appearance-none">
                  <option value="admin">Administrador (Control Total)</option>
                  <option value="tecnico">Técnico (Gestión Biométrica)</option>
                  <option value="policia">Policía (Solo Lectura/Registro)</option>
                </select>
              </div>

              <div>
                <input v-model="form.usuario" type="text" placeholder="Usuario (Opcional)" 
                  class="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#2d5a27]" />
              </div>
              <div class="relative">
                <Key class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input v-model="form.password" type="password" placeholder="Contraseña (Por defecto: 123456)" 
                  class="w-full bg-slate-50 border-2 border-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#2d5a27]" />
              </div>
            </div>
          </div>

          <button type="submit" :disabled="saving" 
            class="w-full mt-6 bg-[#2d5a27] text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-[#1f421b] transition-all disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Registrar Oficial' }}
          </button>
        </form>
      </div>

      <div class="lg:col-span-8 bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden shadow-xl">
        <div class="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 class="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
            <Users class="h-5 w-5 text-[#2d5a27]" /> Personal Activo
          </h2>
        </div>

        <div v-if="loading" class="py-24 text-center">
          <RefreshCw class="animate-spin h-10 w-10 mx-auto text-[#2d5a27] mb-4" />
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Base de Datos...</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-white border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th class="px-8 py-5">Oficial</th>
                <th class="px-8 py-5 text-center">Cargo / Rango</th>
                <th class="px-8 py-5 text-center">Usuario Sistema</th>
                <th class="px-8 py-5 text-right">Estatus / Acciones</th>
              </tr>
            </thead>
            <tbody class="text-[12px] font-bold">
              <tr v-for="p in staffList" :key="p.id" :class="{'opacity-60': p.estado === 'Inactivo'}" class="border-b-2 border-slate-50 hover:bg-slate-50 transition-colors">
                <td class="px-8 py-5">
                  <div class="flex items-center gap-4">
                    <div class="h-10 w-10 rounded-xl bg-[#2d5a27]/10 flex items-center justify-center text-[#2d5a27] font-black text-lg">
                      {{ p.nombre ? p.nombre.charAt(0).toUpperCase() : 'O' }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-slate-800 uppercase font-black">{{ p.nombre || 'SIN NOMBRE' }}</span>
                      <span class="text-[10px] text-slate-500 font-bold">CI: {{ p.ci }} - Nivel: {{ p.rol }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5 text-center text-slate-600 uppercase">{{ p.cargo || 'NO ASIGNADO' }}</td>
                <td class="px-8 py-5 text-center text-slate-400 font-mono">{{ p.usuario }}</td>
                <td class="px-8 py-5 text-right flex items-center justify-end gap-3">
                  <span :class="p.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'" 
                    class="px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2">
                    {{ p.estado }}
                  </span>
                  <button @click="toggleStatus(p.id, p.estado)" 
                    :class="p.estado === 'Activo' ? 'text-red-500 hover:bg-red-100' : 'text-emerald-500 hover:bg-emerald-100'"
                    class="p-2 rounded-lg transition-colors" title="Cambiar Estado">
                    <PowerOff v-if="p.estado === 'Activo'" class="w-4 h-4" />
                    <Power v-else class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="staffList.length === 0">
                <td colspan="4" class="py-16 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No hay personal registrado en el sistema
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Roboto+Mono:wght@700&display=swap');
* { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'Roboto Mono', monospace; }
</style>