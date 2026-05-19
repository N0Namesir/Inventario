# Tags y Filtros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un sistema de tags dinámicos (categoría/temporal) a los productos, con filtros por tag, marca y precio en Catálogo (cliente), Inventario (admin) y Reportes (superadmin).

**Architecture:** Dos tablas nuevas en MariaDB (`tags`, `producto_tags`). El backend expone endpoints CRUD para tags e incluye tags en `GET /productos` via LEFT JOIN. El filtrado es client-side en React. El frontend agrega un sidebar de filtros en Catálogo e Inventario, y una barra de filtros horizontal en Reportes. La gestión de tags (crear/eliminar/asignar) vive dentro del modal de producto existente en Inventario.

**Tech Stack:** MariaDB (Docker), Node.js/Express, React 19, Tailwind CSS v4

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `backend/server.js` | Modificar | Agregar endpoints `/tags`, modificar `/productos` para incluir tags, modificar POST/PUT producto para asignar tags |
| `frontend/src/components/FilterSidebar.jsx` | Crear | Sidebar reutilizable de filtros (tags + marca + precio) |
| `frontend/src/components/TagSelector.jsx` | Crear | Selector de tags para el modal de producto (chips + crear nuevo) |
| `frontend/src/pages/cliente/Catalogo.jsx` | Modificar | Integrar FilterSidebar, adaptar layout a sidebar + grid |
| `frontend/src/pages/admin/Inventario.jsx` | Modificar | Integrar FilterSidebar + TagSelector en modal |
| `frontend/src/pages/superadmin/Reportes.jsx` | Modificar | Agregar barra de filtros horizontal, stats reactivas |

---

## Task 1: Migración de base de datos

**Files:**
- No files created (SQL ejecutado directamente en Docker)

- [ ] **Step 1: Crear tablas `tags` y `producto_tags`**

```bash
docker exec fastech-db mariadb -u root -p1234 fastech_db -e "
CREATE TABLE tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  tipo ENUM('categoria','temporal') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE producto_tags (
  producto_id INT NOT NULL,
  tag_id      INT NOT NULL,
  PRIMARY KEY (producto_id, tag_id),
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)      REFERENCES tags(id)      ON DELETE CASCADE
);
"
```

- [ ] **Step 2: Insertar tags predefinidos**

```bash
docker exec fastech-db mariadb -u root -p1234 fastech_db -e "
INSERT INTO tags (nombre, tipo) VALUES
  ('Laptop',      'categoria'),
  ('Teléfono',    'categoria'),
  ('Tablet',      'categoria'),
  ('Accesorio',   'categoria'),
  ('Descuento',   'temporal'),
  ('Nuevo',       'temporal');
"
```

- [ ] **Step 3: Verificar**

```bash
docker exec fastech-db mariadb -u root -p1234 fastech_db -e "SELECT * FROM tags;"
```

Resultado esperado: 6 filas con los tags predefinidos.

- [ ] **Step 4: Commit**

```bash
cd /home/over/D3v/inventario-real
git add -A
git commit -m "db: add tags and producto_tags tables with seed data"
```

---

## Task 2: Backend — endpoints de tags y productos con tags

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Agregar sección de Tags en server.js**

Después de la sección `// ─── PRODUCTOS ───` y antes de `// ─── USUARIOS ───`, agregar:

```js
// ─── TAGS ────────────────────────────────────────────────────────────────────

app.get('/tags', verificarToken, (req, res) => {
    db.query('SELECT * FROM tags ORDER BY tipo, nombre', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(results);
    });
});

app.post('/tags', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    const { nombre, tipo } = req.body;
    if (!nombre || !nombre.trim())
        return res.status(400).json({ error: 'El nombre es requerido' });
    if (!['categoria', 'temporal'].includes(tipo))
        return res.status(400).json({ error: 'Tipo inválido (categoria o temporal)' });

    db.query(
        'INSERT INTO tags (nombre, tipo) VALUES (?, ?)',
        [nombre.trim(), tipo],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY')
                    return res.status(409).json({ error: 'Ya existe un tag con ese nombre' });
                return res.status(500).json({ error: 'Error del servidor' });
            }
            res.status(201).json({ id: result.insertId, nombre: nombre.trim(), tipo });
        }
    );
});

app.delete('/tags/:id', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    db.query('DELETE FROM tags WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Tag no encontrado' });
        res.json({ mensaje: 'Tag eliminado' });
    });
});
```

