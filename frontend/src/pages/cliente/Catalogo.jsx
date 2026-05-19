import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import { useCarrito } from '../../context/CarritoContext';
import { API } from '../../config';
import FilterSidebar from '../../components/FilterSidebar';
import { FILTROS_VACIOS, filtrarProductos } from '../../utils/filtrarProductos';

function StockBadge({ disponible, enCarrito }) {
  if (disponible === 0)
    return <span className="text-danger-400 text-xs font-medium">Sin stock</span>;
  if (disponible <= 3)
    return (
      <span className="text-warning-400 text-xs font-medium">
        ¡Solo {disponible} disponibles!
        {enCarrito > 0 && <span className="text-slate-500"> · {enCarrito} en carrito</span>}
      </span>
    );
  return (
    <span className="text-slate-500 text-xs">
      {disponible} disponibles
      {enCarrito > 0 && <span> · {enCarrito} en carrito</span>}
    </span>
  );
}

function ProductImage({ url, nombre, size = 'card' }) {
  const cls = size === 'card'
    ? 'w-full h-44 object-cover'
    : 'w-full h-full object-cover';
  return url
    ? <img src={`${API}/uploads/${url}`} alt={nombre} className={cls} />
    : (
      <div className="w-full h-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      </div>
    );
}

export default function Catalogo() {
  const [productos,       setProductos]       = useState([]);
  const [busqueda,        setBusqueda]        = useState('');
  const [cargando,        setCargando]        = useState(false);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [toast,           setToast]           = useState({ texto: '', tipo: '' });
  const [tags,    setTags]    = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const { carrito, agregarAlCarrito } = useCarrito();
  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    setCargando(true);
    const h = { headers };
    Promise.all([
      fetch(`${API}/productos`, h).then(r => r.json()),
      fetch(`${API}/tags`,      h).then(r => r.json()),
    ]).then(([prods, tgs]) => {
      setProductos(prods);
      setTags(tgs);
      setCargando(false);
    });
  }, []);

  const mostrarToast = (texto, tipo = 'success') => {
    setToast({ texto, tipo });
    setTimeout(() => setToast({ texto: '', tipo: '' }), 3000);
  };

  const handleAgregar = (producto, cerrarModal = false) => {
    const ok = agregarAlCarrito(producto);
    if (!ok) mostrarToast(`Sin más stock de "${producto.nombre}"`, 'error');
    else     mostrarToast(`"${producto.nombre}" agregado`);
    if (cerrarModal) setProductoDetalle(null);
  };

  const marcasDisponibles = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();
  const filtrados = filtrarProductos(productos, filtros, busqueda);
  const limpiarFiltros = () => setFiltros(FILTROS_VACIOS);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">Catálogo de Productos</h2>

          {/* Barra de búsqueda + botón filtros mobile */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                placeholder="Buscar por nombre o marca..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-dark pl-10"
              />
            </div>
            <button
              onClick={() => setSidebarAbierto(v => !v)}
              className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer
                ${sidebarAbierto
                  ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300'
                  : 'bg-surface-800 border-surface-700 text-slate-400 hover:text-slate-200'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
              </svg>
              Filtros
            </button>
          </div>

          <div className="flex gap-6 items-start">
            {/* Sidebar */}
            <div className={`${sidebarAbierto ? 'block' : 'hidden'} lg:block`}>
              <FilterSidebar
                tags={tags}
                marcas={marcasDisponibles}
                filtros={filtros}
                onChange={setFiltros}
                onLimpiar={limpiarFiltros}
              />
            </div>

            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
              {cargando && (
                <div className="flex items-center gap-2 text-slate-400 py-12">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Cargando productos...
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtrados.map(p => {
                  const enCarrito  = carrito.find(i => i.id === p.id)?.cantidad || 0;
                  const disponible = p.stock - enCarrito;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setProductoDetalle(p)}
                      className={`bg-surface-800 border border-surface-700 rounded-xl overflow-hidden cursor-pointer
                        hover:border-surface-600 hover:-translate-y-0.5 hover:shadow-card-hover
                        transition-all duration-200 flex flex-col
                        ${disponible === 0 ? 'opacity-60' : ''}`}
                    >
                      <div className="h-44 bg-surface-700 overflow-hidden flex items-center justify-center">
                        <ProductImage url={p.imagen_url} nombre={p.nombre} size="card" />
                      </div>
                      <div className="p-4 flex flex-col gap-1.5 flex-1">
                        {p.marca && (
                          <span className="text-[11px] text-slate-500 uppercase tracking-wide">{p.marca}</span>
                        )}
                        <h3 className="text-sm font-semibold text-slate-100 leading-snug m-0">{p.nombre}</h3>
                        {p.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.tags.map(t => (
                              <span key={t.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-700 text-slate-400 border border-surface-600">
                                {t.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.descripcion && (
                          <p className="text-xs text-slate-400 leading-relaxed m-0 line-clamp-2">{p.descripcion}</p>
                        )}
                        <p className="text-xl font-bold text-cyan-400 mt-1 mb-0">${parseFloat(p.precio).toFixed(2)}</p>
                        <StockBadge disponible={disponible} enCarrito={enCarrito} />
                      </div>
                      <div className="px-4 pb-4">
                        <button
                          onClick={e => { e.stopPropagation(); handleAgregar(p); }}
                          disabled={disponible === 0}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none
                            ${disponible === 0
                              ? 'bg-surface-700 text-slate-500 cursor-not-allowed'
                              : 'bg-success-500 hover:bg-success-600 text-white'}`}
                        >
                          {disponible === 0 ? 'Sin stock' : '+ Agregar al carrito'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtrados.length === 0 && !cargando && (
                <div className="text-center py-20 text-slate-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">Sin resultados para los filtros actuales.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal detalle */}
      {productoDetalle && (() => {
        const p         = productoDetalle;
        const enCarrito = carrito.find(i => i.id === p.id)?.cantidad || 0;
        const disp      = p.stock - enCarrito;
        return (
          <Modal title="" onClose={() => setProductoDetalle(null)}>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-48 h-48 flex-shrink-0 bg-surface-700 rounded-xl overflow-hidden flex items-center justify-center">
                <ProductImage url={p.imagen_url} nombre={p.nombre} size="modal" />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {p.marca && (
                  <span className="text-xs text-slate-500 uppercase tracking-wide">{p.marca}</span>
                )}
                <h2 className="m-0 text-xl font-semibold text-slate-100">{p.nombre}</h2>
                <p className="m-0 text-3xl font-bold text-cyan-400">${parseFloat(p.precio).toFixed(2)}</p>
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map(t => (
                      <span key={t.id} className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-700 text-slate-400 border border-surface-600">
                        {t.nombre}
                      </span>
                    ))}
                  </div>
                )}
                <StockBadge disponible={disp} enCarrito={enCarrito} />
              </div>
            </div>
            {p.descripcion && (
              <div className="mt-5 p-4 bg-surface-700 rounded-lg border-l-4 border-cyan-400/60">
                <p className="m-0 text-sm text-slate-300 leading-relaxed">{p.descripcion}</p>
              </div>
            )}
            <button
              onClick={() => handleAgregar(p, true)}
              disabled={disp === 0}
              className={`mt-5 w-full py-3 rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer
                ${disp === 0
                  ? 'bg-surface-700 text-slate-500 cursor-not-allowed'
                  : 'bg-success-500 hover:bg-success-600 text-white'}`}
            >
              {disp === 0 ? 'Sin stock' : '+ Agregar al carrito'}
            </button>
          </Modal>
        );
      })()}

      {/* Toast */}
      {toast.texto && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border
          ${toast.tipo === 'error'
            ? 'bg-danger-500/10 border-danger-500/40 text-danger-400'
            : 'bg-success-500/10 border-success-500/40 text-success-500'}`}
        >
          {toast.texto}
        </div>
      )}
    </>
  );
}
