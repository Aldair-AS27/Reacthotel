import { useEffect, useState } from 'react';
import { getTiposHabitacion, createTipoHabitacion } from '../api/services';
import toast from 'react-hot-toast';

export default function TiposHabitacion() {
    const [tipos, setTipos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    
    const [nuevoTipo, setNuevoTipo] = useState({
        nombre: '',
        descripcion: '',
        precio_noche: '',
        capacidad: 1
    });

    useEffect(() => {
        cargarTipos();
    }, []);

    const cargarTipos = async () => {
        try {
        const res = await getTiposHabitacion();
        setTipos(res.data);
        } catch (error) {
        toast.error("Error al cargar los tipos de habitación");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        // Convertir valores a números antes de enviar (según tu Swagger)
        const dataAEnviar = {
            ...nuevoTipo,
            precio_noche: parseFloat(nuevoTipo.precio_noche),
            capacidad: parseInt(nuevoTipo.capacidad)
        };
        
        await createTipoHabitacion(dataAEnviar);
        toast.success("Tipo de habitación creado");
        setNuevoTipo({ nombre: '', descripcion: '', precio_noche: '', capacidad: 1 });
        setMostrarForm(false);
        cargarTipos();
        } catch (error) {
        toast.error("Error al guardar el tipo de habitación");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Tipos de Habitación</h1>
            <button 
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
            {mostrarForm ? "Cancelar" : "+ Nuevo Tipo"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
            <input required type="text" placeholder="Nombre (ej. Suite)" className="p-2 border rounded" 
                value={nuevoTipo.nombre} onChange={(e) => setNuevoTipo({...nuevoTipo, nombre: e.target.value})} />
            <input required type="number" step="0.01" placeholder="Precio por Noche ($)" className="p-2 border rounded" 
                value={nuevoTipo.precio_noche} onChange={(e) => setNuevoTipo({...nuevoTipo, precio_noche: e.target.value})} />
            <input required type="number" min="1" placeholder="Capacidad (Personas)" className="p-2 border rounded" 
                value={nuevoTipo.capacidad} onChange={(e) => setNuevoTipo({...nuevoTipo, capacidad: e.target.value})} />
            <input type="text" placeholder="Descripción breve" className="p-2 border rounded" 
                value={nuevoTipo.descripcion} onChange={(e) => setNuevoTipo({...nuevoTipo, descripcion: e.target.value})} />
            
            <div className="col-span-2 flex justify-end mt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Guardar</button>
            </div>
            </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tipos.map(tipo => (
            <div key={tipo.id} className="bg-white p-6 rounded shadow-md border-t-4 border-blue-600 hover:shadow-lg transition">
                <h2 className="text-xl font-bold mb-2">{tipo.nombre}</h2>
                <p className="text-gray-600 mb-4 h-12 overflow-hidden">{tipo.descripcion || "Sin descripción"}</p>
                <div className="flex justify-between items-center text-sm">
                <span className="bg-gray-200 px-2 py-1 rounded">👤 {tipo.capacidad} pers.</span>
                <span className="font-bold text-green-700">${tipo.precio_noche} / noche</span>
                </div>
            </div>
            ))}
        </div>
        </div>
    );
}