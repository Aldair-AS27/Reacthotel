import { useEffect, useState } from 'react';
// Importamos las funciones necesarias que ya mapeamos en services
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../api/services';
import toast from 'react-hot-toast';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    
    // Estado para controlar qué ID estamos editando (null = modo creación)
    const [usuarioIdEditando, setUsuarioIdEditando] = useState(null);

    const [nuevoUsuario, setNuevoUsuario] = useState({ 
        nombre: '', 
        email: '', 
        password: '', 
        rol: 'RECEPCION',
        activo: true 
    });

    useEffect(() => { cargarUsuarios(); }, []);

    const cargarUsuarios = async () => {
        try {
        const res = await getUsuarios();
        setUsuarios(res.data);
        } catch (error) { 
        toast.error("Error al cargar usuarios"); 
        }
    };

    const limpiarFormulario = () => {
        setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'RECEPCION', activo: true });
        setUsuarioIdEditando(null);
        setMostrarForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        if (usuarioIdEditando) {
            // Modo Edición: Enviamos los campos correspondientes a UsuarioUpdate (sin password)
            const datosActualizados = {
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            activo: nuevoUsuario.activo
            };
            await updateUsuario(usuarioIdEditando, datosActualizados);
            toast.success("Usuario actualizado correctamente");
        } else {
            // Modo Creación
            await createUsuario(nuevoUsuario);
            toast.success("Usuario creado exitosamente");
        }
        
        limpiarFormulario();
        cargarUsuarios();
        } catch (error) { 
        const mensajeError = error.response?.data?.detail || "Error al procesar la solicitud";
        toast.error(typeof mensajeError === 'string' ? mensajeError : "Error de validación en los datos");
        console.error(error);
        }
    };

    // Activa el modo edición cargando los datos del usuario en los inputs
    const handleEdit = (usuario) => {
        setNuevoUsuario({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '', // Dejamos vacío ya que no modificaremos la contraseña aquí
        rol: usuario.rol,
        activo: usuario.activo
        });
        setUsuarioIdEditando(usuario.id);
        setMostrarForm(true);
    };

    // Lógica para eliminar con confirmación nativa del navegador
    const handleDelete = async (id) => {
        const confirmar = window.confirm("¿Seguro que deseas eliminar a este usuario del sistema?");
        if (confirmar) {
        try {
            await deleteUsuario(id);
            toast.success("Usuario eliminado");
            cargarUsuarios();
        } catch (error) {
            toast.error("No se pudo eliminar al usuario.");
            console.error(error);
        }
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
            <button 
            onClick={() => { if (mostrarForm) limpiarFormulario(); else setMostrarForm(true); }} 
            className={`${mostrarForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded transition`}
            >
            {mostrarForm ? "Cancelar" : "+ Nuevo Usuario"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
            <div className="col-span-2 mb-2">
                <h2 className="text-xl font-bold text-gray-700 border-b pb-2">
                {usuarioIdEditando ? 'Modificar Permisos de Usuario' : 'Registrar Nuevo Integrante'}
                </h2>
            </div>

            <input required placeholder="Nombre Completo" className="p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} />
            
            <input required type="email" placeholder="Email" className="p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} />
            
            {/* Ocultamos el campo de contraseña si estamos editando */}
            {!usuarioIdEditando ? (
                <input required type="password" placeholder="Contraseña" className="p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} />
            ) : (
                <div className="flex flex-col">
                <select required className="p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500"
                    value={nuevoUsuario.activo} onChange={e => setNuevoUsuario({...nuevoUsuario, activo: e.target.value === 'true'})}>
                    <option value="true">Estado: Activo / Habilitado</option>
                    <option value="false">Estado: Inactivo / Suspendido</option>
                </select>
                </div>
            )}
            
            <select required className="p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500"
                value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}>
                <option value="ADMIN">ADMIN</option>
                <option value="RECEPCION">RECEPCION</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            </select>

            <div className="col-span-2 flex justify-end mt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                {usuarioIdEditando ? 'Actualizar Usuario' : 'Guardar'}
                </button>
            </div>
            </form>
        )}

        <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-800 text-white">
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {usuarios.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.nombre}</td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{u.rol}</span>
                    </td>
                    <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.activo ? 'Activo' : 'Suspendido'}
                    </span>
                    </td>
                    <td className="p-3 text-center space-x-3">
                    <button 
                        onClick={() => handleEdit(u)}
                        className="text-blue-500 hover:text-blue-700 font-semibold transition"
                    >
                        Editar
                    </button>
                    <button 
                        onClick={() => handleDelete(u.id)}
                        className="text-red-500 hover:text-red-700 font-semibold transition"
                    >
                        Eliminar
                    </button>
                    </td>
                </tr>
                ))}
                {usuarios.length === 0 && (
                <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">No hay usuarios registrados.</td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    );
}