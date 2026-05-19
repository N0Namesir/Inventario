import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { API } from '../../config';
import { FILTROS_VACIOS, filtrarProductos } from '../../utils/filtrarProductos';

function StatCard({ titulo, valor, colorNum, colorBorder, icon }) {
  return (
    <div className={`bg-surface-800 border ${colorBorder} rounded-xl px-5 py-5`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-500 text-xs uppercase tracking-wide m-0">{titulo}</p>
        <div className={colorNum}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold m-0 ${colorNum} truncate`}>{valor}</p>
    </div>
  );
}

export default function Reportes() {
  const [productos, setProductos] = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [tags,    setTags]    = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  const token = localStorage.getItem('token');

  useEffect(() => {
    setCargando(true);
    Promise.all([
      fetch(`${API}/productos`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/tags`,      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([prods, tgs]) => {
      setProductos(prods);
      setTags(tgs);
      setCargando(false);
    });
  }, []);

  const marcasDisponibles = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();
  const filtrados         = filtrarProductos(productos, filtros);
  const hayFiltros        = filtros.tagIds.length > 0 || filtros.marcas.length > 0 ||
                            filtros.precioMin !== '' || filtros.precioMax !== '';

  const totalProductos  = filtrados.length;
  const valorInventario = filtrados.reduce((s, p) => s + p.precio * p.stock, 0);
  const sinStock        = filtrados.filter(p => p.stock === 0).length;
  const masStock        = filtrados.reduce((max, p) => p.stock > (max?.stock ?? -1) ? p : max, null);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">Reportes del Sistema</h2>

          {/* Barra de filtros horizontal */}
          <div className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 mb-6 flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Tag</p>
              <select
                value={filtros.tagIds[0] || ''}
                onChange={e => setFiltros(f => ({ ...f, tagIds: e.target.value ? [parseInt(e.target.value)] : [] }))}
                className="input-dark text-sm py-1.5 w-40"
              >
                <option value="">Todos</option>
                {tags.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Marca</p>
              <select
                value={filtros.marcas[0] || ''}
                onChange={e => setFiltros(f => ({ ...f, marcas: e.target.value ? [e.target.value] : [] }))}
                className="input-dark text-sm py-1.5 w-40"
              >
                <option value="">Todas</option>
                {marcasDisponibles.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Precio</p>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Mín"
                  value={filtros.precioMin}
                  onChange={e => setFiltros(f => ({ ...f, precioMin: e.target.value }))}
                  className="input-dark text-sm py-1.5 w-24"
                />
                <span className="text-slate-600 text-xs">—</span>
                <input
                  type="number" min="0" placeholder="Máx"
                  value={filtros.precioMax}
                  onChange={e => setFiltros(f => ({ ...f, precioMax: e.target.value }))}
                  className="input-dark text-sm py-1.5 w-24"
                />
              </div>
            </div>
            {hayFiltros && (
              <button
                onClick={() => setFiltros(FILTROS_VACIOS)}
                className="text-xs text-cyan-400 hover:text-cyan-300 bg-transparent border-none cursor-pointer self-end pb-1.5"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {cargando && (
            <div className="flex items-center gap-2 text-slate-400 py-8">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Cargando datos...
            </div>
          )}

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              titulo="Total productos"
              valor={totalProductos}
              colorNum="text-cyan-400"
              colorBorder="border-cyan-400/30"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10" /></svg>}
            />
            <StatCard
              titulo="Valor inventario"
              valor={`$${valorInventario.toFixed(2)}`}
              colorNum="text-success-500"
              colorBorder="border-success-500/30"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>}
            />
            <StatCard
              titulo="Sin stock"
              valor={sinStock}
              colorNum={sinStock > 0 ? 'text-danger-400' : 'text-slate-400'}
              colorBorder={sinStock > 0 ? 'border-danger-500/30' : 'border-surface-600'}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
            />
            <StatCard
              titulo="Más stock"
              valor={masStock ? `${masStock.nombre.slice(0, 16)}${masStock.nombre.length > 16 ? '…' : ''} (${masStock.stock})` : '—'}
              colorNum="text-purple-400"
              colorBorder="border-purple-500/30"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
            />
          </div>

          {/* Tabla de productos */}
          <h3 className="text-base font-semibold text-slate-300 mb-3">Todos los productos</h3>
          <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Producto</th>
                    <th className="px-5 py-3 text-right">Precio</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Valor en inventario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {filtrados.map(p => (
                    <tr
                      key={p.id}
                      className={`transition-colors ${p.stock === 0 ? 'bg-danger-500/5' : 'hover:bg-surface-700/50'}`}
                    >
                      <td className={`px-5 py-3 font-medium ${p.stock === 0 ? 'text-slate-400' : 'text-slate-100'}`}>
                        {p.nombre}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-300">${parseFloat(p.precio).toFixed(2)}</td>
                      <td className={`px-5 py-3 text-right font-medium ${p.stock === 0 ? 'text-danger-400' : p.stock <= 3 ? 'text-warning-400' : 'text-slate-300'}`}>
                        {p.stock === 0 ? 'Sin stock' : `${p.stock} uds.`}
                      </td>
                      <td className="px-5 py-3 text-right text-cyan-400 font-semibold">
                        ${(p.precio * p.stock).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && !cargando && (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-slate-500">Sin productos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-slate-600 text-xs mt-3">
            {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
            {hayFiltros ? ' (filtrados)' : ''} · {sinStock} sin stock
          </p>
        </div>
      </main>
    </>
  );
}
