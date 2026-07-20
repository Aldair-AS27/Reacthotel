import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/'); // Redirige al inicio si es exitoso
    else alert('Credenciales incorrectas');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Hotel Admin</h2>
        <input 
          type="email" placeholder="Email" required
          className="w-full mb-4 p-2 border rounded"
          value={email} onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Contraseña" required
          className="w-full mb-6 p-2 border rounded"
          value={password} onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Ingresar
        </button>
      </form>
    </div>
  );
}