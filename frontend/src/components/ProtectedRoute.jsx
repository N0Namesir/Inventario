import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const rol   = localStorage.getItem('rol');

  if (!token) return <Navigate to="/login" />;
  if (!roles.includes(rol)) return <Navigate to="/" />;

  return children;
}
