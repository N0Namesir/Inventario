import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';

const API = 'http://localhost:5000';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [nombre,   setNombre]     = useState('');
  const [precio,   setPrecio]     = useState('');
  const [stock,    setStock]      = useState('');
  const [cargando, setCargando]   = useState(false);
  const [error,    setError]      = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    setCargando(true);
    fetch(`${API}/productos`, { headers })
      .then(r => r.json())
      .then(data => { setProductos(data); setCargando(false); });
  }, []);

  const agregar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    const res = await fetch(`${API}/productos`, {
      method: 'POST', headers,
      body: JSON.stringify({ nombre, precio: parseFloat(precio), stock: parseInt(stock) })
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Error al guardar');
      setCargando(false);
      return;
    }
    const nuevo = await res.json();
    setProductos(prev => [...prev, nuevo]);
    setNombre(''); setPrecio(''); setStock('');
    setCargando(false);
  };

  const eliminar = async (id) => {
    setCargando(true);
    await fetch(`${API}/productos/${id}`, { method: 'DELETE', headers });
    setProductos(prev => prev.filter(p => p.id !== id));
    setCargando(false);
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '700px', margin: 'auto' }}>
        <h2>Inventario de Productos</h2>

        <form onSubmit={agregar} style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)}
            style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
          <input placeholder="Precio" type="number" min="0" value={precio} onChange={e => setPrecio(e.target.value)}
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
          <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)}
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
          <button type="submit" style={{
            background: '#007bff', color: 'white', border: 'none',
            padding: '8px 18px', cursor: 'pointer', borderRadius: '4px'
          }}>
            Agregar
          </button>
        </form>

        {error    && <p style={{ color: 'red'  }}>{error}</p>}
        {cargando && <p style={{ color: '#666' }}>Cargando...</p>}

        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th>Producto</th><th>Precio</th><th>Stock</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>${p.precio}</td>
                <td>{p.stock} uds.</td>
                <td>
                  <button onClick={() => eliminar(p.id)} style={{
                    background: '#dc3545', color: 'white', border: 'none',
                    padding: '4px 10px', cursor: 'pointer', borderRadius: '4px'
                  }}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
