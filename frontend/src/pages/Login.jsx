import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';

const REDIRECT = {
  cliente:    '/cliente/catalogo',
  admin:      '/admin/inventario',
  superadmin: '/superadmin/usuarios',
};

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    setCargando(false);
    if (res.ok) {
      const { token, rol, nombre } = await res.json();
      localStorage.setItem('token',  token);
      localStorage.setItem('rol',    rol);
      localStorage.setItem('nombre', nombre);
      navigate(REDIRECT[rol] || '/');
    } else {
      const err = await res.json();
      setError(err.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-10 w-full max-w-md shadow-modal">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-tight mb-1">FasTech</h1>
          <p className="text-slate-400 text-sm">Sistema de Inventario</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="correo@fastech.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input-dark"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input-dark"
            />
          </div>

          {error && (
            <p className="text-danger-400 text-sm bg-danger-500/10 border border-danger-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="btn-primary mt-2"
          >
            {cargando ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
