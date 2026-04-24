import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || 'invitado',
  },

  actions: {
    async login(username, password) {
      // FastAPI espera un FormData para el OAuth2 Password Flow
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      try {
        const response = await api.post('/auth/login', formData);
        
        // 1. Guardar el token
        this.token = response.data.access_token;
        
        // 2. Decodificar el Payload del JWT de forma segura
        try {
          const base64Url = this.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          this.user = { 
            username: payload.sub, 
            role: payload.role || 'user' 
          };
        } catch (e) {
          console.error("Error decodificando token:", e);
          this.user = { username: username, role: 'user' };
        }

        // 3. Persistencia
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));

        return true;
      } catch (error) {
        // Capturamos el detalle del error que envía FastAPI
        const errorMsg = error.response?.data?.detail || 'Error de autenticación';
        throw errorMsg;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Al usar el servicio 'api', el interceptor dejará de enviar el token automáticamente
    }
  }
});