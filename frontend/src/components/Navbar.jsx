import { Link, useNavigate } from 'react-router-dom';

const linksPorRol = {
  cliente:    [{ label: 'Catálogo',   to: '/cliente/catalogo' },
               { label: 'Mis Órdenes', to: '/cliente/ordenes'  }],
  admin:      [{ label: 'Inventario', to: '/admin/inventario' },
               { label: 'Pedidos',    to: '/admin/pedidos'    }],
  superadmin: [{ label: 'Usuarios',   to: '/superadmin/usuarios' },
               { label: 'Reportes',   to: '/superadmin/reportes' },
               { label: 'Inventario', to: '/admin/inventario'    },
               { label: 'Pedidos',    to: '/admin/pedidos'       }],
};

export default function Navbar() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem('nombre');
  const rol    = localStorage.getItem('rol');
  const links  = linksPorRol[rol] || [];

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#1a1a2e', color: 'white', padding: '12px 30px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#4fc3f7' }}>
          FasTech
        </span>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px' }}>
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#aaa' }}>
          {nombre} · <span style={{ color: '#4fc3f7' }}>{rol}</span>
        </span>
        <button onClick={cerrarSesion} style={{
          background: '#dc3545', color: 'white', border: 'none',
          padding: '6px 14px', cursor: 'pointer', borderRadius: '4px'
        }}>
          Salir
        </button>
      </div>
    </nav>
  );
}
