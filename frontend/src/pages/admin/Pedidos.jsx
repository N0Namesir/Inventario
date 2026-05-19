import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { API } from '../../config';

const badgeEstado = {
  pendiente:  'bg-warning-500/10 text-warning-400 border-warning-500/30',
  completada: 'bg-success-500/10 text-success-500 border-success-500/30',
  cancelada:  'bg-danger-500/10  text-danger-400  border-danger-500/30',
};

const STATS = [
  { key: 'total',       label: 'Total',       colorNum: 'text-cyan-400',    colorBorder: 'border-cyan-400/40'    },
  { key: 'pendientes',  label: 'Pendientes',  colorNum: 'text-warning-400', colorBorder: 'border-warning-500/40' },
  { key: 'completadas', label: 'Completadas', colorNum: 'text-success-500', colorBorder: 'border-success-500/40' },
  { key: 'canceladas',  label: 'Canceladas',  colorNum: 'text-danger-400',  colorBorder: 'border-danger-500/40'  },
];

export default function Pedidos() {
  const [ordenes,  setOrdenes]  = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/ordenes`, { headers })
      .then(r => r.json())
      .then(data => { setOrdenes(data); setCargando(false); });
  }, []);

  const cambiarEstado = async (ordenId, nuevoEstado) => {
    setError('');
    const res = await fetch(`${API}/ordenes/${ordenId}/estado`, {
      method: 'PUT', headers,
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      setOrdenes(prev => prev.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o));
    } else {
      const err = await res.json();
      setError(err.error || 'Error al actualizar');
    }
  };

  const resumen = {
    total:       ordenes.length,
    pendientes:  ordenes.filter(o => o.estado === 'pendiente').length,
    completadas: ordenes.filter(o => o.estado === 'completada').length,
    canceladas:  ordenes.filter(o => o.estado === 'cancelada').length,
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">Gestión de Pedidos</h2>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map(s => (
              <div key={s.key} className={`bg-surface-800 border ${s.colorBorder} rounded-xl px-5 py-4 text-center`}>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1 m-0">{s.label}</p>
                <p className={`text-3xl font-bold m-0 ${s.colorNum}`}>{resumen[s.key]}</p>
              </div>
            ))}
          </div>

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
              Cargando pedidos...
            </div>
          )}

          {ordenes.length === 0 && !cargando && (
            <div className="bg-surface-800 border border-surface-700 rounded-xl p-16 text-center text-slate-500 text-sm">
              Aún no hay pedidos registrados.
            </div>
          )}

          <div className="flex flex-col gap-4">
            {ordenes.map(orden => (
              <div key={orden.id} className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
                {/* Cabecera */}
                <div className="bg-surface-700 px-5 py-3 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-semibold text-slate-100 text-sm">Orden #{orden.id}</span>
                    <span className="text-slate-300 text-sm flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {orden.cliente_nombre}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(orden.created_at).toLocaleString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100">${parseFloat(orden.total).toFixed(2)}</span>
                    <span className={`badge-estado ${badgeEstado[orden.estado] || badgeEstado.pendiente}`}>
                      {orden.estado.toUpperCase()}
                    </span>
                    {orden.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => cambiarEstado(orden.id, 'completada')}
                          className="bg-success-500/10 hover:bg-success-500/20 text-success-500 border border-success-500/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => cambiarEstado(orden.id, 'cancelada')}
                          className="bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 border border-danger-500/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 py-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-700 text-slate-500 text-xs">
                        <th className="text-left pb-2 font-medium">Producto</th>
                        <th className="text-right pb-2 font-medium">Cant.</th>
                        <th className="text-right pb-2 font-medium hidden sm:table-cell">Precio unit.</th>
                        <th className="text-right pb-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-700">
                      {orden.items.map((item, i) => (
                        <tr key={i} className="text-slate-300">
                          <td className="py-2 pr-4">{item.nombre_producto}</td>
                          <td className="py-2 text-right">{item.cantidad}</td>
                          <td className="py-2 text-right text-slate-400 hidden sm:table-cell">
                            ${parseFloat(item.precio_unitario).toFixed(2)}
                          </td>
                          <td className="py-2 text-right font-medium">
                            ${(item.cantidad * item.precio_unitario).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
