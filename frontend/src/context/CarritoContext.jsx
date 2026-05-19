import { createContext, useContext, useState } from 'react';

const CarritoCtx = createContext();

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  const agregarAlCarrito = (producto) => {
    const enCarrito = carrito.find(i => i.id === producto.id)?.cantidad || 0;
    if (enCarrito >= producto.stock) return false;
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...producto, cantidad: 1 }];
    });
    return true;
  };

  const quitarDelCarrito = (id) => setCarrito(prev => prev.filter(i => i.id !== id));

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nueva = i.cantidad + delta;
      if (nueva <= 0) return null;
      if (nueva > i.stock) return i;
      return { ...i, cantidad: nueva };
    }).filter(Boolean));
  };

  const limpiarCarrito = () => setCarrito([]);

  const totalItems   = carrito.reduce((s, i) => s + i.cantidad, 0);
  const totalCarrito = carrito.reduce((s, i) => s + parseFloat(i.precio) * i.cantidad, 0);

  return (
    <CarritoCtx.Provider value={{
      carrito, agregarAlCarrito, quitarDelCarrito,
      cambiarCantidad, limpiarCarrito, totalItems, totalCarrito
    }}>
      {children}
    </CarritoCtx.Provider>
  );
}

export const useCarrito = () => useContext(CarritoCtx);
