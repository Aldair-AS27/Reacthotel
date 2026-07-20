import { useEffect, useState } from 'react';
import { getTiposHabitacion, createTipoHabitacion, updateTipoHabitacion, deleteTipoHabitacion } from '../api/services';
import toast from 'react-hot-toast';

export default function TiposHabitacion() {
    const [tipos, setTipos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [tipoIdEditando, setTipoIdEditando] = useState(null);
    
    const [nuevoTipo, setNuevoTipo] = useState({
        nombre: '',
        descripcion: '',
        precio_noche: '',
        capacidad: 1,
        imagen_url: '' // Campo nuevo visual
    });

    useEffect(() => { cargarTipos(); }, []);

    const cargarTipos = async () => {
        try {
        const res = await getTiposHabitacion();
        setTipos(res.data);
        } catch (error) {
        toast.error("Error al cargar los tipos de habitación");
        }
    };

    const limpiarFormulario = () => {
        setNuevoTipo({ nombre: '', descripcion: '', precio_noche: '', capacidad: 1, imagen_url: '' });
        setTipoIdEditando(null);
        setMostrarForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        const dataAEnviar = {
            ...nuevoTipo,
            precio_noche: parseFloat(nuevoTipo.precio_noche),
            capacidad: parseInt(nuevoTipo.capacidad)
        };
        
        if (tipoIdEditando) {
            await updateTipoHabitacion(tipoIdEditando, dataAEnviar);
            toast.success("Tipo de habitación actualizado");
        } else {
            await createTipoHabitacion(dataAEnviar);
            toast.success("Tipo de habitación creado");
        }
        
        limpiarFormulario();
        cargarTipos();
        } catch (error) {
        toast.error("Error al guardar el tipo de habitación");
        }
    };

    const handleEdit = (tipo) => {
        setNuevoTipo({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion || '',
        precio_noche: tipo.precio_noche,
        capacidad: tipo.capacidad,
        imagen_url: tipo.imagen_url || ''
        });
        setTipoIdEditando(tipo.id);
        setMostrarForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este tipo de habitación?")) {
        try {
            await deleteTipoHabitacion(id);
            toast.success("Eliminado correctamente");
            cargarTipos();
        } catch (error) {
            toast.error("Error al eliminar. Revisa si hay habitaciones de este tipo.");
        }
        }
    };

    // URL por defecto si el usuario no pone una
    const imagenPorDefecto = "https://www.swissotel.com/assets/0/92/2119/2178/2217/2219/6442451722/83eb355a-2f1c-49d8-ad51-1ccce3b52b33.jpg";

    return (
        <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Tipos de Habitación</h1>
            <button 
            onClick={() => mostrarForm ? limpiarFormulario() : setMostrarForm(true)}
            className={`${mostrarForm ? 'bg-gray-500' : 'bg-green-600'} text-white px-4 py-2 rounded hover:opacity-80 transition`}
            >
            {mostrarForm ? "Cancelar" : "+ Nuevo Tipo"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
            <div className="col-span-2 border-b pb-2 mb-2">
                <h2 className="text-xl font-bold text-gray-700">{tipoIdEditando ? 'Editar Tipo de Habitación' : 'Nuevo Tipo'}</h2>
            </div>
            <input required type="text" placeholder="Nombre (ej. Suite)" className="p-2 border rounded" 
                value={nuevoTipo.nombre} onChange={(e) => setNuevoTipo({...nuevoTipo, nombre: e.target.value})} />
            <input required type="number" step="0.01" placeholder="Precio por Noche ($)" className="p-2 border rounded" 
                value={nuevoTipo.precio_noche} onChange={(e) => setNuevoTipo({...nuevoTipo, precio_noche: e.target.value})} />
            <input required type="number" min="1" placeholder="Capacidad (Personas)" className="p-2 border rounded" 
                value={nuevoTipo.capacidad} onChange={(e) => setNuevoTipo({...nuevoTipo, capacidad: e.target.value})} />
            <input type="text" placeholder="URL de Imagen de muestra (opcional)" className="p-2 border rounded" 
                value={nuevoTipo.imagen_url} onChange={(e) => setNuevoTipo({...nuevoTipo, imagen_url: e.target.value})} />
            <textarea placeholder="Descripción breve" className="p-2 border rounded col-span-2" rows="2"
                value={nuevoTipo.descripcion} onChange={(e) => setNuevoTipo({...nuevoTipo, descripcion: e.target.value})}></textarea>
            
            <div className="col-span-2 flex justify-end mt-2">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                {tipoIdEditando ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
            </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tipos.map(tipo => (
            <div key={tipo.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden flex flex-col">
                {/* Imagen Adaptativa */}
                <img 
                src={tipo.imagen_url || imagenPorDefecto} 
                alt={tipo.nombre} 
                className="w-full h-48 object-cover"
                />
                
                <div className="p-5 flex flex-col flex-1">
                <h2 className="text-2xl font-bold mb-1">{tipo.nombre}</h2>
                <p className="text-gray-600 mb-4 flex-1 text-sm">{tipo.descripcion || "Sin descripción"}</p>
                
                <div className="flex justify-between items-center mb-4 text-sm bg-gray-50 p-2 rounded">
                    <span className="font-semibold text-gray-700">👤 {tipo.capacidad} pers.</span>
                    <span className="font-bold text-green-700 text-lg">${tipo.precio_noche}</span>
                </div>

                <div className="flex justify-between border-t pt-3">
                    <button onClick={() => handleEdit(tipo)} className="text-blue-500 font-bold hover:underline">Editar</button>
                    <button onClick={() => handleDelete(tipo.id)} className="text-red-500 font-bold hover:underline">Eliminar</button>
                </div>
                </div>
            </div>
            ))}
        </div>
        </div>
    );
}