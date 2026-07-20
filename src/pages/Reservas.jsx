import { useEffect, useState } from 'react';
import { getReservas, createReserva, getClientes, getHabitaciones } from '../api/services';
import toast from 'react-hot-toast';

export default function Reservas() {
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    
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
        // Cargamos todo en paralelo para mayor velocidad
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        // Parsear IDs a enteros antes de enviar al backend
        const dataAEnviar = {
            ...nuevaReserva,
            cliente_id: parseInt(nuevaReserva.cliente_id),
            habitacion_id: parseInt(nuevaReserva.habitacion_id)
        };
        
        await createReserva(dataAEnviar);
        toast.success("Reserva creada exitosamente");
        
        // Limpiar formulario y recargar tabla
        setNuevaReserva({ cliente_id: '', habitacion_id: '', fecha_entrada: '', fecha_salida: '', observaciones: '' });
        setMostrarForm(false);
        cargarDatos();
        } catch (error) {
        toast.error("Error al crear la reserva. Verifica las fechas y disponibilidad.");
        console.error(error);
        }
    };

    // Funciones auxiliares para mostrar nombres en lugar de IDs en la tabla
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
                </tr>
                ))}
                {reservas.length === 0 && (
                <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">No hay reservas registradas.</td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    );
}