import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useCarrito } from '../../context/CarritoContext';

const API = 'http://localhost:5000';

const METODOS = [
  { id: 'credito',       label: 'Crédito',      icon: '💳' },
  { id: 'debito',        label: 'Débito',        icon: '🏧' },
  { id: 'paypal',        label: 'PayPal',        icon: '💰' },
  { id: 'transferencia', label: 'Transferencia', icon: '🏦' },
];

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #ddd',
  borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box',
  fontFamily: 'sans-serif',
};

export default function Carrito() {
  const { carrito, quitarDelCarrito, cambiarCantidad, limpiarCarrito, totalItems, totalCarrito } = useCarrito();
  const [metodoPago, setMetodoPago] = useState('credito');
  const [comprando,  setComprando]  = useState(false);
  const [exito,      setExito]      = useState(false);
  const [error,      setError]      = useState('');
  const navigate = useNavigate();

  const [card,     setCard]     = useState({ numero: '', nombre: '', expiry: '', cvv: '' });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [transfer, setTransfer] = useState({ banco: 'BBVA', clabe: '' });

  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fmtCardNum = (v) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const fmtExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const confirmarCompra = async () => {
    setError('');
    if (metodoPago === 'credito' || metodoPago === 'debito') {
      if (!card.numero || !card.nombre || !card.expiry || !card.cvv)
        return setError('Completa todos los campos de la tarjeta');
    } else if (metodoPago === 'paypal') {
      if (!paypalEmail || !paypalEmail.includes('@'))
        return setError('Ingresa un email de PayPal válido');
    } else if (metodoPago === 'transferencia') {
      if (!transfer.clabe || transfer.clabe.length < 18)
        return setError('La CLABE debe tener 18 dígitos');
    }

    setComprando(true);
    try {
      const res = await fetch(`${API}/ordenes`, {
        method: 'POST', headers,
        body: JSON.stringify({ items: carrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad })) }),
      });
      if (res.ok) {
        limpiarCarrito();
        setExito(true);
        setTimeout(() => navigate('/cliente/ordenes'), 2500);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al procesar la compra');
      }
    } catch {
      setError('Error de conexión con el servidor');
    }
    setComprando(false);
  };

  if (exito) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '64px' }}>✅</div>
          <h2 style={{ color: '#28a745', margin: '16px 0 8px' }}>¡Compra realizada con éxito!</h2>
          <p style={{ color: '#888' }}>Redirigiendo a Mis Órdenes...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '32px 40px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: 'auto' }}>

        <h2 style={{ margin: '0 0 24px', fontSize: '22px' }}>
          Mi Carrito
          {carrito.length > 0 && (
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#888', marginLeft: '10px' }}>
              ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})
            </span>
          )}
        </h2>

        {carrito.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
            <h3 style={{ color: '#666', margin: '0 0 8px' }}>Tu carrito está vacío</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px' }}>Agrega productos desde el catálogo</p>
            <Link to="/cliente/catalogo" style={{
              background: '#007bff', color: 'white', textDecoration: 'none',
              padding: '10px 24px', borderRadius: '6px', fontWeight: '500', fontSize: '14px'
            }}>
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* ── Columna izquierda: productos ── */}
            <div style={{ flex: '1 1 420px', minWidth: 0 }}>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
                {carrito.map((item, idx) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                    borderBottom: idx < carrito.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}>
                    {/* Imagen */}
                    <div style={{
                      width: '64px', height: '64px', flexShrink: 0, borderRadius: '8px',
                      background: '#f8f9fa', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.imagen_url
                        ? <img src={`${API}/uploads/${item.imagen_url}`} alt={item.nombre}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '28px' }}>📦</span>
                      }
                    </div>

                    {/* Nombre y precio */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {item.marca && (
                        <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          {item.marca}
                        </div>
                      )}
                      <div style={{ fontWeight: '500', fontSize: '15px' }}>{item.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                        ${parseFloat(item.precio).toFixed(2)} c/u · {item.stock} en stock
                      </div>
                    </div>

                    {/* Controles de cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => cambiarCantidad(item.id, -1)}
                        style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          border: '1px solid #ddd', background: 'white',
                          cursor: 'pointer', fontSize: '18px', lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >−</button>
                      <span style={{ minWidth: '26px', textAlign: 'center', fontWeight: '600', fontSize: '15px' }}>
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(item.id, +1)}
                        disabled={item.cantidad >= item.stock}
                        style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          border: '1px solid #ddd',
                          background: item.cantidad >= item.stock ? '#f5f5f5' : 'white',
                          cursor: item.cantidad >= item.stock ? 'default' : 'pointer',
                          fontSize: '18px', lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: item.cantidad >= item.stock ? '#ccc' : '#333',
                        }}
                      >+</button>
                    </div>

                    {/* Subtotal */}
                    <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: '600', fontSize: '15px' }}>
                      ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => quitarDelCarrito(item.id)}
                      title="Eliminar"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ccc', fontSize: '18px', padding: '4px', lineHeight: 1,
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>

              <button
                onClick={limpiarCarrito}
                style={{
                  marginTop: '12px', background: 'none', border: '1px solid #ddd',
                  color: '#999', cursor: 'pointer', padding: '7px 16px',
                  borderRadius: '6px', fontSize: '13px',
                }}
              >
                Vaciar carrito
              </button>
            </div>

            {/* ── Columna derecha: resumen + pago ── */}
            <div style={{
              width: '340px', flexShrink: 0,
              border: '1px solid #e0e0e0', borderRadius: '10px',
              overflow: 'hidden', background: 'white',
            }}>
              {/* Resumen */}
              <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Resumen del pedido</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})</span>
                  <span>${totalCarrito.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#28a745' }}>
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingTop: '12px', borderTop: '1px solid #f0f0f0',
                  fontWeight: 'bold', fontSize: '18px',
                }}>
                  <span>Total</span>
                  <span>${totalCarrito.toFixed(2)}</span>
                </div>
              </div>

              {/* Método de pago */}
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Método de pago</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
                  {METODOS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setMetodoPago(m.id); setError(''); }}
                      style={{
                        padding: '10px 6px', borderRadius: '8px', cursor: 'pointer',
                        border: `2px solid ${metodoPago === m.id ? '#007bff' : '#e0e0e0'}`,
                        background: metodoPago === m.id ? '#e8f4ff' : 'white',
                        color: metodoPago === m.id ? '#007bff' : '#555',
                        fontSize: '12px', fontWeight: '500',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Formulario según método */}
                {(metodoPago === 'credito' || metodoPago === 'debito') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      placeholder="Número de tarjeta"
                      value={card.numero}
                      onChange={e => setCard({ ...card, numero: fmtCardNum(e.target.value) })}
                      style={inputStyle}
                      maxLength="19"
                    />
                    <input
                      placeholder="Nombre del titular"
                      value={card.nombre}
                      onChange={e => setCard({ ...card, nombre: e.target.value.toUpperCase() })}
                      style={inputStyle}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        placeholder="MM/AA"
                        value={card.expiry}
                        onChange={e => setCard({ ...card, expiry: fmtExpiry(e.target.value) })}
                        style={{ ...inputStyle, flex: 1 }}
                        maxLength="5"
                      />
                      <input
                        placeholder="CVV"
                        value={card.cvv}
                        onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        style={{ ...inputStyle, flex: 1 }}
                        type="password"
                        maxLength="4"
                      />
                    </div>
                  </div>
                )}

                {metodoPago === 'paypal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                      Ingresa el email asociado a tu cuenta PayPal
                    </p>
                    <input
                      placeholder="correo@ejemplo.com"
                      type="email"
                      value={paypalEmail}
                      onChange={e => setPaypalEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}

                {metodoPago === 'transferencia' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                      Selecciona tu banco y proporciona tu CLABE
                    </p>
                    <select
                      value={transfer.banco}
                      onChange={e => setTransfer({ ...transfer, banco: e.target.value })}
                      style={inputStyle}
                    >
                      {['BBVA', 'Santander', 'Banamex', 'HSBC', 'Banorte', 'Inbursa', 'Scotiabank'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <input
                      placeholder="CLABE interbancaria (18 dígitos)"
                      value={transfer.clabe}
                      onChange={e => setTransfer({ ...transfer, clabe: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                      style={inputStyle}
                    />
                  </div>
                )}

                {error && (
                  <p style={{
                    margin: '12px 0 0', padding: '10px 12px', borderRadius: '6px',
                    background: '#f8d7da', color: '#721c24', fontSize: '13px',
                    border: '1px solid #f5c6cb',
                  }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={confirmarCompra}
                  disabled={comprando}
                  style={{
                    marginTop: '16px', width: '100%', padding: '13px',
                    background: comprando ? '#90caf9' : '#007bff',
                    color: 'white', border: 'none', borderRadius: '8px',
                    cursor: comprando ? 'default' : 'pointer',
                    fontWeight: '600', fontSize: '15px',
                  }}
                >
                  {comprando ? 'Procesando...' : `Pagar $${totalCarrito.toFixed(2)}`}
                </button>

                <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', margin: '10px 0 0' }}>
                  Pago simulado · Solo fines de demostración
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
