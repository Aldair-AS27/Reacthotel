import { useEffect, useState } from 'react';
import { getFacturas, createFactura, getReservas } from '../api/services';
import toast from 'react-hot-toast';

export default function Facturas() {
    const [facturas, setFacturas] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nuevaFactura, setNuevaFactura] = useState({ reserva_id: '', notas: '' });

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
        const [resFact, resReservas] = await Promise.all([getFacturas(), getReservas()]);
        setFacturas(resFact.data);
        setReservas(resReservas.data);
        } catch (error) { toast.error("Error al cargar facturas"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        await createFactura({ ...nuevaFactura, reserva_id: parseInt(nuevaFactura.reserva_id) });
        toast.success("Factura generada");
        setNuevaFactura({ reserva_id: '', notas: '' });
        setMostrarForm(false);
        cargarDatos();
        } catch (error) { toast.error("Error al generar factura"); }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Facturación</h1>
            <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-green-600 text-white px-4 py-2 rounded">
            {mostrarForm ? "Cancelar" : "+ Generar Factura"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-1 gap-4">
            <select required className="p-2 border rounded bg-white"
                value={nuevaFactura.reserva_id} onChange={e => setNuevaFactura({...nuevaFactura, reserva_id: e.target.value})}>
                <option value="" disabled>Seleccione Reserva...</option>
                {reservas.map(r => <option key={r.id} value={r.id}>Reserva #{r.id} - Hab. {r.habitacion_id}</option>)}
            </select>
            <input placeholder="Notas adicionales..." className="p-2 border rounded" 
                value={nuevaFactura.notas} onChange={e => setNuevaFactura({...nuevaFactura, notas: e.target.value})} />
            <div className="flex justify-end"><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Generar</button></div>
            </form>
        )}

        <div className="grid grid-cols-1 gap-4">
            {facturas.map(f => (
            <div key={f.id} className="bg-white p-4 rounded shadow border-l-4 border-green-500 flex justify-between">
                <div><p className="font-bold">Factura #{f.id} (Reserva #{f.reserva_id})</p><p className="text-sm text-gray-500">{f.notas || 'Sin notas'}</p></div>
                <div className="text-right"><p className="font-black text-xl text-green-700">${f.total}</p><p className="text-sm">{f.estado}</p></div>
            </div>
            ))}
        </div>
        </div>
    );
}