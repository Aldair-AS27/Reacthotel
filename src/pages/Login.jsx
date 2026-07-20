import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(email, password);
    
    if (success) {
      toast.success('¡Bienvenido al sistema!');
      navigate('/');
    } else {
      toast.error('Credenciales incorrectas. Intenta nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      // Imagen de alta calidad de Unsplash de un hotel/resort
      style={{ backgroundImage: "url('https://img.magnific.com/foto-gratis/hermosas-piscinas-al-aire-libre-lujo-hoteles-resorts_74190-7433.jpg?semt=ais_hybrid&w=740&q=80')" }}
    >
      {/* Overlay oscuro con desenfoque para darle elegancia y resaltar el formulario */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Contenedor del formulario (Efecto Vidrio / Glassmorphism) */}
      <div className="relative z-10 w-full max-w-md p-10 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl mx-4">
        
        {/* Cabecera amigable */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🏨</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Hola de nuevo!</h2>
          <p className="text-gray-600 font-medium">Ingresa a tu panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              required
              placeholder="ejemplo@hotel.com"
              className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Contraseña
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button 
            disabled={isLoading}
            className="w-full flex justify-center py-4 px-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Sistema de Gestión Hotelera © 2026
          </p>
        </div>
      </div>
    </div>
  );
}