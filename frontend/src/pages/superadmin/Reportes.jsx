import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';

const API = 'http://localhost:5000';

function TarjetaStat({ titulo, valor, color }) {
  return (
    <div style={{
      background: 'white', border: `3px solid ${color}`, borderRadius: '8px',
      padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <p style={{ margin: '0 0 8px', color: '#666', fontSize: '13px', textTransform: 'uppercase' }}>
        {titulo}
      </p>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color }}>
        {valor}
      </p>
    </div>
  );
}

export default function Reportes() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando]   = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/productos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setProductos(data); setCargando(false); });
  }, []);

  const totalProductos  = productos.length;
  const valorInventario = productos.reduce((s, p) => s + p.precio * p.stock, 0);
  const sinStock        = productos.filter(p => p.stock === 0).length;
  const masStock        = productos.reduce((max, p) => p.stock > (max?.stock ?? -1) ? p : max, null);
  const menosStock      = productos.filter(p => p.stock > 0)
                                   .reduce((min, p) => p.stock < (min?.stock ?? Infinity) ? p : min, null);

  return (
    <>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' }}>
        <h2>Reportes del Sistema</h2>

        {cargando && <p style={{ color: '#666' }}>Cargando datos...</p>}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '20px', marginBottom: '40px'
        }}>
          <TarjetaStat titulo="Total productos"   valor={totalProductos}                    color="#007bff" />
          <TarjetaStat titulo="Valor inventario"  valor={`$${valorInventario.toFixed(2)}`}  color="#28a745" />
          <TarjetaStat titulo="Sin stock"          valor={sinStock}                          color="#dc3545" />
          <TarjetaStat titulo="Más stock"
            valor={masStock ? `${masStock.nombre} (${masStock.stock})` : '—'}              color="#6f42c1" />
        </div>

        <h3>Todos los productos</h3>
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Valor en inventario</th></tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id} style={{ background: p.stock === 0 ? '#fff5f5' : 'white' }}>
                <td>{p.nombre}</td>
                <td>${p.precio}</td>
                <td style={{ color: p.stock === 0 ? 'red' : 'inherit' }}>
                  {p.stock === 0 ? '⚠ Sin stock' : `${p.stock} uds.`}
                </td>
                <td>${(p.precio * p.stock).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
