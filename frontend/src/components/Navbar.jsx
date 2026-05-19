import { useState } from 'react';
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
  const [abierto, setAbierto] = useState(false);

  const nombre = localStorage.getItem('nombre');
  const rol    = localStorage.getItem('rol');
  const links  = linksPorRol[rol] || [];
  const { totalItems } = useCarrito();

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-navy-900 border-b border-navy-700 shadow-nav">
      {/* Barra principal */}
      <nav className="px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo + links desktop */}
        <div className="flex gap-6 items-center">
          <span className="font-bold text-lg text-cyan-400 tracking-tight select-none">FasTech</span>
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

        {/* Derecha */}
        <div className="flex items-center gap-3">
          {/* Carrito (siempre visible si es cliente) */}
          {rol === 'cliente' && (
            <Link to="/cliente/carrito" className="relative no-underline leading-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-300 hover:text-cyan-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 7h13M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-danger-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          )}

          {/* Usuario + salir — solo en desktop */}
          <span className="text-xs text-slate-500 hidden md:inline">
            {nombre} · <span className="text-cyan-400">{rol}</span>
          </span>
          <button
            onClick={cerrarSesion}
            className="hidden sm:block border border-danger-500 text-danger-400 hover:bg-danger-500 hover:text-white px-3 py-1.5 rounded text-sm transition-colors cursor-pointer bg-transparent"
          >
            Salir
          </button>

          {/* Hamburger — solo en mobile */}
          <button
            onClick={() => setAbierto(v => !v)}
            aria-label="Menú"
            className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 bg-transparent border-none cursor-pointer p-1"
          >
            <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-200 origin-center
              ${abierto ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-200
              ${abierto ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-200 origin-center
              ${abierto ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Menú mobile desplegable */}
      <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out
        ${abierto ? 'max-h-96 border-t border-navy-700' : 'max-h-0'}`}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setAbierto(false)}
              className="text-slate-300 hover:text-cyan-300 hover:bg-surface-800 text-sm px-3 py-2.5 rounded-lg transition-colors no-underline"
            >
              {l.label}
            </Link>
          ))}

          {/* Separador */}
          <div className="border-t border-surface-700 my-1" />

          {/* Usuario */}
          <div className="px-3 py-1.5 text-xs text-slate-500">
            {nombre} · <span className="text-cyan-400">{rol}</span>
          </div>

          {/* Salir */}
          <button
            onClick={cerrarSesion}
            className="text-left text-danger-400 hover:bg-danger-500/10 text-sm px-3 py-2.5 rounded-lg transition-colors bg-transparent border-none cursor-pointer w-full"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
