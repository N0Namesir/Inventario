import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';

const API = 'http://localhost:5000';

const colorRol = { superadmin: '#6f42c1', admin: '#007bff', cliente: '#28a745' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const token    = localStorage.getItem('token');
  const miId     = JSON.parse(atob(token.split('.')[1])).id;
  const headers  = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/usuarios`, { headers })
      .then(r => r.json())
      .then(data => { setUsuarios(data); setCargando(false); });
  }, []);

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar al usuario "${nombre}"?`)) return;
    const res = await fetch(`${API}/usuarios/${id}`, { method: 'DELETE', headers });
    if (res.ok) {
      setUsuarios(prev => prev.filter(u => u.id !== id));
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: 'auto' }}>
        <h2>Gestión de Usuarios</h2>

        {error    && <p style={{ color: 'red'  }}>{error}</p>}
        {cargando && <p style={{ color: '#666' }}>Cargando...</p>}

        <table border="1" cellPadding="12" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Creado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} style={{ background: u.id === miId ? '#f0f8ff' : 'white' }}>
                <td>{u.id}</td>
                <td>{u.nombre} {u.id === miId && <em style={{ color: '#999', fontSize: '12px' }}>(tú)</em>}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{
                    background: colorRol[u.rol] || '#999', color: 'white',
                    padding: '2px 10px', borderRadius: '12px', fontSize: '12px'
                  }}>
                    {u.rol}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: '#666' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td>
                  {u.id !== miId && (
                    <button onClick={() => eliminar(u.id, u.nombre)} style={{
                      background: '#dc3545', color: 'white', border: 'none',
                      padding: '4px 10px', cursor: 'pointer', borderRadius: '4px'
                    }}>
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: '12px', color: '#666', fontSize: '13px' }}>
          Total: {usuarios.length} usuarios registrados.
        </p>
      </div>
    </>
  );
}
