<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../store/auth';
import { useRouter } from 'vue-router';
import { Lock, User, Loader2, Award, Scale } from 'lucide-vue-next';
import escudoPoliciaUrl from '../../assets/escudo_policia.jpg'; // <-- Importamos el escudo

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;
  try {
    await authStore.login(username.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    error.value = err || 'Error de conexión con el Comando Central';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#143123] px-4 font-sans">
    
    <div class="absolute inset-0 z-0 opacity-15">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#2f6d4d_1px,transparent_1px),linear-gradient(to_bottom,#2f6d4d_1px,transparent_1px)] bg-[size:30px_30px]"></div>
    </div>

    <div class="fixed top-0 left-0 right-0 h-1.5 flex shadow-lg">
      <div class="h-full w-1/3 bg-[#d32f2f]"></div> <div class="h-full w-1/3 bg-[#fdd835]"></div> <div class="h-full w-1/3 bg-[#2e7d32]"></div> </div>

    <div class="z-10 w-full max-w-md space-y-8 rounded-2xl border border-[#2f6d4d]/60 bg-[#1a3f2d]/95 p-8 shadow-[0_0_60px_-10px_rgba(20,49,35,0.8)] backdrop-blur-md">
      <div class="text-center">
        <div class="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#143123] border-2 border-[#d6a13d]">
          <img 
            :src="escudoPoliciaUrl" 
            alt="Escudo Oficial de la Policía Boliviana" 
            class="h-24 w-auto object-contain"
          />
        </div>
        <h2 class="mt-4 text-3xl font-extrabold tracking-tight text-white">BIO-CONTROL</h2>
        <p class="text-sm font-bold text-[#d6a13d] tracking-widest uppercase">Policía Boliviana</p>
        <p class="mt-1 text-[11px] text-green-200 uppercase">D.N.S.P. - Comando de Seguridad Penitenciaria</p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label class="text-[11px] font-bold text-green-100 uppercase ml-1">Nro. de Escalafón / Usuario de Red</label>
            <div class="group relative flex items-center mt-1">
              <User class="absolute left-3 h-5 w-5 text-green-700 group-focus-within:text-green-300 transition-colors" />
              <input
                v-model="username"
                type="text"
                required
                class="block w-full rounded-lg border border-[#2f6d4d]/60 bg-[#143123]/60 py-3 pl-10 pr-3 text-white outline-none ring-1 ring-transparent transition-all focus:border-[#d6a13d] focus:ring-[#d6a13d]/20"
              />
            </div>
          </div>

          <div>
            <label class="text-[11px] font-bold text-green-100 uppercase ml-1">Contraseña de Servicio</label>
            <div class="group relative flex items-center mt-1">
              <Lock class="absolute left-3 h-5 w-5 text-green-700 group-focus-within:text-green-300 transition-colors" />
              <input
                v-model="password"
                type="password"
                required
                class="block w-full rounded-lg border border-[#2f6d4d]/60 bg-[#143123]/60 py-3 pl-10 pr-3 text-white outline-none ring-1 ring-transparent transition-all focus:border-[#d6a13d] focus:ring-[#d6a13d]/20"
              />
            </div>
          </div>
        </div>

        <div v-if="error" class="rounded-lg border-2 border-red-700 bg-red-950/70 p-4 text-center text-xs text-red-100 font-bold uppercase tracking-tight">
          ACCESO DENEGADO: {{ error }}
          <p class="text-[10px] font-medium text-red-200 mt-1">Contacte al Comando Local si el problema persiste.</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="group relative flex w-full justify-center rounded-lg bg-[#2e7d32] py-3 text-sm font-extrabold text-white transition-all hover:bg-[#1b5e20] border-b-4 border-[#143123] active:border-b-0 active:translate-y-1 disabled:opacity-50"
        >
          <span v-if="isLoading" class="flex items-center gap-2">
            <Loader2 class="h-4 w-4 animate-spin" /> VERIFICANDO ACCESO...
          </span>
          <span v-else class="flex items-center gap-2 uppercase tracking-wide">
             <Scale class="h-4 w-4" /> INGRESAR AL SISTEMA
          </span>
        </button>
      </form>

      <div class="mt-6 flex items-center justify-center gap-2 border-t border-[#2f6d4d]/40 pt-6">
        <Award class="h-4 w-4 text-[#d6a13d]" />
        <span class="text-[10px] text-green-100 uppercase font-bold tracking-widest text-center">
          "Contra el mal, por el bien de todos"
        </span>
      </div>
    </div>
  </div>
</template>