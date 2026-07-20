import { useEffect, useState } from 'react';
// IMPORTANTE: Asegúrate de importar updateCliente y deleteCliente
import { getClientes, createCliente, updateCliente, deleteCliente } from '../api/services';
import toast from 'react-hot-toast';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Nuevo estado para saber si estamos editando (guarda el ID) o creando (es null)
  const [clienteIdEditando, setClienteIdEditando] = useState(null);

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

  const limpiarFormulario = () => {
    setNuevoCliente({ nombre: '', apellido: '', dni: '', email: '', telefono: '', direccion: '' });
    setClienteIdEditando(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (clienteIdEditando) {
        // Modo Edición
        await updateCliente(clienteIdEditando, nuevoCliente);
        toast.success("Cliente actualizado exitosamente");
      } else {
        // Modo Creación
        await createCliente(nuevoCliente);
        toast.success("Cliente creado exitosamente");
      }

      limpiarFormulario();

      cargarClientes();

    } catch (error) {
      const mensajeError = error.response?.data?.detail || "Ocurrió un error al guardar";
      toast.error(typeof mensajeError === 'string' ? mensajeError : "Error de validación en los datos");
      console.error("Error guardando cliente", error);
    }
  };

  // Función que se ejecuta al presionar "Editar" en la tabla
  const handleEdit = (cliente) => {
    setNuevoCliente({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      dni: cliente.dni,
      // Usamos el operador || '' por si los valores vienen null de la base de datos
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    });
    setClienteIdEditando(cliente.id);
    setMostrarFormulario(true);
  };

  // Función que se ejecuta al presionar "Eliminar" en la tabla
  const handleDelete = async (id) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.");
    if (confirmar) {
      try {
        await deleteCliente(id);
        toast.success("Cliente eliminado correctamente");
        cargarClientes(); // Recargamos la tabla para que desaparezca
      } catch (error) {
        toast.error("Error al eliminar el cliente. Puede que tenga reservas asociadas.");
        console.error("Error eliminando", error);
      }
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>

        <button
          onClick={() => {
            if (mostrarFormulario) {
              limpiarFormulario();
            } else {
              setMostrarFormulario(true);
            }
          }}
          className={`${mostrarFormulario ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded transition`}
        >
          {mostrarFormulario ? "Cancelar" : "+ Nuevo Cliente"}
        </button>
      </div>

      {/* Formulario Oculto/Visible */}
      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
          <div className="col-span-2 mb-2">
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2">
              {clienteIdEditando ? 'Actualizar Datos del Cliente' : 'Registrar Nuevo Cliente'}
            </h2>
          </div>

          <input required name="nombre" value={nuevoCliente.nombre} onChange={handleInputChange} placeholder="Nombre *" className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input required name="apellido" value={nuevoCliente.apellido} onChange={handleInputChange} placeholder="Apellido *" className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input required name="dni" value={nuevoCliente.dni} onChange={handleInputChange} placeholder="DNI *" className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="email" type="email" value={nuevoCliente.email} onChange={handleInputChange} placeholder="Email" className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="telefono" value={nuevoCliente.telefono} onChange={handleInputChange} placeholder="Teléfono" className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="direccion" value={nuevoCliente.direccion} onChange={handleInputChange} placeholder="Dirección" className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <div className="col-span-2 flex justify-end mt-4">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
              {clienteIdEditando ? 'Actualizar Cliente' : 'Guardar Cliente'}
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
                <td className="p-3 font-medium">{cliente.nombre} {cliente.apellido}</td>
                <td className="p-3 text-gray-600">{cliente.dni}</td>
                <td className="p-3 text-gray-600">{cliente.email || 'N/A'}</td>
                <td className="p-3 text-center space-x-3">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="text-blue-500 hover:text-blue-700 font-semibold transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cliente.id)}
                    className="text-red-500 hover:text-red-700 font-semibold transition"
                  >
                    Eliminar
                  </button>
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
