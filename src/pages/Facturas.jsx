import { useEffect, useState } from 'react';
import { 
    getFacturas, createFactura, updateFactura, deleteFactura, 
    getReservas, updateReserva, 
    getHabitaciones, updateHabitacion, 
    getClientes 
    } from '../api/services';
    import toast from 'react-hot-toast';

    export default function Facturas() {
    const [facturas, setFacturas] = useState([]);
    
    // Necesitamos TODAS las reservas para mapear datos históricos
    const [todasLasReservas, setTodasLasReservas] = useState([]); 
    // Reservas aptas para facturar (solo confirmadas)
    const [reservasAptas, setReservasAptas] = useState([]);
    
    const [habitaciones, setHabitaciones] = useState([]);
    const [clientes, setClientes] = useState([]);
    
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nuevaFactura, setNuevaFactura] = useState({ reserva_id: '', notas: '' });
    const [modalConfig, setModalConfig] = useState({ isOpen: false, facturaId: null, accion: '', tipo: '' });

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
        // Cargamos todas las entidades necesarias
        const [resFact, resReservas, resHab, resCli] = await Promise.all([
            getFacturas(), getReservas(), getHabitaciones(), getClientes()
        ]);
        
        setFacturas(resFact.data);
        setTodasLasReservas(resReservas.data);
        setHabitaciones(resHab.data);
        setClientes(resCli.data);

        // REGLA 1: Solo reservas que NO tengan factura activa
        const idsReservasFacturadas = new Set(
            resFact.data.filter(f => f.estado !== 'ANULADA').map(f => f.reserva_id)
        );

        // REGLA 2: La reserva DEBE estar CONFIRMADA
        const libresParaFacturar = resReservas.data.filter(r => 
            !idsReservasFacturadas.has(r.id) && r.estado === 'CONFIRMADA'
        );

        setReservasAptas(libresParaFacturar);
        } catch (error) { toast.error("Error al cargar los datos de facturación"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const idReservaParseado = parseInt(nuevaFactura.reserva_id, 10);
        if (isNaN(idReservaParseado)) return toast.error("Seleccione una reserva válida");

        try {
        await createFactura({ reserva_id: idReservaParseado, notas: nuevaFactura.notas.trim() || null });
        toast.success("Factura generada exitosamente");
        setNuevaFactura({ reserva_id: '', notas: '' });
        setMostrarForm(false);
        cargarDatos();
        } catch (error) { toast.error("Error al emitir la factura"); }
    };

    // REGLA 3: Borrado de emergencia
    const handleDeleteFactura = async (id) => {
        if (window.confirm("⚠️ CASO DE EMERGENCIA: ¿Estás seguro de eliminar esta factura del registro permanentemente?")) {
        try {
            await deleteFactura(id);
            toast.success("Factura eliminada del sistema");
            cargarDatos();
        } catch (error) { toast.error("Error al eliminar la factura"); }
        }
    };

    const abrirConfirmacion = (id, accion) => setModalConfig({ isOpen: true, facturaId: id, accion, tipo: accion === 'PAGADA' ? 'pago' : 'anulacion' });

    // REGLA 4: Automatización de estados cruzados (Factura -> Reserva -> Habitación)
    const ejecutarAccionConfirmada = async () => {
        try {
        const { facturaId, accion } = modalConfig;
        
        // 1. Actualizamos la Factura
        await updateFactura(facturaId, { estado: accion });
        
        // Buscamos la reserva ligada a esta factura
        const factura = facturas.find(f => f.id === facturaId);
        const reserva = todasLasReservas.find(r => r.id === factura?.reserva_id);

        if (reserva) {
            // 2. Actualizamos la Reserva (PAGADA -> COMPLETADA, ANULADA -> CANCELADA)
            const nuevoEstadoReserva = accion === 'PAGADA' ? 'COMPLETADA' : 'CANCELADA';
            await updateReserva(reserva.id, { estado: nuevoEstadoReserva });
            
            // 3. Liberamos la Habitación
            await updateHabitacion(reserva.habitacion_id, { estado: 'LIBRE' });
        }

        toast.success(`Factura procesada. Habitación liberada automáticamente.`);
        setModalConfig({ isOpen: false, facturaId: null, accion: '', tipo: '' });
        cargarDatos();
        } catch (error) { 
        toast.error(`Error durante el proceso de automatización.`); 
        }
    };

    // Helper para pintar los datos combinados en las tarjetas
    const obtenerDetallesReserva = (reserva_id) => {
        const reserva = todasLasReservas.find(r => r.id === reserva_id);
        if (!reserva) return null;
        const cliente = clientes.find(c => c.id === reserva.cliente_id);
        const hab = habitaciones.find(h => h.id === reserva.habitacion_id);
        return { cliente, hab };
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
        {/* Header Premium */}
        <div className="sticky top-0 bg-white/40 backdrop-blur-xl z-10 pb-6 mb-6 border-b border-white/50 pt-4 px-4 rounded-b-2xl shadow-sm flex justify-between items-end">
            <div>
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight drop-shadow-sm">Facturación y Pagos</h1>
            <p className="text-sm text-stone-700 mt-1 font-bold">Gestiona los comprobantes y el cierre de reservas</p>
            </div>
            <button 
            onClick={() => setMostrarForm(!mostrarForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg border border-white/40 backdrop-blur-md ${
                mostrarForm ? 'bg-white/60 text-stone-800 hover:bg-white/80' : 'bg-amber-700/90 text-white hover:bg-amber-800 hover:-translate-y-0.5'
            }`}
            >
            {mostrarForm ? "✕ Cancelar" : "＋ Emitir Factura"}
            </button>
        </div>

        {/* Formulario de Emisión */}
        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60 mb-8 grid grid-cols-1 gap-6 transition-all">
            <div className="border-b border-stone-300/50 pb-3 mb-2">
                <h2 className="text-xl font-bold text-stone-900 drop-shadow-sm">📝 Emitir Nuevo Comprobante</h2>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Reservas Confirmadas Aptas *</label>
                <select required className="p-3.5 border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-bold shadow-inner"
                value={nuevaFactura.reserva_id} onChange={e => setNuevaFactura({...nuevaFactura, reserva_id: e.target.value})}>
                <option value="" disabled>Seleccione una Reserva activa...</option>
                {reservasAptas.map(r => {
                    const det = obtenerDetallesReserva(r.id);
                    return (
                    <option key={r.id} value={r.id}>
                        Reserva #{r.id} — Huésped: {det?.cliente?.nombre} {det?.cliente?.apellido} — Hab. {det?.hab?.numero}
                    </option>
                    )
                })}
                </select>
                {reservasAptas.length === 0 && <span className="text-xs text-red-700 font-bold mt-1">No hay reservas en estado CONFIRMADA listas para facturar.</span>}
            </div>
            
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider drop-shadow-sm">Notas de facturación (Opcional)</label>
                <input placeholder="Ej. Pago con tarjeta corporativa, requiere desglose..." className="p-3.5 border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm outline-none focus:bg-white/80 focus:ring-4 focus:ring-amber-700/20 focus:border-amber-700/50 transition-all text-stone-900 font-bold shadow-inner"
                value={nuevaFactura.notas} onChange={e => setNuevaFactura({...nuevaFactura, notas: e.target.value})} />
            </div>
            
            <div className="flex justify-end mt-4">
                <button type="submit" className="bg-amber-700/90 backdrop-blur-md text-white px-10 py-3.5 rounded-xl font-bold shadow-xl border border-amber-600/50 hover:bg-amber-800 hover:shadow-2xl transition-all active:scale-95">
                Generar Factura
                </button>
            </div>
            </form>
        )}

        {/* Lista de Facturas */}
        <div className="grid grid-cols-1 gap-6">
            {facturas.map(f => {
            const detalles = obtenerDetallesReserva(f.reserva_id);
            const st = {
                'PAGADA': 'border-emerald-500/80 bg-white/70 shadow-lg border-l-8',
                'ANULADA': 'border-red-500/80 bg-white/40 opacity-80 border-l-8',
                'PENDIENTE': 'border-amber-500/90 bg-white/80 shadow-2xl border-l-8'
            }[f.estado];

            const badge = {
                'PAGADA': 'bg-emerald-100/60 text-emerald-800 border-emerald-300',
                'ANULADA': 'bg-red-100/60 text-red-800 border-red-300',
                'PENDIENTE': 'bg-amber-100/80 text-amber-900 border-amber-400 shadow-sm animate-pulse'
            }[f.estado];

            return (
                <div key={f.id} className={`backdrop-blur-xl p-8 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-all border border-white/60 ${st}`}>
                <div className="space-y-4 flex-1 w-full">
                    <div className="flex items-center gap-4">
                    <p className="font-extrabold text-stone-900 text-3xl tracking-tight drop-shadow-sm">Factura #{f.id}</p>
                    <span className={`inline-block px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border backdrop-blur-md ${badge}`}>
                        {f.estado}
                    </span>
                    </div>
                    
                    {/* Datos Cruzados (Cliente y Habitación) */}
                    {detalles && (
                    <div className="flex flex-wrap gap-4 bg-white/40 p-4 rounded-xl border border-white/50 shadow-inner">
                        <p className="text-sm font-bold text-stone-800">
                        <span className="text-stone-500 font-medium block text-xs uppercase">Titular</span> 
                        {detalles.cliente?.nombre} {detalles.cliente?.apellido}
                        </p>
                        <p className="text-sm font-bold text-stone-800 border-l border-white/60 pl-4">
                        <span className="text-stone-500 font-medium block text-xs uppercase">Habitación</span> 
                        {detalles.hab ? `Nº ${detalles.hab.numero}` : 'N/A'}
                        </p>
                        <p className="text-sm font-bold text-stone-800 border-l border-white/60 pl-4">
                        <span className="text-stone-500 font-medium block text-xs uppercase">Reserva</span> 
                        #{f.reserva_id}
                        </p>
                    </div>
                    )}
                    
                    {f.notas && <p className="text-sm text-stone-700 font-medium italic">" {f.notas} "</p>}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 w-full lg:w-auto justify-between lg:justify-end border-t border-white/50 lg:border-t-0 pt-6 lg:pt-0">
                    <div className="text-center lg:text-right">
                    <span className="text-stone-500 font-medium block text-xs uppercase tracking-wider mb-1">Monto a pagar</span> 
                    <p className="font-black text-5xl text-stone-900 tracking-tight drop-shadow-sm">${f.total}</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {f.estado === 'PENDIENTE' && (
                        <>
                        <button onClick={() => abrirConfirmacion(f.id, 'PAGADA')} className="w-full sm:w-auto bg-emerald-600/90 backdrop-blur-md hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg border border-emerald-500 transition-all active:scale-95">
                            💵 Registrar Pago
                        </button>
                        <button onClick={() => abrirConfirmacion(f.id, 'ANULADA')} className="w-full sm:w-auto bg-white/60 hover:bg-red-50/80 text-red-700 border border-white/80 px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95">
                            🚫 Anular Factura
                        </button>
                        </>
                    )}
                    {/* Botón de borrado de emergencia siempre disponible */}
                    <button onClick={() => handleDeleteFactura(f.id)} className="w-full sm:w-auto mt-2 text-xs font-bold text-stone-400 hover:text-red-600 transition-colors underline">
                        Eliminar del registro
                    </button>
                    </div>
                </div>
                </div>
            );
            })}
            {facturas.length === 0 && <div className="p-16 text-center text-stone-700 font-bold bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 text-lg drop-shadow-sm">No hay registros de facturas emitidas.</div>}
        </div>

        {/* Modal de Confirmación */}
        {modalConfig.isOpen && (
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/60 animate-in zoom-in-95 duration-200">
                <h3 className={`text-2xl font-extrabold mb-4 drop-shadow-sm ${modalConfig.tipo === 'pago' ? 'text-emerald-800' : 'text-red-800'}`}>
                {modalConfig.tipo === 'pago' ? '💸 Procesar Pago' : '⚠️ Anular Comprobante'}
                </h3>
                
                <div className="text-stone-700 font-medium leading-relaxed mb-8 bg-white/50 p-4 rounded-xl border border-white/60 shadow-inner">
                {modalConfig.tipo === 'pago' ? (
                    <p>¿Marcar la factura #{modalConfig.facturaId} como <b>PAGADA</b>? <br/><br/><span className="text-emerald-600 text-sm">✓ La reserva pasará a COMPLETADA.<br/>✓ La habitación quedará LIBRE automáticamente.</span></p>
                ) : (
                    <p>¿De verdad deseas <b>ANULAR</b> la factura #{modalConfig.facturaId}? <br/><br/><span className="text-red-600 text-sm">✓ La reserva pasará a CANCELADA.<br/>✓ La habitación quedará LIBRE automáticamente.</span></p>
                )}
                </div>

                <div className="flex justify-end gap-3">
                <button onClick={() => setModalConfig({ isOpen: false, facturaId: null, accion: '', tipo: '' })} className="px-6 py-3 font-bold text-stone-700 bg-white/60 border border-white/60 hover:bg-white/80 rounded-xl transition-all shadow-sm">
                    Volver
                </button>
                <button onClick={ejecutarAccionConfirmada} className={`px-6 py-3 font-bold text-white rounded-xl shadow-lg border backdrop-blur-md transition-all active:scale-95 ${modalConfig.tipo === 'pago' ? 'bg-emerald-600/90 border-emerald-500 hover:bg-emerald-700' : 'bg-red-600/90 border-red-500 hover:bg-red-700'}`}>
                    Confirmar Acción
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}