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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f0f2f5', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'white', padding: '48px', borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '360px'
      }}>
        <h1 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>FasTech</h1>
        <p style={{ margin: '0 0 28px', color: '#666', fontSize: '14px' }}>
          Sistema de Inventario
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          />
          {error && <p style={{ color: 'red', margin: 0, fontSize: '13px' }}>{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            style={{
              background: cargando ? '#90caf9' : '#007bff', color: 'white',
              border: 'none', padding: '12px', cursor: 'pointer',
              borderRadius: '4px', fontSize: '15px'
            }}
          >
            {cargando ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
