import { Navigate } from 'react-router-dom';

function parseToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

export default function ProtectedRoute({ children, roles }) {
  const token   = localStorage.getItem('token');
  const payload = token ? parseToken(token) : null;

  if (!payload || payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    return <Navigate to="/login" />;
  }
  if (!roles.includes(payload.rol)) return <Navigate to="/" />;

  return children;
}
