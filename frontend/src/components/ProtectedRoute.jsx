import { Navigate } from 'react-router-dom';

function tokenValido(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const rol   = localStorage.getItem('rol');

  if (!token || !tokenValido(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    return <Navigate to="/login" />;
  }
  if (!roles.includes(rol)) return <Navigate to="/" />;

  return children;
}
