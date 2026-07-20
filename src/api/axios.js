import axios from 'axios';

// Solo el dominio raíz, sin /docs ni fragmentos
const BASE_URL = 'https://hotel-s031.onrender.com'; 

const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor: se ejecuta ANTES de enviar cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;