import { useEffect, useState } from 'react';
import { getHabitaciones, createHabitacion, updateHabitacion, deleteHabitacion, getTiposHabitacion } from '../api/services';
import toast from 'react-hot-toast';

export default function Habitaciones() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [habIdEditando, setHabIdEditando] = useState(null);
    
    const [nuevaHab, setNuevaHab] = useState({ 
        numero: '', 
        piso: '', 
        tipo_id: '', 
        descripcion: '',
        estado: 'LIBRE' // Añadimos estado para cuando se edite
    });

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
        const [resHab, resTipos] = await Promise.all([getHabitaciones(), getTiposHabitacion()]);
        setHabitaciones(resHab.data);
        setTipos(resTipos.data);
        } catch (error) { toast.error("Error al cargar datos"); }
    };

    const limpiarFormulario = () => {
        setNuevaHab({ numero: '', piso: '', tipo_id: '', descripcion: '', estado: 'LIBRE' });
        setHabIdEditando(null);
        setMostrarForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        const dataAEnviar = {
            ...nuevaHab,
            piso: nuevaHab.piso ? parseInt(nuevaHab.piso) : null,
            tipo_id: parseInt(nuevaHab.tipo_id)
        };

        if (habIdEditando) {
            await updateHabitacion(habIdEditando, dataAEnviar);
            toast.success("Habitación actualizada");
        } else {
            await createHabitacion(dataAEnviar);
            toast.success("Habitación creada");
        }
        
        limpiarFormulario();
        cargarDatos();
        } catch (error) { toast.error("Error guardando habitación"); }
    };

    const handleEdit = (hab) => {
        setNuevaHab({
        numero: hab.numero,
        piso: hab.piso || '',
        tipo_id: hab.tipo.id, // Tu API devuelve el objeto 'tipo' completo, sacamos el ID
        descripcion: hab.descripcion || '',
        estado: hab.estado
        });
        setHabIdEditando(hab.id);
        setMostrarForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar esta habitación?")) {
        try {
            await deleteHabitacion(id);
            toast.success("Habitación eliminada");
            cargarDatos();
        } catch (error) {
            toast.error("Error al eliminar la habitación.");
        }
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Habitaciones</h1>
            <button 
            onClick={() => mostrarForm ? limpiarFormulario() : setMostrarForm(true)} 
            className={`${mostrarForm ? 'bg-gray-500' : 'bg-green-600'} text-white px-4 py-2 rounded`}
            >
            {mostrarForm ? "Cancelar" : "+ Nueva Habitación"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-full border-b pb-2 mb-2">
                <h2 className="text-xl font-bold text-gray-700">{habIdEditando ? 'Actualizar Habitación' : 'Crear Habitación'}</h2>
            </div>
            
            <input required placeholder="Número (ej. 101)" className="p-2 border rounded" 
                value={nuevaHab.numero} onChange={e => setNuevaHab({...nuevaHab, numero: e.target.value})} />
            
            <input type="number" placeholder="Piso" className="p-2 border rounded" 
                value={nuevaHab.piso} onChange={e => setNuevaHab({...nuevaHab, piso: e.target.value})} />
            
            <select required className="p-2 border rounded bg-white"
                value={nuevaHab.tipo_id} onChange={e => setNuevaHab({...nuevaHab, tipo_id: e.target.value})}>
                <option value="" disabled>Seleccione Tipo...</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>

            {/* El estado solo lo mostramos si estamos editando, ya que al crear siempre es LIBRE */}
            {habIdEditando && (
                <select required className="p-2 border rounded bg-white"
                value={nuevaHab.estado} onChange={e => setNuevaHab({...nuevaHab, estado: e.target.value})}>
                <option value="LIBRE">LIBRE</option>
                <option value="OCUPADA">OCUPADA</option>
                <option value="RESERVADA">RESERVADA</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                </select>
            )}

            <input placeholder="Descripción opcional" className={`p-2 border rounded ${habIdEditando ? 'col-span-2' : 'col-span-full'}`}
                value={nuevaHab.descripcion} onChange={e => setNuevaHab({...nuevaHab, descripcion: e.target.value})} />
            
            <div className="col-span-full flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">{habIdEditando ? 'Actualizar' : 'Guardar'}</button>
            </div>
            </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {habitaciones.map(hab => {
            // Colores dinámicos según estado
            const colorEstado = 
                hab.estado === 'LIBRE' ? 'bg-green-100 text-green-800 border-green-500' : 
                hab.estado === 'OCUPADA' ? 'bg-red-100 text-red-800 border-red-500' :
                hab.estado === 'RESERVADA' ? 'bg-blue-100 text-blue-800 border-blue-500' :
                'bg-orange-100 text-orange-800 border-orange-500';

            return (
                <div key={hab.id} className={`bg-white p-5 rounded shadow border-t-4 ${colorEstado.split(' ')[2]} flex flex-col`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-2xl">#{hab.numero}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${colorEstado}`}>{hab.estado}</span>
                </div>
                
                <div className="text-gray-600 text-sm flex-1">
                    <p><strong>Tipo:</strong> {hab.tipo.nombre}</p>
                    <p><strong>Piso:</strong> {hab.piso || 'N/A'}</p>
                </div>

                <div className="flex justify-between mt-4 border-t pt-3">
                    <button onClick={() => handleEdit(hab)} className="text-blue-500 text-sm hover:underline font-bold">Editar</button>
                    <button onClick={() => handleDelete(hab.id)} className="text-red-500 text-sm hover:underline font-bold">Eliminar</button>
                </div>
                </div>
            );
            })}
        </div>
        </div>
    );
}