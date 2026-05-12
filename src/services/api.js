import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Asegúrate de que este sea tu puerto de FastAPI
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para cerrar sesión si el token expira o el usuario es inhabilitado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;