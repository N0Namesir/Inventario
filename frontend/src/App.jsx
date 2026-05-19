import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Catalogo from './pages/cliente/Catalogo';
import MisOrdenes from './pages/cliente/MisOrdenes';
import Carrito from './pages/cliente/Carrito';
import Inventario from './pages/admin/Inventario';
import Pedidos from './pages/admin/Pedidos';
import Usuarios from './pages/superadmin/Usuarios';
import Reportes from './pages/superadmin/Reportes';
import { CarritoProvider } from './context/CarritoContext';

function RootRedirect() {
  const rol = localStorage.getItem('rol');
  if (rol === 'cliente')    return <Navigate to="/cliente/catalogo" />;
  if (rol === 'admin')      return <Navigate to="/admin/inventario" />;
  if (rol === 'superadmin') return <Navigate to="/superadmin/usuarios" />;
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <CarritoProvider>
      <Routes>
        <Route path="/"        element={<RootRedirect />} />
        <Route path="/login"   element={<Login />} />

        <Route path="/cliente/catalogo" element={
          <ProtectedRoute roles={['cliente']}>
            <Catalogo />
          </ProtectedRoute>
        } />
        <Route path="/cliente/ordenes" element={
          <ProtectedRoute roles={['cliente']}>
            <MisOrdenes />
          </ProtectedRoute>
        } />
        <Route path="/cliente/carrito" element={
          <ProtectedRoute roles={['cliente']}>
            <Carrito />
          </ProtectedRoute>
        } />

        <Route path="/admin/inventario" element={
          <ProtectedRoute roles={['admin', 'superadmin']}>
            <Inventario />
          </ProtectedRoute>
        } />
        <Route path="/admin/pedidos" element={
          <ProtectedRoute roles={['admin', 'superadmin']}>
            <Pedidos />
          </ProtectedRoute>
        } />

        <Route path="/superadmin/usuarios" element={
          <ProtectedRoute roles={['superadmin']}>
            <Usuarios />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/reportes" element={
          <ProtectedRoute roles={['superadmin']}>
            <Reportes />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </CarritoProvider>
    </BrowserRouter>
  );
}
