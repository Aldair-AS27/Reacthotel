import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { Toaster } from 'react-hot-toast'; // <-- IMPORTANTE

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} /> {/* <-- Notificaciones globales */}
      <AppRouter />
    </AuthProvider>
  );
}

export default App;