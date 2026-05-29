# Fastech Inventario

Sistema de gestión de inventario y ventas con control de acceso por roles.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS v4 |
| Backend | Node.js + Express 5 |
| Base de datos | MariaDB |
| Auth | JWT + bcrypt |
| Uploads | Multer |

---

## Requisitos previos

- **Node.js** 18 o superior → [nodejs.org](https://nodejs.org)
- **pnpm** → `npm install -g pnpm`
- **MariaDB** corriendo en tu sistema (puerto 3306)

---

## Instalación paso a paso

### 1. Crear la base de datos

Abre la consola de MariaDB e importa el schema:

```bash
mariadb -u root -p < database/schema.sql
```

Esto crea la base de datos `fastech_db` con todas sus tablas.

> Si prefieres hacerlo dentro de la consola de MariaDB:
> ```sql
> SOURCE /ruta/absoluta/al/proyecto/database/schema.sql;
> ```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` con tus credenciales de MariaDB:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_de_mariadb
DB_NAME=fastech_db

JWT_SECRET=cambia_esto_por_un_string_largo_y_aleatorio
```

### 3. Instalar dependencias del backend y cargar datos de prueba

```bash
cd backend
pnpm install
pnpm seed
```

`pnpm seed` crea los usuarios de prueba en la base de datos.

### 4. Iniciar el backend

```bash
pnpm start
```

El servidor queda corriendo en `http://localhost:5000`.

### 5. Instalar dependencias del frontend e iniciar

Abre una **nueva terminal**:

```bash
cd frontend
pnpm install
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| superadmin | super@fastech.com | super123 |
| admin | admin@fastech.com | admin123 |
| cliente | cliente@fastech.com | cliente123 |

---

## Estructura del proyecto

```
inventario-real/
├── database/
│   └── schema.sql          # Schema completo de la BD
├── backend/
│   ├── server.js           # API REST (Express)
│   ├── seed.js             # Datos iniciales (usuarios)
│   ├── uploads/            # Imágenes de productos
│   └── .env.example        # Plantilla de variables de entorno
└── frontend/
    └── src/
        ├── pages/
        │   ├── admin/      # Inventario, Pedidos, Reportes
        │   ├── cliente/    # Catálogo, Carrito, Mis Órdenes
        │   └── superadmin/ # Usuarios
        ├── components/     # Navbar, Modal, FilterSidebar, TagSelector
        ├── context/        # CarritoContext
        └── utils/          # filtrarProductos.js
```

---

## Roles y accesos

| Rol | Acceso |
|-----|--------|
| **superadmin** | Gestión de usuarios + todo lo de admin |
| **admin** | Inventario, pedidos, reportes |
| **cliente** | Catálogo, carrito, mis órdenes |

---

## Funcionalidades

- Catálogo de productos con filtros por tag, marca y rango de precio
- Carrito de compras con múltiples métodos de pago
- Gestión de inventario (CRUD de productos con imágenes)
- Sistema de tags/categorías con relación many-to-many
- Reportes de ventas con filtros
- Gestión de usuarios y roles
- Rutas protegidas por rol con JWT

---

## Solución de problemas comunes

**Error al conectar con la BD**  
Verifica que MariaDB esté corriendo y que las credenciales en `.env` sean correctas.

```bash
# Comprobar que MariaDB está activo (Linux con systemd)
sudo systemctl status mariadb
```

**Puerto 5000 en uso**  
Otra aplicación ocupa el puerto. Puedes cambiarlo en la última línea de `backend/server.js` y actualizar `frontend/src/config.js` acordemente.

**`pnpm` no encontrado**  
```bash
npm install -g pnpm
```
