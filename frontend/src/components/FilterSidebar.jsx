// frontend/src/components/FilterSidebar.jsx
export default function FilterSidebar({ tags, marcas, filtros, onChange, onLimpiar }) {
  const toggleTag = (tagId) => {
    const ids = filtros.tagIds.includes(tagId)
      ? filtros.tagIds.filter(id => id !== tagId)
      : [...filtros.tagIds, tagId];
    onChange({ ...filtros, tagIds: ids });
  };

  const toggleMarca = (marca) => {
    const ms = filtros.marcas.includes(marca)
      ? filtros.marcas.filter(m => m !== marca)
      : [...filtros.marcas, marca];
    onChange({ ...filtros, marcas: ms });
  };

  const hayFiltros = filtros.tagIds.length > 0 || filtros.marcas.length > 0 ||
    filtros.precioMin !== '' || filtros.precioMax !== '';

  const categorias = tags.filter(t => t.tipo === 'categoria');
  const temporales = tags.filter(t => t.tipo === 'temporal');

  return (
    <aside className="w-full lg:w-52 flex-shrink-0">
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Filtros</span>
          {hayFiltros && (
            <button
              onClick={onLimpiar}
              className="text-xs text-cyan-400 hover:text-cyan-300 bg-transparent border-none cursor-pointer p-0"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Categorías */}
        {categorias.length > 0 && (
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2 font-medium">Categoría</p>
            <div className="flex flex-col gap-1.5">
              {categorias.map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtros.tagIds.includes(t.id)}
                    onChange={() => toggleTag(t.id)}
                    className="w-3.5 h-3.5 accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                    {t.nombre}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Temporales */}
        {temporales.length > 0 && (
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2 font-medium">Oferta / Novedad</p>
            <div className="flex flex-col gap-1.5">
              {temporales.map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtros.tagIds.includes(t.id)}
                    onChange={() => toggleTag(t.id)}
                    className="w-3.5 h-3.5 accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                    {t.nombre}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Marca */}
        {marcas.length > 0 && (
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2 font-medium">Marca</p>
            <div className="flex flex-col gap-1.5">
              {marcas.map(m => (
                <label key={m} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtros.marcas.includes(m)}
                    onChange={() => toggleMarca(m)}
                    className="w-3.5 h-3.5 accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                    {m}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Precio */}
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2 font-medium">Precio</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Mín"
              value={filtros.precioMin}
              onChange={e => onChange({ ...filtros, precioMin: e.target.value })}
              className="input-dark text-xs py-1.5 px-2 w-full"
            />
            <span className="text-slate-600 text-xs flex-shrink-0">—</span>
            <input
              type="number"
              min="0"
              placeholder="Máx"
              value={filtros.precioMax}
              onChange={e => onChange({ ...filtros, precioMax: e.target.value })}
              className="input-dark text-xs py-1.5 px-2 w-full"
            />
          </div>
        </div>

      </div>
    </aside>
  );
}
