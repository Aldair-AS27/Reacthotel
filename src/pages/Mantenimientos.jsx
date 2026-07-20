import { useEffect, useState } from 'react';
import { getMantenimientos, createMantenimiento, getHabitaciones } from '../api/services';
import toast from 'react-hot-toast';

export default function Mantenimientos() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoMant, setNuevoMant] = useState({ habitacion_id: '', descripcion: '' });

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [resMant, resHab] = await Promise.all([getMantenimientos(), getHabitaciones()]);
      setMantenimientos(resMant.data);
      setHabitaciones(resHab.data);
    } catch (error) { toast.error("Error al cargar mantenimientos"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMantenimiento({ ...nuevoMant, habitacion_id: parseInt(nuevoMant.habitacion_id) });
      toast.success("Mantenimiento registrado");
      setNuevoMant({ habitacion_id: '', descripcion: '' });
      setMostrarForm(false);
      cargarDatos();
    } catch (error) { toast.error("Error al registrar"); }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mantenimientos</h1>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-orange-500 text-white px-4 py-2 rounded">
          {mostrarForm ? "Cancelar" : "+ Nuevo Registro"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-1 gap-4">
          <select required className="p-2 border rounded bg-white"
            value={nuevoMant.habitacion_id} onChange={e => setNuevoMant({...nuevoMant, habitacion_id: e.target.value})}>
            <option value="" disabled>Seleccione Habitación...</option>
            {habitaciones.map(h => <option key={h.id} value={h.id}>Hab. {h.numero}</option>)}
          </select>
          <textarea required placeholder="Descripción del problema..." className="p-2 border rounded" rows="3"
            value={nuevoMant.descripcion} onChange={e => setNuevoMant({...nuevoMant, descripcion: e.target.value})}></textarea>
          <div className="flex justify-end"><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Guardar</button></div>
        </form>
      )}

      <ul className="space-y-4">
        {mantenimientos.map(m => (
          <li key={m.id} className="bg-white p-4 rounded shadow border-l-4 border-orange-500 flex justify-between items-center">
            <div>
              <p className="font-bold">Habitación ID: {m.habitacion_id}</p>
              <p className="text-gray-600 text-sm">{m.descripcion}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-bold rounded ${m.resuelto ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {m.resuelto ? "RESUELTO" : "PENDIENTE"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}