- [ ] **Step 2: Modificar `GET /productos` para incluir tags**

Reemplazar el handler existente:

```js
// GET — todos los usuarios autenticados
app.get('/productos', verificarToken, (req, res) => {
    const sql = `
        SELECT p.*,
               COALESCE(
                 JSON_ARRAYAGG(
                   IF(t.id IS NOT NULL, JSON_OBJECT('id', t.id, 'nombre', t.nombre, 'tipo', t.tipo), NULL)
                 ), JSON_ARRAY()
               ) AS tags
        FROM productos p
        LEFT JOIN producto_tags pt ON pt.producto_id = p.id
        LEFT JOIN tags t ON t.id = pt.tag_id
        GROUP BY p.id
        ORDER BY p.id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        const productos = results.map(p => ({
            ...p,
            tags: (JSON.parse(p.tags) || []).filter(Boolean)
        }));
        res.json(productos);
    });
});
```

- [ ] **Step 3: Crear helper para asignar tags a un producto**

Agregar esta función auxiliar antes de los endpoints de productos (después de `validarProducto`):

```js
function asignarTags(productoId, tagIds, callback) {
    db.query('DELETE FROM producto_tags WHERE producto_id = ?', [productoId], (err) => {
        if (err) return callback(err);
        if (!tagIds || tagIds.length === 0) return callback(null);
        const values = tagIds.map(tid => [productoId, parseInt(tid)]);
        db.query('INSERT INTO producto_tags (producto_id, tag_id) VALUES ?', [values], callback);
    });
}
```

- [ ] **Step 4: Modificar `POST /productos` para aceptar tag_ids**

Reemplazar el handler POST completo:

```js
// POST — solo admin/superadmin (con imagen opcional)
app.post('/productos', verificarToken, verificarRol('admin', 'superadmin'), upload.single('imagen'), (req, res) => {
    const error = validarProducto(req, res);
    if (error) return;

    const { nombre, marca, precio, stock, descripcion } = req.body;
    const tagIds    = req.body.tag_ids ? JSON.parse(req.body.tag_ids) : [];
    const imagen_url = req.file ? req.file.filename : null;

    db.query(
        'INSERT INTO productos (nombre, marca, precio, stock, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre.trim(), marca?.trim() || null, parseFloat(precio), parseInt(stock) || 0, descripcion?.trim() || null, imagen_url],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            const productoId = result.insertId;
            asignarTags(productoId, tagIds, (err) => {
                if (err) return res.status(500).json({ error: 'Error asignando tags' });
                res.status(201).json({
                    id: productoId,
                    nombre: nombre.trim(),
                    marca: marca?.trim() || null,
                    precio: parseFloat(precio),
                    stock: parseInt(stock) || 0,
                    descripcion: descripcion?.trim() || null,
                    imagen_url,
                    tags: []
                });
            });
        }
    );
});
```

- [ ] **Step 5: Modificar `PUT /productos/:id` para aceptar tag_ids**

Reemplazar el handler PUT completo:

```js
// PUT — editar producto (con imagen opcional)
app.put('/productos/:id', verificarToken, verificarRol('admin', 'superadmin'), upload.single('imagen'), (req, res) => {
    const error = validarProducto(req, res);
    if (error) return;

    const { nombre, marca, precio, stock, descripcion, imagen_url_existente } = req.body;
    const tagIds    = req.body.tag_ids ? JSON.parse(req.body.tag_ids) : [];
    const imagen_url = req.file ? req.file.filename : (imagen_url_existente || null);
    const id = parseInt(req.params.id);

    db.query(
        'UPDATE productos SET nombre = ?, marca = ?, precio = ?, stock = ?, descripcion = ?, imagen_url = ? WHERE id = ?',
        [nombre.trim(), marca?.trim() || null, parseFloat(precio), parseInt(stock) || 0, descripcion?.trim() || null, imagen_url, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
            asignarTags(id, tagIds, (err) => {
                if (err) return res.status(500).json({ error: 'Error asignando tags' });
                res.json({
                    id,
                    nombre: nombre.trim(),
                    marca: marca?.trim() || null,
                    precio: parseFloat(precio),
                    stock: parseInt(stock) || 0,
                    descripcion: descripcion?.trim() || null,
                    imagen_url,
                    tags: []
                });
            });
        }
    );
});
```

- [ ] **Step 6: Reiniciar el servidor backend y verificar**

```bash
# El servidor corre en el contenedor o localmente — reiniciar según tu setup
# Si corre como proceso node local:
pkill -f "node server.js" 2>/dev/null; cd /home/over/D3v/inventario-real/backend && node server.js &
sleep 2

