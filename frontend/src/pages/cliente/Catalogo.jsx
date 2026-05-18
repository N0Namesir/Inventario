import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';

const API = 'http://localhost:5000';

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [carrito,   setCarrito]   = useState([]);
  const [mensaje,   setMensaje]   = useState({ texto: '', tipo: '' });
  const [comprando, setComprando] = useState(false);

  const token = localStorage.getItem('token');
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

  const agregarAlCarrito = (producto) => {
    const enCarrito = carrito.find(i => i.id === producto.id)?.cantidad || 0;
    if (enCarrito >= producto.stock) {
      mostrarMensaje(`No hay más stock de "${producto.nombre}"`, 'error');
      return;
    }
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...producto, cantidad: 1 }];
    });
    mostrarMensaje(`"${producto.nombre}" agregado al carrito`);
  };

  const quitarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(i => i.id !== id));
  };

  const confirmarCompra = async () => {
    setComprando(true);
    const items = carrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad }));
    const res = await fetch(`${API}/ordenes`, {
      method: 'POST', headers,
      body: JSON.stringify({ items })
    });
    setComprando(false);
    if (res.ok) {
      setCarrito([]);
      // Actualiza el stock mostrado en pantalla
      setProductos(prev => prev.map(p => {
        const item = carrito.find(i => i.id === p.id);
        return item ? { ...p, stock: p.stock - item.cantidad } : p;
      }));
      mostrarMensaje('¡Compra realizada con éxito! Revisa "Mis Órdenes".');
    } else {
      const err = await res.json();
      mostrarMensaje(err.error || 'Error al procesar la compra', 'error');
    }
  };

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totalItems   = carrito.reduce((s, i) => s + i.cantidad, 0);

  return (
    <>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '950px', margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Catálogo de Productos</h2>
          {carrito.length > 0 && (
            <div style={{
              background: '#e8f5e9', border: '1px solid #4caf50', padding: '10px 20px',
              borderRadius: '6px', fontSize: '14px'
            }}>
              🛒 {totalItems} items · <strong>${totalCarrito.toFixed(2)}</strong>
            </div>
          )}
        </div>

        {mensaje.texto && (
          <p style={{
            marginTop: '16px', padding: '10px 16px', borderRadius: '4px',
            color: mensaje.tipo === 'error' ? '#721c24' : '#155724',
            background: mensaje.tipo === 'error' ? '#f8d7da' : '#d4edda',
            border: `1px solid ${mensaje.tipo === 'error' ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            {mensaje.texto}
          </p>
        )}

        {cargando && <p style={{ color: '#666', marginTop: '20px' }}>Cargando productos...</p>}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '20px', marginTop: '24px'
        }}>
          {productos.map(p => {
            const enCarrito   = carrito.find(i => i.id === p.id)?.cantidad || 0;
            const disponible  = p.stock - enCarrito;
            return (
              <div key={p.id} style={{
                border: '1px solid #ddd', borderRadius: '8px', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                opacity: disponible === 0 ? 0.6 : 1
              }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{p.nombre}</h3>
                <p style={{ margin: 0, color: '#007bff', fontWeight: 'bold', fontSize: '20px' }}>
                  ${p.precio}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: disponible <= 3 ? '#dc3545' : '#666' }}>
                  {disponible === 0 ? 'Sin stock' : `${disponible} disponibles`}
                  {enCarrito > 0 && <span style={{ color: '#888' }}> ({enCarrito} en carrito)</span>}
                </p>
                <button
                  onClick={() => agregarAlCarrito(p)}
                  disabled={disponible === 0}
                  style={{
                    marginTop: '8px', background: disponible === 0 ? '#ccc' : '#28a745',
                    color: 'white', border: 'none', padding: '8px',
                    cursor: disponible === 0 ? 'default' : 'pointer', borderRadius: '4px'
                  }}
                >
                  {disponible === 0 ? 'Sin stock' : '+ Agregar al carrito'}
                </button>
              </div>
            );
          })}
        </div>

        {carrito.length > 0 && (
          <div style={{ marginTop: '40px', borderTop: '2px solid #ddd', paddingTop: '24px' }}>
            <h3>Mi Carrito</h3>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr><th>Producto</th><th>Precio unit.</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {carrito.map(item => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>${item.precio}</td>
                    <td>{item.cantidad}</td>
                    <td><strong>${(item.precio * item.cantidad).toFixed(2)}</strong></td>
                    <td>
                      <button onClick={() => quitarDelCarrito(item.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontSize: '18px'
                      }}>✕</button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                  <td colSpan="3">Total</td>
                  <td colSpan="2">${totalCarrito.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <button
              onClick={confirmarCompra}
              disabled={comprando}
              style={{
                background: comprando ? '#90caf9' : '#007bff', color: 'white',
                border: 'none', padding: '12px 28px', cursor: comprando ? 'default' : 'pointer',
                borderRadius: '4px', fontSize: '15px'
              }}
            >
              {comprando ? 'Procesando...' : 'Confirmar compra'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
