import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';

const linksPorRol = {
  cliente:    [{ label: 'Catálogo',    to: '/cliente/catalogo' },
               { label: 'Mis Órdenes', to: '/cliente/ordenes'  }],
  admin:      [{ label: 'Inventario',  to: '/admin/inventario' },
               { label: 'Pedidos',     to: '/admin/pedidos'    }],
  superadmin: [{ label: 'Usuarios',    to: '/superadmin/usuarios' },
               { label: 'Reportes',    to: '/superadmin/reportes' },
               { label: 'Inventario',  to: '/admin/inventario'    },
               { label: 'Pedidos',     to: '/admin/pedidos'       }],
};

export default function Navbar() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem('nombre');
  const rol    = localStorage.getItem('rol');
  const links  = linksPorRol[rol] || [];
  const { totalItems } = useCarrito();

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-navy-900 border-b border-navy-700 px-6 py-3 flex justify-between items-center shadow-nav">
      {/* Logo + links */}
      <div className="flex gap-6 items-center">
        <span className="font-bold text-lg text-cyan-400 tracking-tight">FasTech</span>
        <div className="hidden sm:flex gap-5 items-center">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="text-slate-400 hover:text-cyan-300 text-sm transition-colors no-underline"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Derecha: carrito, usuario, salir */}
      <div className="flex gap-4 items-center">
        {rol === 'cliente' && (
          <Link to="/cliente/carrito" className="relative no-underline leading-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-300 hover:text-cyan-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 7h13M7 13L5.4 5M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-danger-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        )}
        <span className="text-xs text-slate-500 hidden md:inline">
          {nombre} · <span className="text-cyan-400">{rol}</span>
        </span>
        <button
          onClick={cerrarSesion}
          className="border border-danger-500 text-danger-400 hover:bg-danger-500 hover:text-white px-3 py-1.5 rounded text-sm transition-colors cursor-pointer bg-transparent"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}