# Verificar GET /tags
curl -s http://localhost:5000/tags -H "Authorization: Bearer $(curl -s -X POST http://localhost:5000/login -H 'Content-Type: application/json' -d '{"email":"admin@fastech.com","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)"
```

Resultado esperado: array JSON con 6 tags.

- [ ] **Step 7: Commit**

```bash
cd /home/over/D3v/inventario-real
git add backend/server.js
git commit -m "feat(backend): add tags endpoints and include tags in GET /productos"
```

---

## Task 3: Componente `FilterSidebar.jsx`

**Files:**
- Create: `frontend/src/components/FilterSidebar.jsx`

- [ ] **Step 1: Crear el componente**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
cd /home/over/D3v/inventario-real
git add frontend/src/components/FilterSidebar.jsx
git commit -m "feat(ui): add reusable FilterSidebar component"
```

---

## Task 4: Componente `TagSelector.jsx`

**Files:**
- Create: `frontend/src/components/TagSelector.jsx`

- [ ] **Step 1: Crear el componente**

```jsx
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
      tags.push(tag); // mutación local para refrescar sin re-fetch global
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
```

- [ ] **Step 2: Commit**

```bash
cd /home/over/D3v/inventario-real
git add frontend/src/components/TagSelector.jsx
git commit -m "feat(ui): add TagSelector component for product modal"
```

---

## Task 5: Lógica de filtrado compartida

Este helper se usará en Catálogo e Inventario.

**Files:**
- Create: `frontend/src/utils/filtrarProductos.js`

- [ ] **Step 1: Crear el helper**

```js
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

    // Tags: OR dentro del mismo tipo (si hay tags seleccionados de ambos tipos, AND entre tipos)
    if (filtros.tagIds.length > 0) {
      const idsProducto = (p.tags || []).map(t => t.id);
      // Separar seleccionados por tipo
      // No necesitamos los tags globales aquí — solo comprobamos si el producto
      // tiene AL MENOS UNO de los tags seleccionados.
      // (El sidebar ya agrupa por tipo visualmente; la lógica OR aplica globalmente
      //  entre todos los seleccionados ya que el usuario entiende que es OR).
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
```

- [ ] **Step 2: Commit**

```bash
cd /home/over/D3v/inventario-real
git add frontend/src/utils/filtrarProductos.js
git commit -m "feat(utils): add filtrarProductos helper"
```

---

## Task 6: Actualizar `Catalogo.jsx`

**Files:**
- Modify: `frontend/src/pages/cliente/Catalogo.jsx`

- [ ] **Step 1: Agregar imports y estado de filtros/tags**

Al inicio del archivo, agregar imports:

