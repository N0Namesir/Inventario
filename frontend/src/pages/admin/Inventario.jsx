import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';

const API = 'http://localhost:5000';

const FORM_VACIO = { nombre: '', marca: '', precio: '', stock: '', descripcion: '', imagenFile: null, previewUrl: '', imagen_url_existente: '' };

const inputStyle = {
  display: 'block', width: '100%', padding: '9px 12px', boxSizing: 'border-box',
  border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', marginTop: '5px'
};

const labelStyle = { fontSize: '13px', color: '#555', fontWeight: '500' };

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda]   = useState('');
  const [modal,    setModal]      = useState(null); // null | 'add' | producto
  const [form,     setForm]       = useState(FORM_VACIO);
  const [cargando,  setCargando]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');
  const fileRef = useRef();

  const token      = localStorage.getItem('token');
  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/productos`, { headers: authHeader })
      .then(r => r.json())
      .then(data => { setProductos(data); setCargando(false); });
  }, []);

  const abrirAgregar = () => {
    setForm(FORM_VACIO);
    setError('');
    setModal('add');
  };

  const abrirEditar = (p) => {
    setForm({
      nombre:               p.nombre,
      marca:                p.marca        || '',
      precio:               p.precio,
      stock:                p.stock,
      descripcion:          p.descripcion  || '',
      imagenFile:           null,
      previewUrl:           p.imagen_url ? `${API}/uploads/${p.imagen_url}` : '',
      imagen_url_existente: p.imagen_url   || ''
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
    if (form.imagenFile) {
      fd.append('imagen', form.imagenFile);
    } else if (form.imagen_url_existente) {
      fd.append('imagen_url_existente', form.imagen_url_existente);
    }
    return fd;
  };

  const guardar = async e => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const esEdicion = modal && modal !== 'add';
    const url    = esEdicion ? `${API}/productos/${modal.id}` : `${API}/productos`;
    const method = esEdicion ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers: authHeader, body: buildFormData() });
    setGuardando(false);

    if (!res.ok) {
      try {
        const err = await res.json();
        setError(err.error || 'Error al guardar');
      } catch {
        setError(`Error del servidor (${res.status}). Revisa la consola del backend.`);
      }
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
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '960px', margin: 'auto' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Inventario de Productos</h2>
          <button onClick={abrirAgregar} style={{
            background: '#007bff', color: 'white', border: 'none',
            padding: '10px 22px', cursor: 'pointer', borderRadius: '6px', fontWeight: '600'
          }}>
            + Nuevo producto
          </button>
        </div>

        {/* Barra de búsqueda */}
        <input
          placeholder="Buscar por nombre o marca..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ ...inputStyle, marginBottom: '20px', padding: '11px 14px' }}
        />

        {cargando && <p style={{ color: '#888' }}>Cargando...</p>}

        {/* Tabla */}
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: '#f1f3f5' }}>
            <tr>
              <th style={{ width: '64px' }}>Imagen</th>
              <th style={{ textAlign: 'left' }}>Nombre</th>
              <th style={{ textAlign: 'left' }}>Marca</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && !cargando ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                  No se encontraron productos.
                </td>
              </tr>
            ) : filtrados.map(p => (
              <tr key={p.id}>
                <td style={{ textAlign: 'center' }}>
                  {p.imagen_url
                    ? <img src={`${API}/uploads/${p.imagen_url}`} alt={p.nombre}
                        style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px' }} />
                    : <span style={{ fontSize: '28px' }}>📦</span>
                  }
                </td>
                <td><strong>{p.nombre}</strong></td>
                <td style={{ color: '#666' }}>{p.marca || '—'}</td>
                <td style={{ textAlign: 'center' }}>${parseFloat(p.precio).toFixed(2)}</td>
                <td style={{ textAlign: 'center', color: p.stock === 0 ? '#dc3545' : 'inherit' }}>
                  {p.stock}
                </td>
                <td style={{ maxWidth: '200px', color: '#666', fontSize: '13px' }}>
                  {p.descripcion
                    ? <span title={p.descripcion}>{p.descripcion.slice(0, 60)}{p.descripcion.length > 60 ? '…' : ''}</span>
                    : <span style={{ color: '#ccc' }}>—</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => abrirEditar(p)} style={{
                      background: '#ffc107', color: '#212529', border: 'none',
                      padding: '5px 12px', cursor: 'pointer', borderRadius: '4px', fontWeight: '500'
                    }}>
                      Editar
                    </button>
                    <button onClick={() => eliminar(p.id, p.nombre)} style={{
                      background: '#dc3545', color: 'white', border: 'none',
                      padding: '5px 12px', cursor: 'pointer', borderRadius: '4px'
                    }}>
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ color: '#888', fontSize: '13px', marginTop: '10px' }}>
          {filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}{busqueda ? ` para "${busqueda}"` : ''}
        </p>
      </div>

      {/* Modal agregar / editar */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Agregar producto' : `Editar: ${modal.nombre}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Nombre + Marca */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input value={form.nombre} onChange={setField('nombre')} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Marca</label>
                <input value={form.marca} onChange={setField('marca')} placeholder="Ej: Lenovo" style={inputStyle} />
              </div>
            </div>

            {/* Precio + Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Precio *</label>
                <input type="number" min="0" step="0.01" value={form.precio} onChange={setField('precio')} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Stock *</label>
                <input type="number" min="0" value={form.stock} onChange={setField('stock')} required style={inputStyle} />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label style={labelStyle}>Descripción / Texto de venta</label>
              <textarea
                value={form.descripcion}
                onChange={setField('descripcion')}
                rows="4"
                placeholder="Escribe aquí para convencer al cliente: características, beneficios, por qué comprarlo..."
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'sans-serif' }}
              />
            </div>

            {/* Imagen */}
            <div>
              <label style={labelStyle}>Imagen del producto</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                {form.previewUrl && (
                  <img src={form.previewUrl} alt="preview"
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                )}
                <div>
                  <button type="button" onClick={() => fileRef.current.click()} style={{
                    background: '#f8f9fa', border: '1px dashed #bbb', padding: '9px 16px',
                    cursor: 'pointer', borderRadius: '6px', fontSize: '13px'
                  }}>
                    {form.previewUrl ? '🔄 Cambiar imagen' : '📁 Seleccionar imagen'}
                  </button>
                  {form.previewUrl && (
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, imagenFile: null, previewUrl: '', imagen_url_existente: '' }))}
                      style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Quitar imagen
                    </button>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>JPG, PNG, WEBP — máx. 5 MB</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImagen} style={{ display: 'none' }} />
              </div>
            </div>

            {error && <p style={{ color: '#dc3545', margin: 0, fontSize: '13px' }}>{error}</p>}

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #eee' }}>
              <button type="button" onClick={() => setModal(null)} style={{
                background: 'white', border: '1px solid #ddd', padding: '10px 22px',
                cursor: 'pointer', borderRadius: '6px'
              }}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando} style={{
                background: guardando ? '#90caf9' : '#007bff', color: 'white', border: 'none',
                padding: '10px 26px', cursor: guardando ? 'default' : 'pointer',
                borderRadius: '6px', fontWeight: '600'
              }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
