import { useEffect, useState } from 'react';
import { getFacturas, createFactura, updateFactura, getReservas } from '../api/services';
import toast from 'react-hot-toast';

export default function Facturas() {
    const [facturas, setFacturas] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nuevaFactura, setNuevaFactura] = useState({ reserva_id: '', notas: '' });

    // Estado para el modal de confirmación
    const [modalConfig, setModalConfig] = useState({ isOpen: false, facturaId: null, accion: '', tipo: '' });

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
            try {
                const [resFact, resReservas] = await Promise.all([getFacturas(), getReservas()]);

                // 1. Guardamos todas las facturas
                setFacturas(resFact.data);

                // 2. Creamos un Set con los IDs de las reservas que ya están facturadas
                // Filtramos para evitar nulos y nos quedamos solo con las que NO estén ANULADAS
                // (Si una factura fue anulada, la reserva debería quedar libre de nuevo)
                const idsReservasFacturadas = new Set(
                    resFact.data
                        .filter(f => f.estado !== 'ANULADA')
                        .map(f => f.reserva_id)
                );

                // 3. Filtramos las reservas del backend dejando solo las libres
                const reservasLibres = resReservas.data.filter(r => !idsReservasFacturadas.has(r.id));

                setReservas(reservasLibres);
            } catch (error) {
                toast.error("Error al cargar facturas");
            }
        };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar que realmente se haya seleccionado una reserva antes de parsear
        const idReservaParseado = parseInt(nuevaFactura.reserva_id, 10);

        if (isNaN(idReservaParseado)) {
            toast.error("Por favor, seleccione una reserva válida");
            return;
        }

        // Estructura limpia para enviar al backend
        const payload = {
            reserva_id: idReservaParseado,
            // Si tu backend en Python espera 'notes' en vez de 'notas', cámbialo aquí abajo:
            notas: nuevaFactura.notas.trim() || null
        };

        try {
            await createFactura(payload);
            toast.success("Factura generada");
            setNuevaFactura({ reserva_id: '', notas: '' });
            setMostrarForm(false);
            cargarDatos();
        } catch (error) {
            toast.error("Error al generar factura");
            console.error("Detalle del error 400:", error.response?.data || error);
        }
    };

    // Abre el modal configurando la acción correspondiente
    const abrirConfirmacion = (id, accion) => {
        setModalConfig({
            isOpen: true,
            facturaId: id,
            accion: accion,
            tipo: accion === 'PAGADA' ? 'pago' : 'anulacion'
        });
    };

    const ejecutarAccionConfirmada = async () => {
        const { facturaId, accion } = modalConfig;
        try {
            await updateFactura(facturaId, { estado: accion });
            toast.success(`Factura marcada como ${accion.toLowerCase()}`);
            setModalConfig({ isOpen: false, facturaId: null, accion: '', tipo: '' });
            cargarDatos();
        } catch (error) {
            toast.error(`Error al cambiar el estado a ${accion}`);
            console.error(error);
        }
    };

    const obtenerEstilosEstado = (estado) => {
        switch (estado) {
            case 'PAGADA':
                return { border: 'border-l-4 border-emerald-500 bg-emerald-50/10', badge: 'bg-emerald-100 text-emerald-800' };
            case 'ANULADA':
                return { border: 'border-l-4 border-rose-500 bg-gray-50/60 opacity-70', badge: 'bg-rose-100 text-rose-800' };
            case 'PENDIENTE':
            default:
                return { border: 'border-l-4 border-amber-500 bg-amber-50/10', badge: 'bg-amber-100 text-amber-800' };
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50/30 antialiased">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 backdrop-blur-sm sticky top-0 bg-white/80 py-4 z-10 border-b border-gray-100/80 px-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Facturación</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestiona los comprobantes y estados de pago</p>
                </div>
                <button
                    onClick={() => setMostrarForm(!mostrarForm)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm flex items-center gap-2 ${
                        mostrarForm
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                    }`}
                >
                    {mostrarForm ? "Cancelar" : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Generar Factura
                        </>
                    )}
                </button>
            </div>

            {/* Formulario */}
            {mostrarForm && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 mb-8 grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-top-4 duration-200">
                    <h3 className="font-bold text-gray-800 text-base border-b border-gray-50 pb-2">Nueva Factura</h3>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Reserva Asociada *</label>
                        <select required className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={nuevaFactura.reserva_id} onChange={e => setNuevaFactura({...nuevaFactura, reserva_id: e.target.value})}>
                            <option value="" disabled>Seleccione una Reserva...</option>
                            {reservas.map(r => (
                                <option key={r.id} value={r.id}>Reserva #{r.id} — Habitación ID: {r.habitacion_id}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Notas adicionales</label>
                        {/* Corregido de nuevaFactura.notes a nuevaFactura.notas */}
                        <input placeholder="Ej. Pago con tarjeta, requiere datos corporativos..." className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={nuevaFactura.notas} onChange={e => setNuevaFactura({...nuevaFactura, notas: e.target.value})} />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-100 transition-all transform active:scale-95">
                            Emitir Comprobante
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de Facturas */}
            <div className="grid grid-cols-1 gap-4">
                {facturas.map(f => {
                    const estilos = obtenerEstilosEstado(f.estado);
                    return (
                        <div key={f.id} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 ${estilos.border} flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all duration-200 hover:shadow-md hover:border-gray-200/60`}>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <p className="font-extrabold text-gray-900 text-lg tracking-tight">Factura #{f.id}</p>
                                    <span className="text-xs font-semibold text-gray-500 font-mono bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200/40">
                                        ID Reserva: {f.reserva_id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 max-w-md">{f.notas || 'Sin comentarios o notas internas.'}</p>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                                <div className="text-left md:text-right">
                                    <p className="font-black text-2xl text-gray-900 tracking-tight">${f.total}</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1.5 tracking-wider ${estilos.badge}`}>
                                        {f.estado}
                                    </span>
                                </div>

                                {f.estado === 'PENDIENTE' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => abrirConfirmacion(f.id, 'PAGADA')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                        >
                                            <span>💵</span> Pagar
                                        </button>
                                        <button
                                            onClick={() => abrirConfirmacion(f.id, 'ANULADA')}
                                            className="bg-transparent hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                                        >
                                            <span>🚫</span> Anular
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {facturas.length === 0 && (
                    <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200 max-w-md mx-auto mt-8">
                        <p className="text-base font-medium text-gray-500 mb-1">Historial limpio</p>
                        <p className="text-xs">No hay registros de facturas emitidas por el momento.</p>
                    </div>
                )}
            </div>

            {/* Modal de Confirmación Estilizado */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className={`p-3 rounded-full ${modalConfig.tipo === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {modalConfig.tipo === 'pago' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalConfig.tipo === 'pago' ? 'Confirmar Pago' : '¿Anular Factura?'}
                            </h3>
                        </div>

                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            {modalConfig.tipo === 'pago'
                                ? `¿Estás seguro de marcar la factura #${modalConfig.facturaId} como PAGADA? Esta acción actualizará los reportes financieros.`
                                : `¿De verdad deseas ANULAR la factura #${modalConfig.facturaId}? Esta operación restará el total del balance global.`}
                        </p>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setModalConfig({ isOpen: false, facturaId: null, accion: '', tipo: '' })}
                                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarAccionConfirmada}
                                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all ${
                                    modalConfig.tipo === 'pago'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                                }`}
                            >
                                {modalConfig.tipo === 'pago' ? 'Sí, procesar pago' : 'Sí, anular factura'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
