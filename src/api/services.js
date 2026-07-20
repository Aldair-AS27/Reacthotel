import api from './axios';

// --- USUARIOS ---
export const getUsuarios = () => api.get('/usuarios/');
export const createUsuario = (data) => api.post('/usuarios/', data);
export const updateUsuario = (id, data) => api.put(`/usuarios/${id}`, data);
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);

// --- CLIENTES ---
export const getClientes = () => api.get('/clientes/');
export const createCliente = (data) => api.post('/clientes/', data);
export const updateCliente = (id, data) => api.put(`/clientes/${id}`, data);
export const deleteCliente = (id) => api.delete(`/clientes/${id}`);

// --- TIPOS DE HABITACIÓN ---
export const getTiposHabitacion = () => api.get('/tipos-habitacion/');
export const createTipoHabitacion = (data) => api.post('/tipos-habitacion/', data);
export const updateTipoHabitacion = (id, data) => api.put(`/tipos-habitacion/${id}`, data);
export const deleteTipoHabitacion = (id) => api.delete(`/tipos-habitacion/${id}`);

// --- HABITACIONES ---
export const getHabitaciones = () => api.get('/habitaciones/');
export const createHabitacion = (data) => api.post('/habitaciones/', data);
export const updateHabitacion = (id, data) => api.put(`/habitaciones/${id}`, data);
export const deleteHabitacion = (id) => api.delete(`/habitaciones/${id}`);

// --- RESERVAS ---
export const getReservas = () => api.get('/reservas/');
export const createReserva = (data) => api.post('/reservas/', data);
export const updateReserva = (id, data) => api.put(`/reservas/${id}`, data);
export const deleteReserva = (id) => api.delete(`/reservas/${id}`);

// --- FACTURAS ---
export const getFacturas = () => api.get('/facturas/');
export const createFactura = (data) => api.post('/facturas/', data);
export const updateFactura = (id, data) => api.put(`/facturas/${id}`, data);
export const deleteFactura = (id) => api.delete(`/facturas/${id}`);

// --- MANTENIMIENTOS ---
export const getMantenimientos = () => api.get('/mantenimientos/');
export const createMantenimiento = (data) => api.post('/mantenimientos/', data);
export const updateMantenimiento = (id, data) => api.put(`/mantenimientos/${id}`, data);
export const deleteMantenimiento = (id) => api.delete(`/mantenimientos/${id}`);