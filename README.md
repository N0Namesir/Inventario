# Fastech Inventario

Sistema de gestión de inventario y ventas con control de acceso por roles, desarrollado como proyecto escolar.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS v4 |
| Backend | Node.js + Express 5 |
| Base de datos | MariaDB (Docker) |
| Auth | JWT + bcrypt |
| Uploads | Multer |

---

## Arquitectura

```
inventario-real/
├── frontend/          # Vite + React
│   └── src/
│       ├── pages/
│       │   ├── admin/         # Inventario, Pedidos, Reportes
│       │   ├── cliente/       # Catálogo, Carrito, Mis Órdenes
│       │   └── superadmin/    # Usuarios
│       ├── components/        # Navbar, Modal, FilterSidebar, TagSelector
│       ├── context/           # CarritoContext
│       └── utils/             # filtrarProductos.js
└── backend/           # Express REST API
    ├── server.js
    └── seed.js
```

---

## Roles y accesos

| Rol | Acceso |
|-----|--------|
| **superadmin** | Gestión de usuarios + todo lo de admin |
| **admin** | Inventario, pedidos, reportes |
| **cliente** | Catálogo, carrito, mis órdenes |

---

## Primeros pasos

### 1. Base de datos (Docker)

```bash
docker run -d \
  --name fastech-db \
  -e MYSQL_ROOT_PASSWORD=tu_password \
  -e MYSQL_DATABASE=fastech_db \
  -p 3306:3306 \
  mariadb:latest
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales
pnpm install
node seed.js      # Carga productos y usuarios de prueba
node server.js
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

La app estará disponible en `http://localhost:5173`.

---

## Variables de entorno

Copia `backend/.env.example` a `backend/.env` y configura:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=fastech_db

JWT_SECRET=un_string_largo_y_aleatorio
```

---

## Usuarios de prueba

Después de ejecutar `seed.js`:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| superadmin | super@fastech.com | super123 |
| admin | admin@fastech.com | admin123 |
| cliente | cliente@fastech.com | cliente123 |

---

## Funcionalidades principales

- Catálogo de productos con filtros por tag, marca y rango de precio
- Carrito de compras con múltiples métodos de pago
- Gestión de inventario (CRUD de productos con imágenes)
- Sistema de tags/categorías con relación many-to-many
- Reportes de ventas con filtros
- Gestión de usuarios y roles
- Rutas protegidas por rol con JWT

---

## API — endpoints principales

```
POST   /api/auth/login
GET    /api/productos
POST   /api/productos
PUT    /api/productos/:id
DELETE /api/productos/:id
GET    /api/pedidos
POST   /api/pedidos
GET    /api/usuarios          # solo superadmin
```
