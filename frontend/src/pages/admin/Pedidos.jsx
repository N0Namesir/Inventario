import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';

const API = 'http://localhost:5000';

const colorEstado = {
  pendiente:  { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
  completada: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
  cancelada:  { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
};

export default function Pedidos() {
  const [ordenes,  setOrdenes]  = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const token = localStorage.getItem('token');
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
      setOrdenes(prev =>
        prev.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o)
      );
    } else {
      const err = await res.json();
      setError(err.error || 'Error al actualizar');
    }
  };

  const resumen = {
    total:      ordenes.length,
    pendientes: ordenes.filter(o => o.estado === 'pendiente').length,
    completadas: ordenes.filter(o => o.estado === 'completada').length,
    canceladas:  ordenes.filter(o => o.estado === 'cancelada').length,
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' }}>
        <h2>Gestión de Pedidos</h2>

        {/* Tarjetas de resumen */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       valor: resumen.total,       color: '#007bff' },
            { label: 'Pendientes',  valor: resumen.pendientes,  color: '#ffc107' },
            { label: 'Completadas', valor: resumen.completadas, color: '#28a745' },
            { label: 'Canceladas',  valor: resumen.canceladas,  color: '#dc3545' },
          ].map(t => (
            <div key={t.label} style={{
              flex: 1, minWidth: '120px', background: 'white',
              border: `2px solid ${t.color}`, borderRadius: '8px',
              padding: '16px', textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 4px', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>{t.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: t.color }}>{t.valor}</p>
            </div>
          ))}
        </div>

        {error    && <p style={{ color: 'red' }}>{error}</p>}
        {cargando && <p style={{ color: '#666' }}>Cargando pedidos...</p>}

        {ordenes.length === 0 && !cargando && (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            Aún no hay pedidos registrados.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {ordenes.map(orden => {
            const estilos = colorEstado[orden.estado] || colorEstado.pendiente;
            return (
              <div key={orden.id} style={{
                border: '1px solid #ddd', borderRadius: '8px',
                overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                {/* Cabecera */}
                <div style={{
                  background: '#f8f9fa', padding: '14px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                }}>
                  <div>
                    <strong>Orden #{orden.id}</strong>
                    <span style={{ marginLeft: '12px', color: '#555', fontSize: '14px' }}>
                      👤 {orden.cliente_nombre}
                    </span>
                    <span style={{ marginLeft: '12px', color: '#999', fontSize: '12px' }}>
                      {new Date(orden.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <strong>${parseFloat(orden.total).toFixed(2)}</strong>
                    <span style={{
                      background: estilos.bg, color: estilos.color,
                      border: `1px solid ${estilos.border}`,
                      padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                    }}>
                      {orden.estado.toUpperCase()}
                    </span>

                    {/* Botones de acción solo si está pendiente */}
                    {orden.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => cambiarEstado(orden.id, 'completada')}
                          style={{
                            background: '#28a745', color: 'white', border: 'none',
                            padding: '4px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px'
                          }}
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => cambiarEstado(orden.id, 'cancelada')}
                          style={{
                            background: '#dc3545', color: 'white', border: 'none',
                            padding: '4px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px'
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '12px 20px', fontSize: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee', color: '#666' }}>
                        <th style={{ textAlign: 'left', paddingBottom: '6px' }}>Producto</th>
                        <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Cant.</th>
                        <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Precio unit.</th>
                        <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orden.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '5px 0' }}>{item.nombre_producto}</td>
                          <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
                          <td style={{ textAlign: 'right' }}>${parseFloat(item.precio_unitario).toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
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
      </div>
    </>
  );
}
