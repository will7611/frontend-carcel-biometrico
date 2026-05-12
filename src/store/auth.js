import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    // LA SOLUCIÓN: Buscamos 'rol' (lo que manda el backend) o 'role' por seguridad
    userRole: (state) => state.user?.rol || state.user?.role || 'invitado',
  },

  actions: {
    async login(username, password) {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      try {
        const response = await api.post('/auth/login', formData);
        
        if (response.data && response.data.status === 'success') {
          this.token = response.data.access_token;
          
          // ELIMINAMOS LA DECODIFICACIÓN JWT: 
          // El backend ya nos manda el usuario listo y seguro en response.data.user
          this.user = response.data.user; 

          localStorage.setItem('token', this.token);
          localStorage.setItem('user', JSON.stringify(this.user));
          
          return true;
        } else {
          throw response.data.message || 'Credenciales incorrectas';
        }
      } catch (error) {
        // Atrapamos el error exacto que manda FastAPI (ej. "Contraseña incorrecta")
        const errorMsg = error.response?.data?.detail || error.response?.data?.message || error || 'Error de conexión con el Comando Central';
        throw errorMsg;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = "/"; // Expulsa al login de inmediato
    }
  }
});