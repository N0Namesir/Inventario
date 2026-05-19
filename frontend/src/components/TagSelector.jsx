// frontend/src/components/TagSelector.jsx
import { useState } from 'react';
import { API } from '../config';

export default function TagSelector({ tags, selectedIds, onChange, token }) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo,   setNuevoTipo]   = useState('categoria');
  const [creando,     setCreando]     = useState(false);
  const [error,       setError]       = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const toggleTag = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  const crearTag = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setError('');
    setCreando(true);
    const res = await fetch(`${API}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: nuevoNombre.trim(), tipo: nuevoTipo })
    });
    setCreando(false);
    if (res.ok) {
      const tag = await res.json();
      tags.push(tag);
      onChange([...selectedIds, tag.id]);
      setNuevoNombre('');
      setMostrarForm(false);
    } else {
      const err = await res.json();
      setError(err.error || 'Error al crear tag');
    }
  };

  const categorias = tags.filter(t => t.tipo === 'categoria');
  const temporales = tags.filter(t => t.tipo === 'temporal');

  const renderGrupo = (lista, label) => lista.length === 0 ? null : (
    <div>
      <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {lista.map(t => {
          const activo = selectedIds.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer
                ${activo
                  ? 'bg-cyan-400/15 border-cyan-400/50 text-cyan-300'
                  : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-surface-500 hover:text-slate-300'}`}
            >
              {t.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {renderGrupo(categorias, 'Categorías')}
      {renderGrupo(temporales, 'Temporales')}

      {mostrarForm ? (
        <form onSubmit={crearTag} className="flex flex-col gap-2 p-3 bg-surface-700 rounded-lg border border-surface-600">
          <div className="flex gap-2">
            <input
              autoFocus
              placeholder="Nombre del tag"
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              className="input-dark flex-1 text-xs py-1.5"
            />
            <select
              value={nuevoTipo}
              onChange={e => setNuevoTipo(e.target.value)}
              className="input-dark text-xs py-1.5 w-32"
            >
              <option value="categoria">Categoría</option>
              <option value="temporal">Temporal</option>
            </select>
          </div>
          {error && <p className="text-danger-400 text-xs m-0">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creando || !nuevoNombre.trim()}
              className="bg-cyan-400 hover:bg-cyan-300 text-navy-950 font-semibold px-3 py-1 rounded text-xs transition-colors cursor-pointer border-none disabled:opacity-50"
            >
              {creando ? 'Creando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => { setMostrarForm(false); setError(''); }}
              className="text-slate-400 hover:text-slate-200 text-xs bg-transparent border-none cursor-pointer px-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="self-start text-xs text-slate-500 hover:text-cyan-400 bg-transparent border border-dashed border-surface-600 hover:border-cyan-400/50 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
        >
          + Nuevo tag
        </button>
      )}
    </div>
  );
}
