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

export default function Carrito() {
  const { carrito, quitarDelCarrito, cambiarCantidad, limpiarCarrito, totalItems, totalCarrito } = useCarrito();
  const [metodoPago, setMetodoPago] = useState('credito');
  const [comprando,  setComprando]  = useState(false);
  const [exito,      setExito]      = useState(false);
  const [error,      setError]      = useState('');
  const navigate = useNavigate();

  const [card,        setCard]        = useState({ numero: '', nombre: '', expiry: '', cvv: '' });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [transfer,    setTransfer]    = useState({ banco: 'BBVA', clabe: '' });

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
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-navy-800">
          <div className="bg-success-500/10 border border-success-500/30 rounded-full p-6 mb-6">
            <svg className="w-16 h-16 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-success-500 mb-2">¡Compra realizada con éxito!</h2>
          <p className="text-slate-400 text-sm">Redirigiendo a Mis Órdenes...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">
            Mi Carrito
            {carrito.length > 0 && (
              <span className="text-sm font-normal text-slate-500 ml-3">
                ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})
              </span>
            )}
          </h2>

          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-surface-800 border border-surface-700 rounded-full p-6 mb-6">
                <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 7h13M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </div>
              <h3 className="text-slate-300 text-lg font-medium mb-2">Tu carrito está vacío</h3>
              <p className="text-slate-500 text-sm mb-6">Agrega productos desde el catálogo</p>
              <Link
                to="/cliente/catalogo"
                className="bg-cyan-400 hover:bg-cyan-300 text-navy-950 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors no-underline"
              >
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* Columna productos */}
              <div className="flex-1 min-w-0">
                <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden divide-y divide-surface-700">
                  {carrito.map((item) => {
                    const maxAlcanzado = item.cantidad >= item.stock;
                    return (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                        {/* Imagen */}
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-surface-700 overflow-hidden flex items-center justify-center">
                          {item.imagen_url
                            ? <img src={`${API}/uploads/${item.imagen_url}`} alt={item.nombre} className="w-full h-full object-cover" />
                            : <svg className="w-8 h-8 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10" /></svg>
                          }
                        </div>

                        {/* Nombre */}
                        <div className="flex-1 min-w-0">
                          {item.marca && (
                            <div className="text-[11px] text-slate-500 uppercase tracking-wide">{item.marca}</div>
                          )}
                          <div className="text-sm font-medium text-slate-100 truncate">{item.nombre}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            ${parseFloat(item.precio).toFixed(2)} c/u
                          </div>
                        </div>

                        {/* Cantidad */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cambiarCantidad(item.id, -1)}
                            className="w-7 h-7 rounded-full border border-surface-600 bg-surface-700 hover:bg-surface-600 text-slate-200 flex items-center justify-center text-base leading-none transition-colors cursor-pointer"
                          >−</button>
                          <span className="w-6 text-center text-sm font-semibold text-slate-100">{item.cantidad}</span>
                          <button
                            onClick={() => cambiarCantidad(item.id, +1)}
                            disabled={maxAlcanzado}
                            className={`w-7 h-7 rounded-full border border-surface-600 flex items-center justify-center text-base leading-none transition-colors
                              ${maxAlcanzado ? 'bg-surface-700 text-slate-600 cursor-not-allowed' : 'bg-surface-700 hover:bg-surface-600 text-slate-200 cursor-pointer'}`}
                          >+</button>
                        </div>

                        {/* Subtotal */}
                        <div className="w-20 text-right text-sm font-semibold text-slate-100 hidden sm:block">
                          ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                        </div>

                        {/* Eliminar */}
                        <button
                          onClick={() => quitarDelCarrito(item.id)}
                          className="text-slate-600 hover:text-danger-400 text-lg leading-none p-1 bg-transparent border-none cursor-pointer transition-colors"
                          title="Eliminar"
                        >✕</button>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={limpiarCarrito}
                  className="mt-3 text-slate-500 hover:text-danger-400 text-xs border border-surface-600 hover:border-danger-500/50 px-3 py-1.5 rounded-lg transition-colors bg-transparent cursor-pointer"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Columna resumen + pago */}
              <div className="w-full lg:w-80 lg:sticky lg:top-20 bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
                {/* Resumen */}
                <div className="px-5 py-4 border-b border-surface-700">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Resumen del pedido</h3>
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})</span>
                    <span>${totalCarrito.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-success-500 mb-3">
                    <span>Envío</span>
                    <span>Gratis</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-slate-100 border-t border-surface-700 pt-3">
                    <span>Total</span>
                    <span className="text-cyan-400">${totalCarrito.toFixed(2)}</span>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="px-5 py-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Método de pago</h3>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {METODOS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setMetodoPago(m.id); setError(''); }}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium cursor-pointer border-2 transition-all
                          ${metodoPago === m.id
                            ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                            : 'border-surface-600 bg-surface-700 text-slate-400 hover:border-surface-500'}`}
                      >
                        <span className="text-xl">{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Formularios */}
                  {(metodoPago === 'credito' || metodoPago === 'debito') && (
                    <div className="flex flex-col gap-2.5">
                      <input
                        placeholder="Número de tarjeta"
                        value={card.numero}
                        onChange={e => setCard({ ...card, numero: fmtCardNum(e.target.value) })}
                        className="input-dark"
                        maxLength="19"
                      />
                      <input
                        placeholder="Nombre del titular"
                        value={card.nombre}
                        onChange={e => setCard({ ...card, nombre: e.target.value.toUpperCase() })}
                        className="input-dark"
                      />
                      <div className="flex gap-2.5">
                        <input
                          placeholder="MM/AA"
                          value={card.expiry}
                          onChange={e => setCard({ ...card, expiry: fmtExpiry(e.target.value) })}
                          className="input-dark flex-1"
                          maxLength="5"
                        />
                        <input
                          placeholder="CVV"
                          value={card.cvv}
                          onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          className="input-dark flex-1"
                          type="password"
                          maxLength="4"
                        />
                      </div>
                    </div>
                  )}

                  {metodoPago === 'paypal' && (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-xs text-slate-400 m-0">Email asociado a tu cuenta PayPal</p>
                      <input
                        placeholder="correo@ejemplo.com"
                        type="email"
                        value={paypalEmail}
                        onChange={e => setPaypalEmail(e.target.value)}
                        className="input-dark"
                      />
                    </div>
                  )}

                  {metodoPago === 'transferencia' && (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-xs text-slate-400 m-0">Selecciona tu banco y proporciona tu CLABE</p>
                      <select
                        value={transfer.banco}
                        onChange={e => setTransfer({ ...transfer, banco: e.target.value })}
                        className="input-dark"
                      >
                        {['BBVA', 'Santander', 'Banamex', 'HSBC', 'Banorte', 'Inbursa', 'Scotiabank'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <input
                        placeholder="CLABE interbancaria (18 dígitos)"
                        value={transfer.clabe}
                        onChange={e => setTransfer({ ...transfer, clabe: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                        className="input-dark"
                      />
                    </div>
                  )}

                  {error && (
                    <p className="mt-3 text-xs text-danger-400 bg-danger-500/10 border border-danger-500/30 rounded-lg px-3 py-2 m-0">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={confirmarCompra}
                    disabled={comprando}
                    className="btn-primary mt-4 text-base font-semibold py-3"
                  >
                    {comprando ? 'Procesando...' : `Pagar $${totalCarrito.toFixed(2)}`}
                  </button>

                  <p className="text-[11px] text-slate-600 text-center mt-2.5">
                    Pago simulado · Solo fines de demostración
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </>
  );
}
