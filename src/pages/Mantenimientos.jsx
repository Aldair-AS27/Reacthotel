import { useEffect, useState } from 'react';
import { 
  getMantenimientos, 
  createMantenimiento, 
  updateMantenimiento, 
  deleteMantenimiento, 
  getHabitaciones, 
  getUsuarios 
} from '../api/services';
import toast from 'react-hot-toast';

export default function Mantenimientos() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mantIdEditando, setMantIdEditando] = useState(null);
  
  const [nuevoMant, setNuevoMant] = useState({ 
    habitacion_id: '', 
    usuario_id: '', 
    descripcion: '' 
  });

  const [menuAvanzadoId, setMenuAvanzadoId] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [resMant, resHab, resUsu] = await Promise.all([
        getMantenimientos(), 
        getHabitaciones(),
        getUsuarios()
      ]);
      setMantenimientos(resMant.data);
      setHabitaciones(resHab.data);
      
      // REGLA: Solo personal con rol estricto de MANTENIMIENTO
      const personalAutorizado = resUsu.data.filter(u => u.rol === 'MANTENIMIENTO');
      setUsuarios(personalAutorizado);
    } catch (error) { 
      toast.error("Error al cargar datos del sistema"); 
    }
  };

  const limpiarFormulario = () => {
    setNuevoMant({ habitacion_id: '', usuario_id: '', descripcion: '' });
    setMantIdEditando(null);
    setMostrarForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        descripcion: nuevoMant.descripcion,
        usuario_id: nuevoMant.usuario_id ? parseInt(nuevoMant.usuario_id) : null
      };

      if (mantIdEditando) {
        await updateMantenimiento(mantIdEditando, payload);
        toast.success("Orden de mantenimiento actualizada");
      } else {
        await createMantenimiento({ 
          ...payload, 
          habitacion_id: parseInt(nuevoMant.habitacion_id) 
        });
        toast.success("Mantenimiento registrado");
      }
      
      limpiarFormulario();
      cargarDatos();
    } catch (error) { 
      toast.error("Error al procesar la orden"); 
    }
  };

  const handleMarcarLista = async (id) => {
    try {
      const fechaActual = new Date().toISOString(); 
      // Al marcar como resuelto, desaparecerá de la vista gracias a nuestro filtro
      await updateMantenimiento(id, { resuelto: true, fecha_fin: fechaActual });
      toast.success("¡Habitación lista y operativa!");
      cargarDatos();
    } catch (error) {
      toast.error("Error al actualizar el estado de la habitación");
    }
  };

  const handleEdit = (mant) => {
    setNuevoMant({
      habitacion_id: mant.habitacion_id,
      usuario_id: mant.usuario_id || '',
      descripcion: mant.descripcion || ''
    });
    setMantIdEditando(mant.id);
    setMostrarForm(true);
    setMenuAvanzadoId(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleDelete = async (id) => {
    if(window.confirm("⚠️ CASO EXTREMO: ¿Estás completamente seguro de eliminar esta orden del registro histórico?")) {
      try {
        await deleteMantenimiento(id);
        toast.success("Registro eliminado de la base de datos");
        cargarDatos();
      } catch (error) {
        toast.error("No se pudo eliminar el registro");
      }
    }
  };

  const obtenerNumeroHabitacion = (id) => {
    const hab = habitaciones.find(h => h.id === id);
    return hab ? `Habitación ${hab.numero}` : `ID: ${id}`;
  };

  const obtenerNombrePersonal = (id) => {
    if (!id) return "Personal sin asignar";
    const usu = usuarios.find(u => u.id === id);
    return usu ? usu.nombre : "Usuario Desconocido";
  };

  // REGLA: Filtrar habitaciones que NO tienen mantenimiento pendiente
  const habitacionesDisponiblesParaReporte = habitaciones.filter(h => {
    const estaPendiente = mantenimientos.some(m => m.habitacion_id === h.id && !m.resuelto);
    return !estaPendiente;
  });

  // REGLA: Ocultar los mantenimientos resueltos de la vista principal
  const mantenimientosActivos = mantenimientos.filter(m => !m.resuelto);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Órdenes de Mantenimiento</h1>
          <p className="text-gray-500 text-sm mt-1">Supervisa y asigna reparaciones activas del hotel</p>
        </div>
        <button 
          onClick={() => mostrarForm ? limpiarFormulario() : setMostrarForm(true)} 
          className={`${mostrarForm ? 'bg-gray-500' : 'bg-orange-600 hover:bg-orange-700'} text-white px-5 py-2 rounded-lg font-bold shadow transition`}
        >
          {mostrarForm ? "Cancelar" : "+ Nueva Orden"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-500 mb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-full border-b pb-3 mb-2">
            <h2 className="text-xl font-bold text-gray-700">{mantIdEditando ? 'Modificar Orden Existente' : 'Crear Reporte de Mantenimiento'}</h2>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700 mb-1">Habitación Afectada *</label>
            <select required disabled={!!mantIdEditando} className="p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              value={nuevoMant.habitacion_id} onChange={e => setNuevoMant({...nuevoMant, habitacion_id: e.target.value})}>
              <option value="" disabled>Seleccione una habitación...</option>
              {mantIdEditando && <option value={nuevoMant.habitacion_id}>{obtenerNumeroHabitacion(nuevoMant.habitacion_id)}</option>}
              
              {!mantIdEditando && habitacionesDisponiblesParaReporte.map(h => (
                <option key={h.id} value={h.id}>Hab. {h.numero}</option>
              ))}
            </select>
            {!mantIdEditando && habitacionesDisponiblesParaReporte.length === 0 && (
              <span className="text-xs text-red-500 mt-1">Todas las habitaciones están en mantenimiento actualmente.</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700 mb-1">Técnico Asignado</label>
            <select className="p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500"
              value={nuevoMant.usuario_id} onChange={e => setNuevoMant({...nuevoMant, usuario_id: e.target.value})}>
              <option value="">-- Dejar pendiente de asignación --</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col col-span-full">
            <label className="text-sm font-bold text-gray-700 mb-1">Descripción del Problema *</label>
            <textarea required placeholder="Detalla qué necesita ser reparado (ej. Fuga de agua en lavabo, AC no enfría...)" 
              className="p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500" rows="3"
              value={nuevoMant.descripcion} onChange={e => setNuevoMant({...nuevoMant, descripcion: e.target.value})}></textarea>
          </div>

          <div className="col-span-full flex justify-end">
            <button type="submit" className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-700 shadow-md">
              {mantIdEditando ? 'Actualizar Orden' : 'Registrar Orden'}
            </button>
          </div>
        </form>
      )}

      {/* Grid de Tarjetas de Mantenimiento Activas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mantenimientosActivos.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-md border-t-4 border-orange-500 flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-black text-xl text-gray-800">{obtenerNumeroHabitacion(m.habitacion_id)}</h3>
                <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800">
                  🛠️ EN PROGRESO
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{m.descripcion}</p>
              
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-500 flex items-center">
                <span className="mr-2">👷</span>
                {obtenerNombrePersonal(m.usuario_id)}
              </div>
            </div>

            <div className="px-5 pb-4">
              <button 
                onClick={() => handleMarcarLista(m.id)}
                className="w-full bg-green-50 text-green-700 font-bold py-2 rounded border border-green-200 hover:bg-green-600 hover:text-white transition"
              >
                Marcar Habitación como Lista
              </button>
            </div>

            <div className="border-t bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setMenuAvanzadoId(menuAvanzadoId === m.id ? null : m.id)}
                className="w-full text-xs text-gray-500 font-bold p-2 hover:bg-gray-100 text-left flex justify-between items-center"
              >
                Ajustes Avanzados para casos extremos
                <span>{menuAvanzadoId === m.id ? '▲' : '▼'}</span>
              </button>
              
              {menuAvanzadoId === m.id && (
                <div className="p-3 flex justify-around bg-gray-100">
                  <button onClick={() => handleEdit(m)} className="text-blue-600 text-sm font-bold hover:underline">✏️ Editar Orden</button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-600 text-sm font-bold hover:underline">🗑️ Eliminar</button>
                </div>
              )}
            </div>

          </div>
        ))}
        
        {mantenimientosActivos.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-lg shadow border border-dashed">
            ¡Todo al día! No hay mantenimientos pendientes.
          </div>
        )}
      </div>
    </div>
  );
}