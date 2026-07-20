import { useEffect, useState } from 'react';
import { getHabitaciones, createHabitacion, getTiposHabitacion } from '../api/services';
import toast from 'react-hot-toast';

export default function Habitaciones() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    
    const [nuevaHab, setNuevaHab] = useState({ numero: '', piso: '', tipo_id: '', descripcion: '' });

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
        const [resHab, resTipos] = await Promise.all([getHabitaciones(), getTiposHabitacion()]);
        setHabitaciones(resHab.data);
        setTipos(resTipos.data);
        } catch (error) { toast.error("Error al cargar habitaciones"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        await createHabitacion({
            ...nuevaHab,
            piso: parseInt(nuevaHab.piso) || null,
            tipo_id: parseInt(nuevaHab.tipo_id)
        });
        toast.success("Habitación creada");
        setNuevaHab({ numero: '', piso: '', tipo_id: '', descripcion: '' });
        setMostrarForm(false);
        cargarDatos();
        } catch (error) { toast.error("Error al crear habitación"); }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Habitaciones</h1>
            <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-green-600 text-white px-4 py-2 rounded">
            {mostrarForm ? "Cancelar" : "+ Nueva Habitación"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
            <input required placeholder="Número (ej. 101)" className="p-2 border rounded" 
                value={nuevaHab.numero} onChange={e => setNuevaHab({...nuevaHab, numero: e.target.value})} />
            <input type="number" placeholder="Piso" className="p-2 border rounded" 
                value={nuevaHab.piso} onChange={e => setNuevaHab({...nuevaHab, piso: e.target.value})} />
            <select required className="p-2 border rounded bg-white"
                value={nuevaHab.tipo_id} onChange={e => setNuevaHab({...nuevaHab, tipo_id: e.target.value})}>
                <option value="" disabled>Seleccione Tipo...</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <input placeholder="Descripción" className="p-2 border rounded" 
                value={nuevaHab.descripcion} onChange={e => setNuevaHab({...nuevaHab, descripcion: e.target.value})} />
            <div className="col-span-2 flex justify-end"><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Guardar</button></div>
            </form>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {habitaciones.map(hab => (
            <div key={hab.id} className="bg-white p-4 rounded shadow border-l-4 border-indigo-500">
                <h3 className="font-bold text-lg">Hab. {hab.numero}</h3>
                <p className="text-sm text-gray-500">Piso: {hab.piso || 'N/A'}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded mt-2 inline-block ${hab.estado === 'LIBRE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{hab.estado}</span>
            </div>
            ))}
        </div>
        </div>
    );
}