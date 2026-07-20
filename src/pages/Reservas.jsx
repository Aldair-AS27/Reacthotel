import { useEffect, useState } from 'react';
import { 
    getReservas, createReserva, updateReserva, deleteReserva, 
    getClientes, 
    getHabitaciones, updateHabitacion 
    } from '../api/services';
    import toast from 'react-hot-toast';

    export default function Reservas() {
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    
    const [mostrarModal, setMostrarModal] = useState(false);
    const [reservaEditando, setReservaEditando] = useState(null);

    const [nuevaReserva, setNuevaReserva] = useState({
        cliente_id: '', habitacion_id: '', fecha_entrada: '', fecha_salida: '', observaciones: ''
    });

    useEffect(() => { cargarDatosYSincronizar(); }, []);

    // --------------------------------------------------------
    // 1. CARGA Y SINCRONIZACIÓN AUTOMÁTICA DE ESTADOS
    // --------------------------------------------------------
    const cargarDatosYSincronizar = async () => {
        try {
        const [resReservas, resClientes, resHabitaciones] = await Promise.all([
            getReservas(), getClientes(), getHabitaciones()
        ]);
        
        let reservasData = resReservas.data;
        let habitacionesData = resHabitaciones.data;
        let hubieronCambios = false;

        const hoy = new Date().toISOString().split('T')[0]; // Ej: "2026-07-19"

        // Recorremos reservas para aplicar inteligencia de negocio
        for (const res of reservasData) {
            if (res.estado === 'CANCELADA' || res.estado === 'COMPLETADA') continue;

            const enRango = hoy >= res.fecha_entrada && hoy <= res.fecha_salida;
            let estadoActualizado = res.estado;

            // Si la reserva empieza hoy o ya empezó, se autoconfirma
            if (enRango && res.estado === 'PENDIENTE') {
            await updateReserva(res.id, { estado: 'CONFIRMADA' });
            estadoActualizado = 'CONFIRMADA';
            hubieronCambios = true;
            }

            // Si la reserva está confirmada, la habitación DEBE estar OCUPADA
            if (estadoActualizado === 'CONFIRMADA') {
            const hab = habitacionesData.find(h => h.id === res.habitacion_id);
            if (hab && hab.estado !== 'OCUPADA') {
                await updateHabitacion(hab.id, { estado: 'OCUPADA' });
                hubieronCambios = true;
            }
            }
        }

        // Si el motor inteligente hizo cambios, recargamos la info fresca del backend
        if (hubieronCambios) {
            const [refreshRes, refreshHab] = await Promise.all([getReservas(), getHabitaciones()]);
            reservasData = refreshRes.data;
            habitacionesData = refreshHab.data;
            toast.success("El sistema ha actualizado automáticamente el estado de las habitaciones ocupadas hoy.");
        }

        setReservas(reservasData);
        setClientes(resClientes.data);
        setHabitaciones(habitacionesData);
        } catch (error) {
        toast.error("Error al cargar los datos del sistema");
        }
    };

    // --------------------------------------------------------
    // 2. VALIDACIONES DE NEGOCIO (Doble reserva y fechas)
    // --------------------------------------------------------
    const validarReserva = (habId, fEntrada, fSalida, idActual = null) => {
        const inicio = new Date(fEntrada);
        const fin = new Date(fSalida);

        if (fin <= inicio) {
        toast.error("Error: La fecha de salida no puede ser anterior o igual a la de entrada.");
        return false;
        }

        const solapada = reservas.find(r => {
        if (r.id === idActual) return false; // Ignorarse a sí misma al editar
        if (r.estado === 'CANCELADA' || r.estado === 'COMPLETADA') return false;
        if (r.habitacion_id !== parseInt(habId)) return false;

        const rInicio = new Date(r.fecha_entrada);
        const rFin = new Date(r.fecha_salida);
        
        // Lógica de solapamiento de fechas
        return (inicio < rFin && fin > rInicio);
        });

        if (solapada) {
        toast.error(`Imposible: La habitación ya está reservada en esas fechas (Ref #${solapada.id}).`);
        return false;
        }
        return true;
    };

    const handleInputChange = (e) => setNuevaReserva({ ...nuevaReserva, [e.target.name]: e.target.value });
    const handleEditInputChange = (e) => setReservaEditando({ ...reservaEditando, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarReserva(nuevaReserva.habitacion_id, nuevaReserva.fecha_entrada, nuevaReserva.fecha_salida)) return;

        try {
        const dataAEnviar = { 
            ...nuevaReserva, 
            cliente_id: parseInt(nuevaReserva.cliente_id), 
            habitacion_id: parseInt(nuevaReserva.habitacion_id) 
        };
        await createReserva(dataAEnviar);
        toast.success("Reserva programada exitosamente");
        setNuevaReserva({ cliente_id: '', habitacion_id: '', fecha_entrada: '', fecha_salida: '', observaciones: '' });
        setMostrarForm(false);
        cargarDatosYSincronizar(); // Carga y procesa automatizaciones si aplica para hoy
        } catch (error) { toast.error("Error al crear la reserva en el servidor."); }
    };

    const abrirEditar = (reserva) => { setReservaEditando({ ...reserva }); setMostrarModal(true); };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!validarReserva(reservaEditando.habitacion_id, reservaEditando.fecha_entrada, reservaEditando.fecha_salida, reservaEditando.id)) return;

        try {
        const dataAEnviar = {
            habitacion_id: parseInt(reservaEditando.habitacion_id), fecha_entrada: reservaEditando.fecha_entrada,
            fecha_salida: reservaEditando.fecha_salida, observaciones: reservaEditando.observaciones, estado: reservaEditando.estado
        };
        await updateReserva(reservaEditando.id, dataAEnviar);
        
        // Si se cancela, aseguramos de liberar la habitación
        if (reservaEditando.estado === 'CANCELADA') {
            await updateHabitacion(reservaEditando.habitacion_id, { estado: 'LIBRE' });
        }

        toast.success("Reserva actualizada correctamente");
        setMostrarModal(false);
        setReservaEditando(null);
        cargarDatosYSincronizar();
        } catch (error) { toast.error("Error al actualizar la reserva."); }
    };

    const handleDelete = async (id) => {
        if (window.confirm(`⚠️ ¿Estás seguro de eliminar la reserva #${id}? Esta acción destruirá el registro.`)) {
        try {
            const res = reservas.find(r => r.id === id);
            await deleteReserva(id);
            // Si borramos la reserva, liberamos la habitación por si estaba ocupada
            if (res) await updateHabitacion(res.habitacion_id, { estado: 'LIBRE' });
            
            toast.success(`Reserva eliminada correctamente`);
            cargarDatosYSincronizar();
        } catch (error) { toast.error("Error al eliminar la reserva"); }
        }
    };

    const obtenerNombreCliente = (id) => { const c = clientes.find(c => c.id === id); return c ? `${c.nombre} ${c.apellido}` : 'Desconocido'; };
    const obtenerNumeroHabitacion = (id) => { const h = habitaciones.find(h => h.id === id); return h ? `Hab. ${h.numero}` : 'N/A'; };

    return (
        <div className="p-8 max-w-7xl mx-auto">
        <div className="sticky top-0 bg-white/40 backdrop-blur-xl z-10 pb-6 mb-6 border-b border-white/50 pt-4 px-4 rounded-b-2xl shadow-sm flex justify-between items-end">
            <div>
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight drop-shadow-sm">Agenda de Reservas</h1>
            <p className="text-sm text-stone-700 mt-1 font-bold">Inteligencia automática de asignación y cruces</p>
            </div>
            <button 
            onClick={() => setMostrarForm(!mostrarForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg border border-white/40 backdrop-blur-md ${
                mostrarForm ? 'bg-white/60 text-stone-800 hover:bg-white/80' : 'bg-amber-700/90 text-white hover:bg-amber-800 hover:-translate-y-0.5'
            }`}
            >
            {mostrarForm ? "✕ Cancelar" : "＋ Programar Reserva"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all">
            <div className="col-span-full border-b border-stone-300/50 pb-3 mb-2">
                <h2 className="text-xl font-bold text-stone-900 drop-shadow-sm">📝 Nueva Programación</h2>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Huésped Titular *</label>
                <select required name="cliente_id" value={nuevaReserva.cliente_id} onChange={handleInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-medium shadow-inner">
                <option value="" disabled>Buscar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} (DNI: {c.dni})</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Asignación de Habitación *</label>
                <select required name="habitacion_id" value={nuevaReserva.habitacion_id} onChange={handleInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-medium shadow-inner">
                <option value="" disabled>Seleccionar habitación disponible...</option>
                {habitaciones.map(h => <option key={h.id} value={h.id}>Hab. {h.numero} — Estado Actual: {h.estado}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Check-in (Entrada) *</label>
                <input required type="date" name="fecha_entrada" value={nuevaReserva.fecha_entrada} onChange={handleInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-medium shadow-inner" />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Check-out (Salida) *</label>
                <input required type="date" name="fecha_salida" value={nuevaReserva.fecha_salida} onChange={handleInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-medium shadow-inner" />
            </div>

            <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Requerimientos Especiales</label>
                <textarea name="observaciones" value={nuevaReserva.observaciones} onChange={handleInputChange} rows="2" placeholder="Cuna extra, alergias, late check-out..." className="p-3.5 border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-medium shadow-inner"></textarea>
            </div>

            <div className="col-span-full flex justify-end mt-4">
                <button type="submit" className="bg-amber-700/90 backdrop-blur-md text-white px-10 py-3.5 rounded-xl font-bold shadow-xl border border-amber-600/50 hover:bg-amber-800 hover:shadow-2xl transition-all active:scale-95">
                Confirmar Bloqueo
                </button>
            </div>
            </form>
        )}

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-white/40 border-b border-white/50">
                    <th className="p-5 text-xs font-extrabold text-stone-700 uppercase tracking-widest drop-shadow-sm">Ref</th>
                    <th className="p-5 text-xs font-extrabold text-stone-700 uppercase tracking-widest drop-shadow-sm">Huésped Titular</th>
                    <th className="p-5 text-xs font-extrabold text-stone-700 uppercase tracking-widest drop-shadow-sm">Asignación</th>
                    <th className="p-5 text-xs font-extrabold text-stone-700 uppercase tracking-widest drop-shadow-sm">Periodo</th>
                    <th className="p-5 text-xs font-extrabold text-stone-700 uppercase tracking-widest drop-shadow-sm">Estado</th>
                    <th className="p-5 text-xs font-extrabold text-stone-700 uppercase tracking-widest drop-shadow-sm text-right">Acciones</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                {reservas.map(r => (
                    <tr key={r.id} className="hover:bg-white/50 transition-colors group">
                    <td className="p-5 font-mono text-sm font-bold text-stone-500">#{r.id}</td>
                    <td className="p-5 font-bold text-stone-900 text-lg drop-shadow-sm">{obtenerNombreCliente(r.cliente_id)}</td>
                    <td className="p-5 text-stone-800 font-bold bg-white/40 rounded-lg m-2 shadow-inner">{obtenerNumeroHabitacion(r.habitacion_id)}</td>
                    <td className="p-5">
                        <div className="text-sm bg-white/40 p-2 rounded-xl shadow-inner font-bold border border-white/50">
                        <p className="text-emerald-700 tracking-tight">IN: {r.fecha_entrada}</p>
                        <p className="text-red-700 tracking-tight">OUT: {r.fecha_salida}</p>
                        </div>
                    </td>
                    <td className="p-5">
                        <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-widest border backdrop-blur-md shadow-sm ${
                        r.estado === 'CONFIRMADA' ? 'bg-emerald-100/60 text-emerald-800 border-emerald-300/50' :
                        r.estado === 'PENDIENTE' ? 'bg-amber-100/60 text-amber-800 border-amber-300/50' :
                        r.estado === 'CANCELADA' ? 'bg-red-100/60 text-red-800 border-red-300/50' : 'bg-white/60 text-stone-800 border-white/80'
                        }`}>
                        {r.estado}
                        </span>
                    </td>
                    <td className="p-5 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => abrirEditar(r)} className="p-2.5 bg-white/60 text-amber-700 hover:bg-amber-100/80 rounded-xl transition-colors shadow-sm border border-white/50" title="Editar">✏️</button>
                        <button onClick={() => handleDelete(r.id)} className="p-2.5 bg-white/60 text-red-600 hover:bg-red-100/80 rounded-xl transition-colors shadow-sm border border-white/50" title="Eliminar">🗑️</button>
                        </div>
                    </td>
                    </tr>
                ))}
                {reservas.length === 0 && <tr><td colSpan="6" className="p-16 text-center text-stone-700 font-bold text-lg drop-shadow-sm">El calendario está libre. No hay reservas registradas.</td></tr>}
                </tbody>
            </table>
            </div>
        </div>

        {/* Modal de Edición */}
        {mostrarModal && reservaEditando && (
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/60 animate-in zoom-in-95 duration-200">
                <h2 className="text-3xl font-extrabold mb-1 text-stone-900 drop-shadow-sm">Modificar Reserva</h2>
                <p className="text-sm text-stone-600 mb-6 pb-4 border-b border-white/50 font-medium">
                Titular: <span className="font-bold text-amber-700">{obtenerNombreCliente(reservaEditando.cliente_id)}</span> (Ref #{reservaEditando.id})
                </p>

                <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Reasignar Habitación</label>
                    <select required name="habitacion_id" value={reservaEditando.habitacion_id} onChange={handleEditInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/60 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-bold shadow-inner">
                    {habitaciones.map(h => <option key={h.id} value={h.id}>Hab. {h.numero} ({h.estado})</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Entrada</label>
                    <input required type="date" name="fecha_entrada" value={reservaEditando.fecha_entrada} onChange={handleEditInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/60 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-bold shadow-inner" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Salida</label>
                    <input required type="date" name="fecha_salida" value={reservaEditando.fecha_salida} onChange={handleEditInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/60 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-bold shadow-inner" />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Estatus Oficial</label>
                    <select required name="estado" value={reservaEditando.estado} onChange={handleEditInputChange} className="p-3.5 border border-white/60 rounded-xl bg-white/60 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-bold shadow-inner">
                    <option value="PENDIENTE">PENDIENTE (Aprobación requerida)</option>
                    <option value="CONFIRMADA">CONFIRMADA (Bloqueo efectivo)</option>
                    <option value="CANCELADA">CANCELADA (Liberar cupo)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Notas Registradas</label>
                    <textarea name="observaciones" value={reservaEditando.observaciones || ''} onChange={handleEditInputChange} rows="2" className="p-3.5 border border-white/60 rounded-xl bg-white/60 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-bold shadow-inner"></textarea>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/50">
                    <button type="button" onClick={() => { setMostrarModal(false); setReservaEditando(null); }} className="px-6 py-3 rounded-xl font-bold text-stone-700 bg-white/60 hover:bg-white/80 border border-white/60 shadow-sm transition-all">
                    Cancelar
                    </button>
                    <button type="submit" className="bg-amber-700/90 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-amber-900/20 border border-amber-600/50 hover:bg-amber-800 transition-all active:scale-95">
                    Aplicar Cambios
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </div>
    );
}