```jsx
import FilterSidebar from '../../components/FilterSidebar';
import { FILTROS_VACIOS, filtrarProductos } from '../../utils/filtrarProductos';
```

Dentro del componente `Catalogo`, agregar estado:

```jsx
const [tags,    setTags]    = useState([]);
const [filtros, setFiltros] = useState(FILTROS_VACIOS);
const [sidebarAbierto, setSidebarAbierto] = useState(false);
```

- [ ] **Step 2: Cargar tags junto a los productos**

Reemplazar el `useEffect` existente:

```jsx
useEffect(() => {
  setCargando(true);
  const h = { headers };
  Promise.all([
    fetch(`${API}/productos`, h).then(r => r.json()),
    fetch(`${API}/tags`,      h).then(r => r.json()),
  ]).then(([prods, tgs]) => {
    setProductos(prods);
    setTags(tgs);
    setCargando(false);
  });
}, []);
```

- [ ] **Step 3: Reemplazar lógica de `filtrados`**

Reemplazar la línea:
```jsx
const filtrados = productos.filter(p =>
  p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
  (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()))
);
```

Por:
```jsx
const marcasDisponibles = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();
const filtrados = filtrarProductos(productos, filtros, busqueda);
const limpiarFiltros = () => setFiltros(FILTROS_VACIOS);
```

- [ ] **Step 4: Actualizar el layout del return para incluir sidebar**

Reemplazar el bloque `<main>` completo:

