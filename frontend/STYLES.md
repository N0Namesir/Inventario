# FasTech — Sistema de Estilos

## Stack
- **Tailwind CSS v4** con plugin Vite (`@tailwindcss/vite`) — sin postcss.config.js
- **Fuente:** Inter (Google Fonts, 400/500/600/700)
- **Tema:** oscuro exclusivo (no hay modo claro)
- Configuración centralizada en `src/index.css` con `@theme`

---

## Tokens de Diseño (`@theme` en index.css)

### Fondos
| Token            | Hex       | Uso principal                    |
|------------------|-----------|----------------------------------|
| `navy-950`       | `#0d0d1a` | Fondo de Login                   |
| `navy-900`       | `#1a1a2e` | Fondo global / Navbar            |
| `navy-800`       | `#16213e` | Fondo de páginas de contenido    |
| `navy-700`       | `#1f2a4a` | Borde del Navbar                 |
| `surface-800`    | `#252538` | Cards, modales, paneles          |
| `surface-700`    | `#2e2e45` | Inputs, separadores, header cards|
| `surface-600`    | `#3a3a55` | Bordes de inputs, hover sutil    |

### Acento
| Token        | Hex       | Uso                                  |
|--------------|-----------|--------------------------------------|
| `cyan-400`   | `#4fc3f7` | Logo, precios, CTAs, bordes activos  |
| `cyan-300`   | `#81d4fa` | Hover de `cyan-400`                  |
| `cyan-500`   | `#29b6f6` | Active state                         |

### Semánticos
| Token           | Hex       | Uso                              |
|-----------------|-----------|----------------------------------|
| `success-500`   | `#22c55e` | Botón agregar, estado completada |
| `success-600`   | `#16a34a` | Hover de success                 |
| `danger-500`    | `#ef4444` | Eliminar, badge carrito          |
| `danger-400`    | `#f87171` | Texto de error                   |
| `warning-500`   | `#f59e0b` | Estado pendiente                 |
| `warning-400`   | `#fbbf24` | Texto de advertencia             |

### Texto (Tailwind built-in)
| Clase           | Uso                         |
|-----------------|-----------------------------|
| `text-slate-100`| Texto principal             |
| `text-slate-300`| Texto secundario importante |
| `text-slate-400`| Texto secundario            |
| `text-slate-500`| Texto muted / labels        |
| `text-slate-600`| Texto muy sutil             |

---

## Componentes de Utilidad (`@layer components`)

### `.input-dark`
Input estándar para todos los formularios del proyecto.
```
bg-surface-700 border border-surface-600 rounded-lg px-3 py-2.5 text-sm
text-slate-100 placeholder:text-slate-500
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400
```
Usar en: Login, Carrito (tarjeta, PayPal, transferencia), futuros formularios.

### `.btn-primary`
Botón CTA principal (cyan sobre navy).
```
bg-cyan-400 text-navy-950 font-semibold py-2.5 rounded-lg w-full
hover:bg-cyan-300 active:bg-cyan-500
disabled:opacity-50 disabled:cursor-not-allowed
```

### `.badge-estado`
Pill para mostrar estado de órdenes. Combinar con clases de color:
```jsx
const badgeEstado = {
  pendiente:  'bg-warning-500/10 text-warning-400 border-warning-500/30',
  completada: 'bg-success-500/10 text-success-500 border-success-500/30',
  cancelada:  'bg-danger-500/10  text-danger-400  border-danger-500/30',
};
// Uso: <span className={`badge-estado ${badgeEstado[orden.estado]}`}>
```

---

## Convención de Orden de Clases

```
layout → espaciado → fondo/borde → tipografía → estado → interacción
```
Ejemplo: `flex items-center gap-4 px-5 py-3 bg-surface-700 border border-surface-600 text-sm text-slate-300 rounded-lg hover:bg-surface-600 transition-colors`

**Regla:** No mezclar inline styles con clases Tailwind en el mismo elemento. Si un valor es realmente dinámico (calculado en JS), usar inline style solo para ese valor.

---

## Responsive (mobile-first)

| Breakpoint | Min-width | Comportamiento                              |
|------------|-----------|---------------------------------------------|
| base       | 0px       | 1 col, stack vertical, texto base           |
| `sm:`      | 640px     | Grid 2 cols en Catálogo, cols ocultas tabla |
| `lg:`      | 1024px    | Grid 3-4 cols, layout 2 col en Carrito      |
| `xl:`      | 1280px    | Grid 4 cols en Catálogo                     |

### Patrones por página
- **Navbar:** links ocultos en mobile con `hidden sm:flex`
- **Catalogo:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Carrito:** `flex-col lg:flex-row` — resumen sticky en desktop (`lg:sticky lg:top-20`)
- **MisOrdenes:** tabla con `overflow-x-auto`, columna de precio oculta en mobile (`hidden sm:table-cell`)
- **Modal:** `w-full max-w-2xl mx-4` — full-width en mobile con margen

---

## Sombras Personalizadas

```css
--shadow-card:       0 2px 8px rgba(0,0,0,0.35)    /* card en reposo */
--shadow-card-hover: 0 8px 24px rgba(0,0,0,0.55)   /* card al hover */
--shadow-modal:      0 20px 60px rgba(0,0,0,0.7)   /* modales */
--shadow-nav:        0 2px 12px rgba(0,0,0,0.4)    /* navbar */
```

---

## Cómo Agregar un Nuevo Color al Tema

1. Añadir en `src/index.css` dentro de `@theme`:
   ```css
   --color-brand-500: #hex;
   ```
2. Usar en clases Tailwind como `bg-brand-500`, `text-brand-500`, `border-brand-500`.
3. Documentar en esta tabla si es un color de uso frecuente.

---

## Páginas Pendientes de Migrar (Admin / SuperAdmin)

- `pages/admin/Inventario.jsx` — CRUD de productos, tabla con acciones
- `pages/admin/Pedidos.jsx` — gestión de órdenes con cambio de estado
- `pages/superadmin/Usuarios.jsx` — tabla de usuarios con eliminar
- `pages/superadmin/Reportes.jsx` — tarjetas de estadísticas y tabla de inventario
