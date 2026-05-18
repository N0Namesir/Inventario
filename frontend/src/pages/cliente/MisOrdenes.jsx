import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';

const API = 'http://localhost:5000';

const colorEstado = {
  pendiente:  { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
  completada: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
  cancelada:  { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
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
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#666' }}>Cargando tus órdenes...</p>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '750px', margin: 'auto' }}>
        <h2>Mis Órdenes</h2>

        {ordenes.length === 0 ? (
          <div style={{
            background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px',
            padding: '40px', textAlign: 'center', color: '#666'
          }}>
            Aún no tienes órdenes. ¡Ve al catálogo y realiza tu primera compra!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {ordenes.map(orden => {
              const estilos = colorEstado[orden.estado] || colorEstado.pendiente;
              return (
                <div key={orden.id} style={{
                  border: '1px solid #ddd', borderRadius: '8px',
                  overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>
                  {/* Cabecera de la orden */}
                  <div style={{
                    background: '#f8f9fa', padding: '14px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <strong>Orden #{orden.id}</strong>
                      <span style={{ marginLeft: '16px', color: '#666', fontSize: '13px' }}>
                        {new Date(orden.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <strong style={{ fontSize: '16px' }}>${parseFloat(orden.total).toFixed(2)}</strong>
                      <span style={{
                        background: estilos.bg, color: estilos.color,
                        border: `1px solid ${estilos.border}`,
                        padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                      }}>
                        {orden.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Items de la orden */}
                  <div style={{ padding: '0 20px 14px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
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
                            <td style={{ padding: '6px 0' }}>{item.nombre_producto}</td>
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
        )}
      </div>
    </>
  );
}
