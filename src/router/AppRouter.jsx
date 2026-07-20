import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

import Layout from '../components/Layout';
import Login from '../pages/Login';
import Clientes from '../pages/Clientes';
import TiposHabitacion from '../pages/TiposHabitacion';
import Reservas from '../pages/Reservas';
import Habitaciones from '../pages/Habitaciones';
import Usuarios from '../pages/Usuarios';
import Mantenimientos from '../pages/Mantenimientos';
import Facturas from '../pages/Facturas';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/clientes" />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="tipos-habitacion" element={<TiposHabitacion />} />
          <Route path="reservas" element={<Reservas />} />
          <Route path="habitaciones" element={<Habitaciones />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="mantenimientos" element={<Mantenimientos />} />
          <Route path="facturas" element={<Facturas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}