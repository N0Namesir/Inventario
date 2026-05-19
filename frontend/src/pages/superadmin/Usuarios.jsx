import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { API } from '../../config';

const badgeRol = {
  superadmin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  admin:      'bg-cyan-400/10   text-cyan-400   border-cyan-400/30',
  cliente:    'bg-success-500/10 text-success-500 border-success-500/30',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const token   = localStorage.getItem('token');
  const miId    = JSON.parse(atob(token.split('.')[1])).id;
  const headers = { Authorization: `Bearer ${token}` };

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
      <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">Gestión de Usuarios</h2>

          {error && (
            <p className="text-danger-400 text-sm bg-danger-500/10 border border-danger-500/30 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {cargando && (
            <div className="flex items-center gap-2 text-slate-400 py-8">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Cargando usuarios...
            </div>
          )}

          <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 text-left w-12">ID</th>
                    <th className="px-5 py-3 text-left">Nombre</th>
                    <th className="px-5 py-3 text-left hidden sm:table-cell">Email</th>
                    <th className="px-5 py-3 text-left">Rol</th>
                    <th className="px-5 py-3 text-left hidden md:table-cell">Creado</th>
                    <th className="px-5 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {usuarios.map(u => (
                    <tr
                      key={u.id}
                      className={`transition-colors ${u.id === miId ? 'bg-cyan-400/5' : 'hover:bg-surface-700/50'}`}
                    >
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">{u.id}</td>
                      <td className="px-5 py-3 text-slate-100 font-medium">
                        {u.nombre}
                        {u.id === miId && (
                          <span className="ml-2 text-[10px] text-cyan-400/70 font-normal">(tú)</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-400 hidden sm:table-cell">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`badge-estado ${badgeRol[u.rol] || 'bg-surface-700 text-slate-400 border-surface-600'}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {u.id !== miId ? (
                          <button
                            onClick={() => eliminar(u.id, u.nombre)}
                            className="bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 border border-danger-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-slate-600 text-xs mt-3">
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
      </main>
    </>
  );
}
