import { useEffect, useState } from 'react';
import { getUsuarios, createUsuario } from '../api/services';
import toast from 'react-hot-toast';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', password: '', rol: 'RECEPCION' });

    useEffect(() => { cargarUsuarios(); }, []);

    const cargarUsuarios = async () => {
        try {
        const res = await getUsuarios();
        setUsuarios(res.data);
        } catch (error) { toast.error("Error al cargar usuarios"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        await createUsuario(nuevoUsuario);
        toast.success("Usuario creado");
        setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'RECEPCION' });
        setMostrarForm(false);
        cargarUsuarios();
        } catch (error) { toast.error("Error al crear usuario"); }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
            <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-green-600 text-white px-4 py-2 rounded">
            {mostrarForm ? "Cancelar" : "+ Nuevo Usuario"}
            </button>
        </div>

        {mostrarForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
            <input required placeholder="Nombre Completo" className="p-2 border rounded" 
                value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} />
            <input required type="email" placeholder="Email" className="p-2 border rounded" 
                value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} />
            <input required type="password" placeholder="Contraseña" className="p-2 border rounded" 
                value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} />
            <select required className="p-2 border rounded bg-white"
                value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}>
                <option value="ADMIN">ADMIN</option>
                <option value="RECEPCION">RECEPCION</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            </select>
            <div className="col-span-2 flex justify-end"><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Guardar</button></div>
            </form>
        )}

        <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-800 text-white">
                <th className="p-3">Nombre</th><th className="p-3">Email</th><th className="p-3">Rol</th>
                </tr>
            </thead>
            <tbody>
                {usuarios.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{u.nombre}</td><td className="p-3">{u.email}</td>
                    <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{u.rol}</span></td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    );
}