import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Layout() {
    const { logout } = useContext(AuthContext);

    const menuItems = [
        { path: '/clientes', label: 'Clientes', icon: '👥' },
        { path: '/usuarios', label: 'Usuarios', icon: '👤' },
        { path: '/tipos-habitacion', label: 'Tipos', icon: '🏷️' },
        { path: '/habitaciones', label: 'Habitaciones', icon: '🚪' },
        { path: '/reservas', label: 'Reservas', icon: '📅' },
        { path: '/facturas', label: 'Facturas', icon: '🧾' },
        { path: '/mantenimientos', label: 'Mantenimiento', icon: '🛠️' },
    ];

    return (
        <div 
        className="flex h-screen font-sans antialiased bg-cover bg-center bg-fixed relative"
        // Imagen de fondo: un interior de hotel elegante y cálido
        style={{ backgroundImage: "url('https://c4.wallpaperflare.com/wallpaper/286/992/948/dubai-night-photo-taken-from-the-palm-island-jumeirah-united-arab-emirates-hd-desktop-wallpaper-for-your-computer-3840%C3%972400-wallpaper-preview.jpg')" }}
        >
        {/* Capa superpuesta crema para suavizar la imagen y mejorar la lectura */}
        <div className="absolute inset-0 bg-stone-100/30 backdrop-blur-[2px] z-0"></div>

        {/* Sidebar - Efecto Cristal (Glassmorphism) */}
        <aside className="w-64 bg-white/50 backdrop-blur-xl border-r border-white/60 text-stone-800 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-10 relative">
            <div className="h-20 flex items-center justify-center border-b border-white/50">
            <span className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2 drop-shadow-sm">
                <span className="text-3xl">🏨</span> 
                Hotel Admin
            </span>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 drop-shadow-sm">Menú Principal</p>
            {menuItems.map((item) => (
                <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                    isActive 
                        ? 'bg-amber-700/90 text-white shadow-lg shadow-amber-900/20 backdrop-blur-md' 
                        : 'text-stone-700 hover:bg-white/60 hover:text-stone-900 hover:shadow-sm'
                    }`
                }
                >
                <span className="text-lg drop-shadow-sm">{item.icon}</span>
                {item.label}
                </NavLink>
            ))}
            </nav>

            <div className="p-4 border-t border-white/50">
            <button 
                onClick={logout} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-700 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 border border-red-100/50"
            >
                <span>🚪</span> Cerrar Sesión
            </button>
            </div>
        </aside>

        {/* Contenedor Principal (Transparente para dejar ver el fondo) */}
        <main className="flex-1 overflow-y-auto relative z-10">
            <Outlet /> 
        </main>
        </div>
    );
}