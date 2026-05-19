import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { API } from '../../config';

const badgeEstado = {
  pendiente:  'bg-warning-500/10 text-warning-400 border-warning-500/30',
  completada: 'bg-success-500/10 text-success-500 border-success-500/30',
  cancelada:  'bg-danger-500/10  text-danger-400  border-danger-500/30',
};

export default function MisOrdenes() {
  const [ordenes,  setOrdenes]  = useState([]);
  const [cargando, setCargando] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/ordenes/mis-ordenes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setOrdenes(data); setCargando(false); });
  }, []);

  if (cargando) return (
    <>
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-navy-800">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Cargando tus órdenes...
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">Mis Órdenes</h2>

          {ordenes.length === 0 ? (
            <div className="bg-surface-800 border border-surface-700 rounded-xl p-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-slate-400 text-sm">
                Aún no tienes órdenes. ¡Ve al catálogo y realiza tu primera compra!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {ordenes.map(orden => {
                const clases = badgeEstado[orden.estado] || badgeEstado.pendiente;
                return (
                  <div key={orden.id} className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
                    {/* Cabecera */}
                    <div className="bg-surface-700 px-5 py-3 flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-100 text-sm">Orden #{orden.id}</span>
                        <span className="text-slate-500 text-xs">
                          {new Date(orden.created_at).toLocaleString('es-MX', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-100">${parseFloat(orden.total).toFixed(2)}</span>
                        <span className={`badge-estado ${clases}`}>
                          {orden.estado.toUpperCase()}
                        </span>
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
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
