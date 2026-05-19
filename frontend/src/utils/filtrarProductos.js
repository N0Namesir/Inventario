// frontend/src/utils/filtrarProductos.js

export const FILTROS_VACIOS = { tagIds: [], marcas: [], precioMin: '', precioMax: '' };

export function filtrarProductos(productos, filtros, busqueda = '') {
  return productos.filter(p => {
    // Búsqueda de texto
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!p.nombre.toLowerCase().includes(q) && !(p.marca?.toLowerCase().includes(q)))
        return false;
    }

    // Tags: OR — muestra producto si tiene AL MENOS UNO de los tags seleccionados
    if (filtros.tagIds.length > 0) {
      const idsProducto = (p.tags || []).map(t => t.id);
      const tieneAlguno = filtros.tagIds.some(id => idsProducto.includes(id));
      if (!tieneAlguno) return false;
    }

    // Marca: OR entre seleccionadas
    if (filtros.marcas.length > 0) {
      if (!filtros.marcas.includes(p.marca)) return false;
    }

    // Precio mínimo
    if (filtros.precioMin !== '' && parseFloat(p.precio) < parseFloat(filtros.precioMin))
      return false;

    // Precio máximo
    if (filtros.precioMax !== '' && parseFloat(p.precio) > parseFloat(filtros.precioMax))
      return false;

    return true;
  });
}
