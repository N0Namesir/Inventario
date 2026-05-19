import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import { API } from '../../config';

const FORM_VACIO = { nombre: '', marca: '', precio: '', stock: '', descripcion: '', imagenFile: null, previewUrl: '', imagen_url_existente: '' };

export default function Inventario() {
  const [productos,  setProductos]  = useState([]);
  const [busqueda,   setBusqueda]   = useState('');
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState(FORM_VACIO);
  const [cargando,   setCargando]   = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState('');
  const fileRef = useRef();

  const token      = localStorage.getItem('token');
  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/productos`, { headers: authHeader })
      .then(r => r.json())
      .then(data => { setProductos(data); setCargando(false); });
  }, []);

  const abrirAgregar = () => { setForm(FORM_VACIO); setError(''); setModal('add'); };

  const abrirEditar = (p) => {
    setForm({
      nombre: p.nombre, marca: p.marca || '', precio: p.precio, stock: p.stock,
      descripcion: p.descripcion || '', imagenFile: null,
      previewUrl: p.imagen_url ? `${API}/uploads/${p.imagen_url}` : '',
      imagen_url_existente: p.imagen_url || ''
    });
    setError('');
    setModal(p);
  };

  const setField = campo => e => setForm(prev => ({ ...prev, [campo]: e.target.value }));

  const handleImagen = e => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, imagenFile: file, previewUrl: URL.createObjectURL(file) }));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('nombre',      form.nombre.trim());
    fd.append('marca',       form.marca.trim());
    fd.append('precio',      form.precio);
    fd.append('stock',       form.stock);
    fd.append('descripcion', form.descripcion.trim());
    if (form.imagenFile) fd.append('imagen', form.imagenFile);
    else if (form.imagen_url_existente) fd.append('imagen_url_existente', form.imagen_url_existente);
    return fd;
  };

  const guardar = async e => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const esEdicion = modal && modal !== 'add';
    const url    = esEdicion ? `${API}/productos/${modal.id}` : `${API}/productos`;
    const method = esEdicion ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: authHeader, body: buildFormData() });
    setGuardando(false);
    if (!res.ok) {
      try { const err = await res.json(); setError(err.error || 'Error al guardar'); }
      catch { setError(`Error del servidor (${res.status})`); }
      return;
    }
    const guardado = await res.json();
    setProductos(prev =>
      esEdicion ? prev.map(p => p.id === guardado.id ? guardado : p) : [...prev, guardado]
    );
    setModal(null);
  };

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    await fetch(`${API}/productos/${id}`, { method: 'DELETE', headers: authHeader });
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">

          {/* Cabecera */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-slate-100 m-0">Inventario de Productos</h2>
            <button
              onClick={abrirAgregar}
              className="bg-cyan-400 hover:bg-cyan-300 text-navy-950 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer border-none whitespace-nowrap"
            >
              + Nuevo producto
            </button>
          </div>

          {/* Barra búsqueda */}
          <div className="relative mb-6 max-w-md">
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

          {cargando && (
            <div className="flex items-center gap-2 text-slate-400 py-8">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Cargando productos...
            </div>
          )}

          {/* Tabla */}
          <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left w-16">Imagen</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Marca</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Descripción</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {filtrados.length === 0 && !cargando ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16 text-slate-500">
                        No se encontraron productos.
                      </td>
                    </tr>
                  ) : filtrados.map(p => (
                    <tr key={p.id} className="hover:bg-surface-700/50 transition-colors">
                      <td className="px-4 py-3">
                        {p.imagen_url
                          ? <img src={`${API}/uploads/${p.imagen_url}`} alt={p.nombre} className="w-12 h-12 object-cover rounded-lg" />
                          : <div className="w-12 h-12 bg-surface-700 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10"/></svg>
                            </div>
                        }
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-100">{p.nombre}</td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{p.marca || <span className="text-slate-600">—</span>}</td>
                      <td className="px-4 py-3 text-right text-cyan-400 font-semibold">${parseFloat(p.precio).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${p.stock === 0 ? 'text-danger-400' : p.stock <= 3 ? 'text-warning-400' : 'text-slate-300'}`}>
                        {p.stock}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-xs hidden lg:table-cell">
                        {p.descripcion
                          ? <span title={p.descripcion}>{p.descripcion.slice(0, 60)}{p.descripcion.length > 60 ? '…' : ''}</span>
                          : <span className="text-slate-600">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 border border-warning-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminar(p.id, p.nombre)}
                            className="bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 border border-danger-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-slate-600 text-xs mt-3">
            {filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}{busqueda ? ` para "${busqueda}"` : ''}
          </p>
        </div>
      </main>

      {/* Modal agregar / editar */}
      {modal && (
        <Modal title={modal === 'add' ? 'Agregar producto' : `Editar: ${modal.nombre}`} onClose={() => setModal(null)}>
          <form onSubmit={guardar} className="flex flex-col gap-5">

            {/* Nombre + Marca */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre *</label>
                <input value={form.nombre} onChange={setField('nombre')} required className="input-dark" placeholder="Ej: Laptop HP Pavilion" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Marca</label>
                <input value={form.marca} onChange={setField('marca')} className="input-dark" placeholder="Ej: HP" />
              </div>
            </div>

            {/* Precio + Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio *</label>
                <input type="number" min="0" step="0.01" value={form.precio} onChange={setField('precio')} required className="input-dark" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock *</label>
                <input type="number" min="0" value={form.stock} onChange={setField('stock')} required className="input-dark" placeholder="0" />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={setField('descripcion')}
                rows="3"
                placeholder="Características, beneficios, por qué comprarlo..."
                className="input-dark resize-none"
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Imagen del producto</label>
              <div className="flex items-center gap-4">
                {form.previewUrl
                  ? <img src={form.previewUrl} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-surface-600" />
                  : <div className="w-16 h-16 bg-surface-700 rounded-lg flex items-center justify-center border border-dashed border-surface-600">
                      <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                }
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    className="border border-surface-600 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer bg-surface-700"
                  >
                    {form.previewUrl ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </button>
                  {form.previewUrl && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, imagenFile: null, previewUrl: '', imagen_url_existente: '' }))}
                      className="text-danger-400 hover:text-danger-300 text-xs bg-transparent border-none cursor-pointer text-left"
                    >
                      Quitar imagen
                    </button>
                  )}
                  <p className="text-slate-600 text-[11px] m-0">JPG, PNG, WEBP — máx. 5 MB</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImagen} className="hidden" />
              </div>
            </div>

            {error && (
              <p className="text-danger-400 text-xs bg-danger-500/10 border border-danger-500/30 rounded-lg px-3 py-2 m-0">
                {error}
              </p>
            )}

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-3 border-t border-surface-700">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="border border-surface-600 text-slate-400 hover:text-slate-200 hover:border-surface-500 px-5 py-2 rounded-lg text-sm transition-colors cursor-pointer bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="bg-cyan-400 hover:bg-cyan-300 text-navy-950 font-semibold px-6 py-2 rounded-lg text-sm transition-colors cursor-pointer border-none disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
