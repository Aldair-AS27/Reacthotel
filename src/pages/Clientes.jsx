import { useEffect, useState } from 'react';
import { getClientes, createCliente } from '../api/services';
import toast from 'react-hot-toast';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Estado para el nuevo cliente basado en tu esquema ClienteCreate del Swagger
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await getClientes();
      setClientes(res.data);
    } catch (error) {
      toast.error("Error al cargar la lista de clientes");
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente({ ...nuevoCliente, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Intentamos crear el cliente en el backend
      await createCliente(nuevoCliente);

      // Si funciona, mostramos éxito, limpiamos el formulario y recargamos la lista
      toast.success("Cliente creado exitosamente");
      setNuevoCliente({ nombre: '', apellido: '', dni: '', email: '', telefono: '', direccion: '' });
      setMostrarFormulario(false);
      cargarClientes();

    } catch (error) {
      // Manejo de errores visual
      const mensajeError = error.response?.data?.detail || "Ocurrió un error al guardar";
      toast.error(typeof mensajeError === 'string' ? mensajeError : "Error de validación en los datos");
      console.error("Error creando cliente", error);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          {mostrarFormulario ? "Cancelar" : "+ Nuevo Cliente"}
        </button>
      </div>

      {/* Formulario Oculto/Visible */}
      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
          <input required name="nombre" value={nuevoCliente.nombre} onChange={handleInputChange} placeholder="Nombre *" className="p-2 border rounded" />
          <input required name="apellido" value={nuevoCliente.apellido} onChange={handleInputChange} placeholder="Apellido *" className="p-2 border rounded" />
          <input required name="dni" value={nuevoCliente.dni} onChange={handleInputChange} placeholder="DNI *" className="p-2 border rounded" />
          <input name="email" type="email" value={nuevoCliente.email} onChange={handleInputChange} placeholder="Email" className="p-2 border rounded" />
          <input name="telefono" value={nuevoCliente.telefono} onChange={handleInputChange} placeholder="Teléfono" className="p-2 border rounded" />
          <input name="direccion" value={nuevoCliente.direccion} onChange={handleInputChange} placeholder="Dirección" className="p-2 border rounded" />

          <div className="col-span-2 flex justify-end mt-4">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
              Guardar Cliente
            </button>
          </div>
        </form>
      )}

      {/* Lista de Clientes */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3">Nombre Completo</th>
              <th className="p-3">DNI</th>
              <th className="p-3">Email</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{cliente.nombre} {cliente.apellido}</td>
                <td className="p-3">{cliente.dni}</td>
                <td className="p-3">{cliente.email || 'N/A'}</td>
                <td className="p-3 text-center">
                  <button className="text-blue-500 hover:text-blue-700 font-semibold">Editar</button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">No hay clientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
