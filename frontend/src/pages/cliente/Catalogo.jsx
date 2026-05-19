import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import { useCarrito } from '../../context/CarritoContext';

const API = 'http://localhost:5000';

export default function Catalogo() {
  const [productos,       setProductos]       = useState([]);
  const [busqueda,        setBusqueda]        = useState('');
  const [cargando,        setCargando]        = useState(false);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [mensaje,         setMensaje]         = useState({ texto: '', tipo: '' });

  const { carrito, agregarAlCarrito } = useCarrito();

  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/productos`, { headers })
      .then(r => r.json())
      .then(data => { setProductos(data); setCargando(false); });
  }, []);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleAgregar = (producto) => {
    const ok = agregarAlCarrito(producto);
    if (!ok) mostrarMensaje(`No hay más stock de "${producto.nombre}"`, 'error');
    else     mostrarMensaje(`"${producto.nombre}" agregado al carrito`);
  };

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: 'auto' }}>
        <h2 style={{ margin: '0 0 20px' }}>Catálogo de Productos</h2>

        {/* Barra de búsqueda */}
        <input
          placeholder="Buscar por nombre o marca..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: '8px',
            fontSize: '14px', marginBottom: '24px', boxSizing: 'border-box'
          }}
        />

        {/* Mensaje de feedback */}
        {mensaje.texto && (
          <p style={{
            padding: '10px 16px', borderRadius: '6px', marginBottom: '16px',
            color:      mensaje.tipo === 'error' ? '#721c24' : '#155724',
            background: mensaje.tipo === 'error' ? '#f8d7da'  : '#d4edda',
            border:     `1px solid ${mensaje.tipo === 'error' ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            {mensaje.texto}
          </p>
        )}

        {cargando && <p style={{ color: '#888' }}>Cargando productos...</p>}

        {/* Grid de productos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {filtrados.map(p => {
            const enCarrito  = carrito.find(i => i.id === p.id)?.cantidad || 0;
            const disponible = p.stock - enCarrito;
            return (
              <div
                key={p.id}
                onClick={() => setProductoDetalle(p)}
                style={{
                  border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  transition: 'box-shadow 0.2s', opacity: disponible === 0 ? 0.65 : 1,
                  display: 'flex', flexDirection: 'column'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.14)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
              >
                {/* Imagen */}
                <div style={{
                  height: '160px', background: '#f8f9fa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {p.imagen_url
                    ? <img src={`${API}/uploads/${p.imagen_url}`} alt={p.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '56px' }}>📦</span>
                  }
                </div>

                {/* Info */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  {p.marca && (
                    <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {p.marca}
                    </span>
                  )}
                  <h3 style={{ margin: 0, fontSize: '15px', lineHeight: 1.3 }}>{p.nombre}</h3>
                  {p.descripcion && (
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                      {p.descripcion.slice(0, 80)}{p.descripcion.length > 80 ? '…' : ''}
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0', color: '#007bff', fontWeight: 'bold', fontSize: '19px' }}>
                    ${parseFloat(p.precio).toFixed(2)}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: disponible <= 3 && disponible > 0 ? '#e65100' : disponible === 0 ? '#dc3545' : '#666' }}>
                    {disponible === 0 ? '✗ Sin stock' : `${disponible} disponibles`}
                    {enCarrito > 0 && <span style={{ color: '#888' }}> · {enCarrito} en carrito</span>}
                  </p>
                </div>

                {/* Botón */}
                <div style={{ padding: '0 14px 14px' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleAgregar(p); }}
                    disabled={disponible === 0}
                    style={{
                      width: '100%', padding: '9px',
                      background: disponible === 0 ? '#e0e0e0' : '#28a745',
                      color: disponible === 0 ? '#aaa' : 'white',
                      border: 'none', borderRadius: '6px',
                      cursor: disponible === 0 ? 'default' : 'pointer', fontWeight: '500', fontSize: '14px'
                    }}
                  >
                    {disponible === 0 ? 'Sin stock' : '+ Agregar al carrito'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtrados.length === 0 && !cargando && (
          <p style={{ textAlign: 'center', color: '#aaa', padding: '60px 0' }}>
            No se encontraron productos para "{busqueda}".
          </p>
        )}
      </div>

      {/* Modal detalle del producto */}
      {productoDetalle && (() => {
        const p         = productoDetalle;
        const enCarrito = carrito.find(i => i.id === p.id)?.cantidad || 0;
        const disp      = p.stock - enCarrito;
        return (
          <Modal title="" onClose={() => setProductoDetalle(null)} width="600px">
            <div style={{ display: 'flex', gap: '24px' }}>
              {/* Imagen */}
              <div style={{
                width: '200px', flexShrink: 0, height: '200px', background: '#f8f9fa',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                {p.imagen_url
                  ? <img src={`${API}/uploads/${p.imagen_url}`} alt={p.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '64px' }}>📦</span>
                }
              </div>

              {/* Detalle */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {p.marca && (
                  <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {p.marca}
                  </span>
                )}
                <h2 style={{ margin: 0, fontSize: '22px' }}>{p.nombre}</h2>
                <p style={{ margin: 0, fontSize: '26px', fontWeight: 'bold', color: '#007bff' }}>
                  ${parseFloat(p.precio).toFixed(2)}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: disp <= 3 && disp > 0 ? '#e65100' : disp === 0 ? '#dc3545' : '#555' }}>
                  {disp === 0 ? 'Sin stock disponible' : `${disp} unidades disponibles`}
                </p>
              </div>
            </div>

            {/* Descripción */}
            {p.descripcion && (
              <div style={{
                marginTop: '20px', padding: '16px', background: '#f8f9fa',
                borderRadius: '8px', borderLeft: '4px solid #007bff'
              }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#333' }}>
                  {p.descripcion}
                </p>
              </div>
            )}

            <button
              onClick={() => { handleAgregar(p); setProductoDetalle(null); }}
              disabled={disp === 0}
              style={{
                marginTop: '20px', width: '100%', padding: '12px',
                background: disp === 0 ? '#e0e0e0' : '#28a745',
                color: disp === 0 ? '#aaa' : 'white',
                border: 'none', borderRadius: '8px',
                cursor: disp === 0 ? 'default' : 'pointer',
                fontWeight: '600', fontSize: '15px'
              }}
            >
              {disp === 0 ? 'Sin stock' : '+ Agregar al carrito'}
            </button>
          </Modal>
        );
      })()}
    </>
  );
}
