import { useEffect, useState } from 'react';
// Asegúrate de importar deleteReserva desde tus servicios de la API
import { getReservas, createReserva, updateReserva, deleteReserva, getClientes, getHabitaciones } from '../api/services';
import toast from 'react-hot-toast';

export default function Reservas() {
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);

    // Estados para el Modal de Edición
    const [mostrarModal, setMostrarModal] = useState(false);
    const [reservaEditando, setReservaEditando] = useState(null);

    const [nuevaReserva, setNuevaReserva] = useState({
        cliente_id: '',
        habitacion_id: '',
        fecha_entrada: '',
        fecha_salida: '',
        observaciones: ''
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resReservas, resClientes, resHabitaciones] = await Promise.all([
                getReservas(),
                getClientes(),
                getHabitaciones()
            ]);
            setReservas(resReservas.data);
            setClientes(resClientes.data);
            setHabitaciones(resHabitaciones.data);
        } catch (error) {
            toast.error("Error al cargar los datos del sistema");
            console.error(error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevaReserva({ ...nuevaReserva, [name]: value });
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setReservaEditando({ ...reservaEditando, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataAEnviar = {
                ...nuevaReserva,
                cliente_id: parseInt(nuevaReserva.cliente_id),
                habitacion_id: parseInt(nuevaReserva.habitacion_id)
            };

            await createReserva(dataAEnviar);
            toast.success("Reserva creada exitosamente");

            setNuevaReserva({ cliente_id: '', habitacion_id: '', fecha_entrada: '', fecha_salida: '', observaciones: '' });
            setMostrarForm(false);
            cargarDatos();
        } catch (error) {
            toast.error("Error al crear la reserva. Verifica las fechas y disponibilidad.");
            console.error(error);
        }
    };

    // Abre el modal cargando los datos de la fila
    const abrirEditar = (reserva) => {
        setReservaEditando({ ...reserva });
        setMostrarModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const dataAEnviar = {
                habitacion_id: parseInt(reservaEditando.habitacion_id),
                fecha_entrada: reservaEditando.fecha_entrada,
                fecha_salida: reservaEditando.fecha_salida,
                observaciones: reservaEditando.observaciones,
                estado: reservaEditando.estado
            };

            await updateReserva(reservaEditando.id, dataAEnviar);
            toast.success("Reserva actualizada correctamente");

            setMostrarModal(false);
            setReservaEditando(null);
            cargarDatos();
        } catch (error) {
            toast.error("Error al actualizar la reserva. Revisa las fechas.");
            console.error(error);
        }
    };

    // Función GOD para eliminar con confirmación
    const handleDelete = async (id) => {
        const confirmar = window.confirm(`¿Estás completamente seguro de eliminar la reserva #${id}? Esta acción no se puede deshacer.`);

        if (confirmar) {
            try {
                await deleteReserva(id);
                toast.success(`Reserva #${id} eliminada correctamente`);
                cargarDatos(); // Recargamos la tabla para refrescar los cambios
            } catch (error) {
                toast.error("Error al eliminar la reserva");
                console.error(error);
            }
        }
    };

    const obtenerNombreCliente = (id) => {
        const cliente = clientes.find(c => c.id === id);
        return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido';
    };

    const obtenerNumeroHabitacion = (id) => {
        const habitacion = habitaciones.find(h => h.id === id);
        return habitacion ? `Hab. ${habitacion.numero}` : 'N/A';
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Reservas</h1>
                <button
                    onClick={() => setMostrarForm(!mostrarForm)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                    {mostrarForm ? "Cancelar" : "+ Nueva Reserva"}
                </button>
            </div>

            {/* FORMULARIO DE CREACIÓN */}
            {mostrarForm && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 font-bold mb-1">Cliente *</label>
                        <select required name="cliente_id" value={nuevaReserva.cliente_id} onChange={handleInputChange} className="p-2 border rounded bg-white">
                            <option value="" disabled>Seleccione un cliente...</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido} - DNI: {cliente.dni}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 font-bold mb-1">Habitación *</label>
                        <select required name="habitacion_id" value={nuevaReserva.habitacion_id} onChange={handleInputChange} className="p-2 border rounded bg-white">
                            <option value="" disabled>Seleccione una habitación...</option>
                            {habitaciones.map(hab => (
                                <option key={hab.id} value={hab.id}>Hab. {hab.numero} ({hab.estado})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 font-bold mb-1">Fecha de Entrada *</label>
                        <input required type="date" name="fecha_entrada" value={nuevaReserva.fecha_entrada} onChange={handleInputChange} className="p-2 border rounded" />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 font-bold mb-1">Fecha de Salida *</label>
                        <input required type="date" name="fecha_salida" value={nuevaReserva.fecha_salida} onChange={handleInputChange} className="p-2 border rounded" />
                    </div>

                    <div className="flex flex-col md:col-span-2">
                        <label className="text-sm text-gray-600 font-bold mb-1">Observaciones</label>
                        <textarea name="observaciones" value={nuevaReserva.observaciones} onChange={handleInputChange} rows="2" className="p-2 border rounded" placeholder="Alergias, peticiones especiales..."></textarea>
                    </div>

                    <div className="md:col-span-2 flex justify-end mt-4">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                            Confirmar Reserva
                        </button>
                    </div>
                </form>
            )}

            {/* TABLA DE RESERVAS */}
            <div className="bg-white rounded shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-white">
                            <th className="p-3">ID</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Habitación</th>
                            <th className="p-3">Check-in</th>
                            <th className="p-3">Check-out</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservas.map(reserva => (
                            <tr key={reserva.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-gray-500">#{reserva.id}</td>
                                <td className="p-3 font-semibold">{obtenerNombreCliente(reserva.cliente_id)}</td>
                                <td className="p-3">{obtenerNumeroHabitacion(reserva.habitacion_id)}</td>
                                <td className="p-3 text-blue-600">{reserva.fecha_entrada}</td>
                                <td className="p-3 text-red-600">{reserva.fecha_salida}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        reserva.estado === 'CONFIRMADA' ? 'bg-green-100 text-green-800' :
                                        reserva.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                        reserva.estado === 'CANCELADA' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {reserva.estado}
                                    </span>
                                </td>
                                <td className="p-3 text-center flex justify-center gap-2">
                                    <button
                                        onClick={() => abrirEditar(reserva)}
                                        className="bg-amber-500 text-white px-3 py-1 rounded text-sm hover:bg-amber-600 transition"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(reserva.id)}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {reservas.length === 0 && (
                            <tr>
                                <td colSpan="7" className="p-4 text-center text-gray-500">No hay reservas registradas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE EDICIÓN */}
            {mostrarModal && reservaEditando && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">
                            Editar Reserva #{reservaEditando.id}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Cliente: <span className="font-semibold text-gray-700">{obtenerNombreCliente(reservaEditando.cliente_id)}</span>
                        </p>

                        <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-bold text-gray-600 mb-1">Habitación *</label>
                                <select required name="habitacion_id" value={reservaEditando.habitacion_id} onChange={handleEditInputChange} className="p-2 border rounded bg-white">
                                    {habitaciones.map(hab => (
                                        <option key={hab.id} value={hab.id}>Hab. {hab.numero} ({hab.estado})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-bold text-gray-600 mb-1">Fecha de Entrada *</label>
                                <input required type="date" name="fecha_entrada" value={reservaEditando.fecha_entrada} onChange={handleEditInputChange} className="p-2 border rounded" />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-bold text-gray-600 mb-1">Fecha de Salida *</label>
                                <input required type="date" name="fecha_salida" value={reservaEditando.fecha_salida} onChange={handleEditInputChange} className="p-2 border rounded" />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-bold text-gray-600 mb-1">Estado de Reserva *</label>
                                <select required name="estado" value={reservaEditando.estado} onChange={handleEditInputChange} className="p-2 border rounded bg-white">
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="CONFIRMADA">CONFIRMADA</option>
                                    <option value="CANCELADA">CANCELADA</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-bold text-gray-600 mb-1">Observaciones</label>
                                <textarea name="observaciones" value={reservaEditando.observaciones || ''} onChange={handleEditInputChange} rows="2" className="p-2 border rounded"></textarea>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setMostrarModal(false); setReservaEditando(null); }}
                                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
