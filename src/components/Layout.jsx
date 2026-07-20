import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Layout() {
    const { logout } = useContext(AuthContext);

    // Lista de enlaces dinámicos basada en tu API
    const menuItems = [
        { path: '/clientes', label: 'Clientes', icon: '👥' },
        { path: '/usuarios', label: 'Usuarios', icon: '👤' },
        { path: '/tipos-habitacion', label: 'Tipos de Habitación', icon: '🏷️' },
        { path: '/habitaciones', label: 'Habitaciones', icon: '🚪' },
        { path: '/reservas', label: 'Reservas', icon: '📅' },
        { path: '/facturas', label: 'Facturas', icon: '🧾' },
        { path: '/mantenimientos', label: 'Mantenimiento', icon: '🛠️' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col">
            <div className="p-6 text-2xl font-bold border-b border-gray-800 text-center">
            🏨 Hotel Admin
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
                <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                    `block p-3 rounded transition-colors ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
                    }`
                }
                >
                <span className="mr-3">{item.icon}</span>
                {item.label}
                </NavLink>
            ))}
            </nav>
            <div className="p-4 border-t border-gray-800">
            <button 
                onClick={logout} 
                className="w-full text-left p-3 text-red-400 hover:bg-gray-800 rounded transition-colors"
            >
                🚪 Cerrar Sesión
            </button>
            </div>
        </aside>

        {/* Contenido Principal (Aquí se inyectan las páginas) */}
        <main className="flex-1 overflow-y-auto">
            <Outlet /> 
        </main>
        </div>
    );
}