```jsx
return (
  <>
    <Navbar />
    <main className="flex-1 bg-navy-800 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Catálogo de Productos</h2>

        {/* Barra de búsqueda + botón filtros mobile */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              placeholder="Buscar por nombre o marca..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="input-dark pl-10"
            />
          </div>
          <button
            onClick={() => setSidebarAbierto(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer
              ${sidebarAbierto
                ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300'
                : 'bg-surface-800 border-surface-700 text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
            </svg>
            Filtros
          </button>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar — visible en desktop siempre, en mobile solo si abierto */}
          <div className={`${sidebarAbierto ? 'block' : 'hidden'} lg:block`}>
            <FilterSidebar
              tags={tags}
              marcas={marcasDisponibles}
              filtros={filtros}
              onChange={setFiltros}
              onLimpiar={limpiarFiltros}
            />
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {cargando && (
              <div className="flex items-center gap-2 text-slate-400 py-12">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Cargando productos...
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtrados.map(p => {
                const enCarrito  = carrito.find(i => i.id === p.id)?.cantidad || 0;
                const disponible = p.stock - enCarrito;
                return (
                  <div
                    key={p.id}
                    onClick={() => setProductoDetalle(p)}
                    className={`bg-surface-800 border border-surface-700 rounded-xl overflow-hidden cursor-pointer
                      hover:border-surface-600 hover:-translate-y-0.5 hover:shadow-card-hover
                      transition-all duration-200 flex flex-col
                      ${disponible === 0 ? 'opacity-60' : ''}`}
                  >
                    <div className="h-44 bg-surface-700 overflow-hidden flex items-center justify-center">
                      <ProductImage url={p.imagen_url} nombre={p.nombre} size="card" />
                    </div>
                    <div className="p-4 flex flex-col gap-1.5 flex-1">
                      {p.marca && (
                        <span className="text-[11px] text-slate-500 uppercase tracking-wide">{p.marca}</span>
                      )}
                      <h3 className="text-sm font-semibold text-slate-100 leading-snug m-0">{p.nombre}</h3>
                      {p.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {p.tags.map(t => (
                            <span key={t.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-700 text-slate-400 border border-surface-600">
                              {t.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                      {p.descripcion && (
                        <p className="text-xs text-slate-400 leading-relaxed m-0 line-clamp-2">{p.descripcion}</p>
                      )}
                      <p className="text-xl font-bold text-cyan-400 mt-1 mb-0">${parseFloat(p.precio).toFixed(2)}</p>
                      <StockBadge disponible={disponible} enCarrito={enCarrito} />
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        onClick={e => { e.stopPropagation(); handleAgregar(p); }}
                        disabled={disponible === 0}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none
                          ${disponible === 0
                            ? 'bg-surface-700 text-slate-500 cursor-not-allowed'
                            : 'bg-success-500 hover:bg-success-600 text-white'}`}
                      >
                        {disponible === 0 ? 'Sin stock' : '+ Agregar al carrito'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtrados.length === 0 && !cargando && (
              <div className="text-center py-20 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Sin resultados para los filtros actuales.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>

    {/* Modal detalle */}
    {productoDetalle && (() => {
      const p         = productoDetalle;
      const enCarrito = carrito.find(i => i.id === p.id)?.cantidad || 0;
      const disp      = p.stock - enCarrito;
      return (
        <Modal title="" onClose={() => setProductoDetalle(null)}>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-48 h-48 flex-shrink-0 bg-surface-700 rounded-xl overflow-hidden flex items-center justify-center">
              <ProductImage url={p.imagen_url} nombre={p.nombre} size="modal" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {p.marca && (
                <span className="text-xs text-slate-500 uppercase tracking-wide">{p.marca}</span>
              )}
              <h2 className="m-0 text-xl font-semibold text-slate-100">{p.nombre}</h2>
              <p className="m-0 text-3xl font-bold text-cyan-400">${parseFloat(p.precio).toFixed(2)}</p>
              {p.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map(t => (
                    <span key={t.id} className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-700 text-slate-400 border border-surface-600">
                      {t.nombre}
                    </span>
                  ))}
                </div>
              )}
              <StockBadge disponible={disp} enCarrito={enCarrito} />
            </div>
          </div>
          {p.descripcion && (
            <div className="mt-5 p-4 bg-surface-700 rounded-lg border-l-4 border-cyan-400/60">
              <p className="m-0 text-sm text-slate-300 leading-relaxed">{p.descripcion}</p>
            </div>
          )}
          <button
            onClick={() => handleAgregar(p, true)}
            disabled={disp === 0}
            className={`mt-5 w-full py-3 rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer
              ${disp === 0
                ? 'bg-surface-700 text-slate-500 cursor-not-allowed'
                : 'bg-success-500 hover:bg-success-600 text-white'}`}
          >
            {disp === 0 ? 'Sin stock' : '+ Agregar al carrito'}
          </button>
        </Modal>
      );
    })()}

    {/* Toast */}
    {toast.texto && (
      <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border
        ${toast.tipo === 'error'
          ? 'bg-danger-500/10 border-danger-500/40 text-danger-400'
          : 'bg-success-500/10 border-success-500/40 text-success-500'}`}
      >
        {toast.texto}
      </div>
    )}
  </>
);
```

- [ ] **Step 5: Commit**

```bash
cd /home/over/D3v/inventario-real
git add frontend/src/pages/cliente/Catalogo.jsx
git commit -m "feat(cliente): add tag/brand/price filters with sidebar in Catalogo"
```

---

## Task 7: Actualizar `Inventario.jsx`

**Files:**
- Modify: `frontend/src/pages/admin/Inventario.jsx`

- [ ] **Step 1: Agregar imports**

```jsx
import FilterSidebar from '../../components/FilterSidebar';
import TagSelector from '../../components/TagSelector';
import { FILTROS_VACIOS, filtrarProductos } from '../../utils/filtrarProductos';
```

- [ ] **Step 2: Agregar estado de tags y filtros**

Dentro del componente, agregar:

```jsx
const [tags,    setTags]    = useState([]);
const [filtros, setFiltros] = useState(FILTROS_VACIOS);
const [sidebarAbierto, setSidebarAbierto] = useState(false);
```

Y en `FORM_VACIO` al inicio del archivo, agregar `tag_ids: []`:

```js
const FORM_VACIO = { nombre: '', marca: '', precio: '', stock: '', descripcion: '', imagenFile: null, previewUrl: '', imagen_url_existente: '', tag_ids: [] };
```

- [ ] **Step 3: Cargar tags junto a los productos**

Reemplazar el `useEffect` existente:

```jsx
useEffect(() => {
  setCargando(true);
  Promise.all([
    fetch(`${API}/productos`, { headers: authHeader }).then(r => r.json()),
    fetch(`${API}/tags`,      { headers: authHeader }).then(r => r.json()),
  ]).then(([prods, tgs]) => {
    setProductos(prods);
    setTags(tgs);
    setCargando(false);
  });
}, []);
```

- [ ] **Step 4: Actualizar `abrirEditar` para cargar tag_ids del producto**

```jsx
const abrirEditar = (p) => {
  setForm({
    nombre: p.nombre, marca: p.marca || '', precio: p.precio, stock: p.stock,
    descripcion: p.descripcion || '', imagenFile: null,
    previewUrl: p.imagen_url ? `${API}/uploads/${p.imagen_url}` : '',
    imagen_url_existente: p.imagen_url || '',
    tag_ids: (p.tags || []).map(t => t.id)
  });
  setError('');
  setModal(p);
};
```

- [ ] **Step 5: Actualizar `buildFormData` para incluir tag_ids**

```jsx
const buildFormData = () => {
  const fd = new FormData();
  fd.append('nombre',      form.nombre.trim());
  fd.append('marca',       form.marca.trim());
  fd.append('precio',      form.precio);
  fd.append('stock',       form.stock);
  fd.append('descripcion', form.descripcion.trim());
  fd.append('tag_ids',     JSON.stringify(form.tag_ids));
  if (form.imagenFile) fd.append('imagen', form.imagenFile);
  else if (form.imagen_url_existente) fd.append('imagen_url_existente', form.imagen_url_existente);
  return fd;
};
```

- [ ] **Step 6: Reemplazar la lógica de `filtrados`**

Reemplazar la línea:
```jsx
const filtrados = productos.filter(p =>
  p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
  (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()))
);
```

Por:
```jsx
const marcasDisponibles = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();
const filtrados = filtrarProductos(productos, filtros, busqueda);
const limpiarFiltros = () => setFiltros(FILTROS_VACIOS);
```

- [ ] **Step 7: Actualizar el layout del return para incluir sidebar**

Reemplazar el bloque desde `{/* Tabla */}` hasta el cierre de `</main>`, encerrando la tabla en un layout de dos columnas:

```jsx
{/* Layout: sidebar + tabla */}
<div className="flex gap-6 items-start">
  <div className={`${sidebarAbierto ? 'block' : 'hidden'} lg:block`}>
    <FilterSidebar
      tags={tags}
      marcas={marcasDisponibles}
      filtros={filtros}
      onChange={setFiltros}
      onLimpiar={limpiarFiltros}
    />
  </div>

  <div className="flex-1 min-w-0">
    {/* Tabla — el markup interno es idéntico al original; solo cambia `filtrados` en el .map() */}
    <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700 text-slate-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left w-16">Imagen</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Marca</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Descripción</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {filtrados.length === 0 && !cargando ? (
              <tr>
                <td colSpan="7" className="text-center py-16 text-slate-500">
                  No se encontraron productos.
                </td>
              </tr>
            ) : filtrados.map(p => (
              <tr key={p.id} className="hover:bg-surface-700/50 transition-colors">
                <td className="px-4 py-3">
                  {p.imagen_url
                    ? <img src={`${API}/uploads/${p.imagen_url}`} alt={p.nombre} className="w-12 h-12 object-cover rounded-lg" />
                    : <div className="w-12 h-12 bg-surface-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10"/></svg>
                      </div>
                  }
                </td>
                <td className="px-4 py-3 font-medium text-slate-100">{p.nombre}</td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{p.marca || <span className="text-slate-600">—</span>}</td>
                <td className="px-4 py-3 text-right text-cyan-400 font-semibold">${parseFloat(p.precio).toFixed(2)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${p.stock === 0 ? 'text-danger-400' : p.stock <= 3 ? 'text-warning-400' : 'text-slate-300'}`}>
                  {p.stock}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs max-w-xs hidden lg:table-cell">
                  {p.descripcion
                    ? <span title={p.descripcion}>{p.descripcion.slice(0, 60)}{p.descripcion.length > 60 ? '…' : ''}</span>
                    : <span className="text-slate-600">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 border border-warning-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(p.id, p.nombre)}
                      className="bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 border border-danger-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <p className="text-slate-600 text-xs mt-3">
      {filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}{busqueda ? ` para "${busqueda}"` : ''}
    </p>
  </div>
</div>
```

Agregar también el botón de filtros mobile junto a la barra de búsqueda (igual que en Catálogo):

```jsx
<div className="flex gap-3 mb-6">
  {/* barra búsqueda existente */}
  <button
    onClick={() => setSidebarAbierto(v => !v)}
    className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer
      ${sidebarAbierto
        ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300'
        : 'bg-surface-800 border-surface-700 text-slate-400 hover:text-slate-200'}`}
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
    </svg>
    Filtros
  </button>
</div>
```

- [ ] **Step 8: Agregar sección Tags al modal del producto**

Dentro del `<form>` del modal, antes del bloque `{/* Imagen */}`, agregar:

```jsx
{/* Tags */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-2">Tags</label>
  <TagSelector
    tags={tags}
    selectedIds={form.tag_ids}
    onChange={ids => setForm(prev => ({ ...prev, tag_ids: ids }))}
    token={token}
  />
</div>
```

- [ ] **Step 9: Commit**

```bash
cd /home/over/D3v/inventario-real
git add frontend/src/pages/admin/Inventario.jsx
git commit -m "feat(admin): add tag/brand/price filters and tag assignment to Inventario"
```

---

## Task 8: Actualizar `Reportes.jsx` (superadmin)

**Files:**
- Modify: `frontend/src/pages/superadmin/Reportes.jsx`

- [ ] **Step 1: Agregar imports y estado**

```jsx
import { FILTROS_VACIOS, filtrarProductos } from '../../utils/filtrarProductos';
```

Dentro del componente, agregar:

```jsx
const [tags,    setTags]    = useState([]);
const [filtros, setFiltros] = useState(FILTROS_VACIOS);
```

- [ ] **Step 2: Cargar tags junto a los productos**

Reemplazar el `useEffect` existente:

```jsx
useEffect(() => {
  setCargando(true);
  Promise.all([
    fetch(`${API}/productos`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    fetch(`${API}/tags`,      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  ]).then(([prods, tgs]) => {
    setProductos(prods);
    setTags(tgs);
    setCargando(false);
  });
}, []);
```

- [ ] **Step 3: Calcular productos filtrados y stats reactivas**

Reemplazar las líneas de cálculo de stats:

```jsx
const marcasDisponibles = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();
const filtrados         = filtrarProductos(productos, filtros);
const hayFiltros        = filtros.tagIds.length > 0 || filtros.marcas.length > 0 ||
                          filtros.precioMin !== '' || filtros.precioMax !== '';

const totalProductos  = filtrados.length;
const valorInventario = filtrados.reduce((s, p) => s + p.precio * p.stock, 0);
const sinStock        = filtrados.filter(p => p.stock === 0).length;
const masStock        = filtrados.reduce((max, p) => p.stock > (max?.stock ?? -1) ? p : max, null);
```

- [ ] **Step 4: Agregar barra de filtros horizontal encima de las stats**

Dentro del `return`, entre el `<h2>` y las tarjetas de stats, agregar:

```jsx
{/* Barra de filtros horizontal */}
<div className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 mb-6 flex flex-wrap gap-3 items-end">
  <div>
    <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Tag</p>
    <select
      value={filtros.tagIds[0] || ''}
      onChange={e => setFiltros(f => ({ ...f, tagIds: e.target.value ? [parseInt(e.target.value)] : [] }))}
      className="input-dark text-sm py-1.5 w-40"
    >
      <option value="">Todos</option>
      {tags.map(t => (
        <option key={t.id} value={t.id}>{t.nombre}</option>
      ))}
    </select>
  </div>
  <div>
    <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Marca</p>
    <select
      value={filtros.marcas[0] || ''}
      onChange={e => setFiltros(f => ({ ...f, marcas: e.target.value ? [e.target.value] : [] }))}
      className="input-dark text-sm py-1.5 w-40"
    >
      <option value="">Todas</option>
      {marcasDisponibles.map(m => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  </div>
  <div>
    <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Precio</p>
    <div className="flex items-center gap-2">
      <input
        type="number" min="0" placeholder="Mín"
        value={filtros.precioMin}
        onChange={e => setFiltros(f => ({ ...f, precioMin: e.target.value }))}
        className="input-dark text-sm py-1.5 w-24"
      />
      <span className="text-slate-600 text-xs">—</span>
      <input
        type="number" min="0" placeholder="Máx"
        value={filtros.precioMax}
        onChange={e => setFiltros(f => ({ ...f, precioMax: e.target.value }))}
        className="input-dark text-sm py-1.5 w-24"
      />
    </div>
  </div>
  {hayFiltros && (
    <button
      onClick={() => setFiltros(FILTROS_VACIOS)}
      className="text-xs text-cyan-400 hover:text-cyan-300 bg-transparent border-none cursor-pointer self-end pb-1.5"
    >
      Limpiar filtros
    </button>
  )}
</div>
```

- [ ] **Step 5: Actualizar la tabla para usar `filtrados`**

Reemplazar `{productos.map(p => (` por `{filtrados.map(p => (`.

Reemplazar `{productos.length === 0 && !cargando && (` por `{filtrados.length === 0 && !cargando && (`.

Actualizar el pie de tabla:

```jsx
<p className="text-slate-600 text-xs mt-3">
  {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
  {hayFiltros ? ' (filtrados)' : ''} · {sinStock} sin stock
</p>
```

- [ ] **Step 6: Commit**

```bash
cd /home/over/D3v/inventario-real
git add frontend/src/pages/superadmin/Reportes.jsx
git commit -m "feat(superadmin): add tag/brand/price filters to Reportes"
```

---

## Task 9: Verificación end-to-end

- [ ] **Step 1: Verificar build limpio**

```bash
cd /home/over/D3v/inventario-real/frontend && pnpm build
```

Resultado esperado: `✓ built in ...ms` sin errores.

- [ ] **Step 2: Prueba manual — asignar tags a un producto**

1. Login como admin → Inventario
2. Editar un producto → verificar que aparece la sección Tags con chips
3. Seleccionar un tag existente y guardar
4. Verificar que el tag aparece en la tarjeta del catálogo

- [ ] **Step 3: Prueba manual — filtrar como cliente**

1. Login como cliente → Catálogo
2. En el sidebar, seleccionar un tag → verificar que el grid se filtra
3. Combinar tag + marca → verificar que aplica AND
4. Poner precio mín/máx → verificar rango
5. "Limpiar" → verificar que vuelven todos los productos

- [ ] **Step 4: Prueba manual — crear tag nuevo**

1. Login como admin → Inventario → editar producto
2. Click "+ Nuevo tag" → escribir nombre → seleccionar tipo → Crear
3. Verificar que el nuevo tag aparece en el sidebar del catálogo

- [ ] **Step 5: Commit final**

```bash
cd /home/over/D3v/inventario-real
git add docs/
git commit -m "docs: add tags y filtros implementation plan"
```
