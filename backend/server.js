require('dotenv').config();
const express  = require('express');
const mysql    = require('mysql2');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const path     = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── BASE DE DATOS ──────────────────────────────────────────────────────────

const db = mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar con MySQL:', err.message);
        process.exit(1);
    }
    console.log('Conectado a MySQL');
});

// ─── MULTER (subida de imágenes) ─────────────────────────────────────────────

const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `producto-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Solo se permiten archivos de imagen'));
    }
});

// ─── MIDDLEWARES DE AUTH ─────────────────────────────────────────────────────

function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
        req.user = payload;
        next();
    });
}

function verificarRol(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol))
            return res.status(403).json({ error: 'No tienes permiso para esta acción' });
        next();
    };
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email y contraseña requeridos' });

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const usuario = results[0];
        const valida = await bcrypt.compare(password, usuario.password_hash);
        if (!valida) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ token, rol: usuario.rol, nombre: usuario.nombre });
    });
});

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────

function validarProducto(req, res) {
    const { nombre, precio } = req.body;
    if (!nombre || nombre.trim() === '')
        return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    if (precio === undefined || parseFloat(precio) < 0)
        return res.status(400).json({ error: 'El precio no puede ser negativo' });
    return null;
}

// GET — todos los usuarios autenticados
app.get('/productos', verificarToken, (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(results);
    });
});

// POST — solo admin/superadmin (con imagen opcional)
app.post('/productos', verificarToken, verificarRol('admin', 'superadmin'), upload.single('imagen'), (req, res) => {
    const error = validarProducto(req, res);
    if (error) return;

    const { nombre, marca, precio, stock, descripcion } = req.body;
    const imagen_url = req.file ? req.file.filename : null;

    db.query(
        'INSERT INTO productos (nombre, marca, precio, stock, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre.trim(), marca?.trim() || null, parseFloat(precio), parseInt(stock) || 0, descripcion?.trim() || null, imagen_url],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            res.status(201).json({
                id: result.insertId,
                nombre: nombre.trim(),
                marca: marca?.trim() || null,
                precio: parseFloat(precio),
                stock: parseInt(stock) || 0,
                descripcion: descripcion?.trim() || null,
                imagen_url
            });
        }
    );
});

// PUT — editar producto (con imagen opcional)
app.put('/productos/:id', verificarToken, verificarRol('admin', 'superadmin'), upload.single('imagen'), (req, res) => {
    const error = validarProducto(req, res);
    if (error) return;

    const { nombre, marca, precio, stock, descripcion, imagen_url_existente } = req.body;
    const imagen_url = req.file ? req.file.filename : (imagen_url_existente || null);
    const id = parseInt(req.params.id);

    db.query(
        'UPDATE productos SET nombre = ?, marca = ?, precio = ?, stock = ?, descripcion = ?, imagen_url = ? WHERE id = ?',
        [nombre.trim(), marca?.trim() || null, parseFloat(precio), parseInt(stock) || 0, descripcion?.trim() || null, imagen_url, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
            res.json({
                id,
                nombre: nombre.trim(),
                marca: marca?.trim() || null,
                precio: parseFloat(precio),
                stock: parseInt(stock) || 0,
                descripcion: descripcion?.trim() || null,
                imagen_url
            });
        }
    );
});

// DELETE — solo admin/superadmin
app.delete('/productos/:id', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    db.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json({ mensaje: 'Producto eliminado' });
    });
});

// ─── USUARIOS ────────────────────────────────────────────────────────────────

app.get('/usuarios', verificarToken, verificarRol('superadmin'), (req, res) => {
    db.query('SELECT id, nombre, email, rol, created_at FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(results);
    });
});

app.delete('/usuarios/:id', verificarToken, verificarRol('superadmin'), (req, res) => {
    if (parseInt(req.params.id) === req.user.id)
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });

    db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json({ mensaje: 'Usuario eliminado' });
    });
});

// ─── ÓRDENES ────────────────────────────────────────────────────────────────

function agruparOrdenes(rows) {
    const map = {};
    rows.forEach(row => {
        if (!map[row.orden_id]) {
            map[row.orden_id] = {
                id:             row.orden_id,
                total:          row.total,
                estado:         row.estado,
                created_at:     row.created_at,
                cliente_nombre: row.cliente_nombre,
                cliente_email:  row.cliente_email,
                items:          []
            };
        }
        if (row.nombre_producto) {
            map[row.orden_id].items.push({
                nombre_producto: row.nombre_producto,
                cantidad:        row.cantidad,
                precio_unitario: row.precio_unitario,
                producto_id:     row.producto_id
            });
        }
    });
    return Object.values(map);
}

app.post('/ordenes', verificarToken, verificarRol('cliente'), (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0)
        return res.status(400).json({ error: 'El carrito está vacío' });

    const ids = items.map(i => i.producto_id);
    db.query('SELECT * FROM productos WHERE id IN (?)', [ids], (err, productos) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });

        for (const item of items) {
            const prod = productos.find(p => p.id === item.producto_id);
            if (!prod) return res.status(400).json({ error: `Producto no encontrado: ${item.producto_id}` });
            if (prod.stock < item.cantidad) return res.status(400).json({ error: `Stock insuficiente para "${prod.nombre}"` });
        }

        const total = items.reduce((sum, item) => {
            const prod = productos.find(p => p.id === item.producto_id);
            return sum + parseFloat(prod.precio) * item.cantidad;
        }, 0);

        db.query('INSERT INTO ordenes (usuario_id, total) VALUES (?, ?)', [req.user.id, total.toFixed(2)], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            const ordenId = result.insertId;

            const itemValues = items.map(item => {
                const prod = productos.find(p => p.id === item.producto_id);
                return [ordenId, item.producto_id, prod.nombre, item.cantidad, prod.precio];
            });

            db.query(
                'INSERT INTO orden_items (orden_id, producto_id, nombre_producto, cantidad, precio_unitario) VALUES ?',
                [itemValues],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Error del servidor' });

                    let pendientes = items.length;
                    let huboError = false;
                    items.forEach(item => {
                        db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id], (err) => {
                            if (err) huboError = true;
                            if (--pendientes === 0) {
                                if (huboError) return res.status(500).json({ error: 'Error actualizando stock' });
                                res.json({ id: ordenId, total: total.toFixed(2), estado: 'pendiente' });
                            }
                        });
                    });
                }
            );
        });
    });
});

app.get('/ordenes/mis-ordenes', verificarToken, verificarRol('cliente'), (req, res) => {
    const sql = `
        SELECT o.id AS orden_id, o.total, o.estado, o.created_at,
               u.nombre AS cliente_nombre, u.email AS cliente_email,
               oi.nombre_producto, oi.cantidad, oi.precio_unitario, oi.producto_id
        FROM ordenes o
        JOIN usuarios u ON o.usuario_id = u.id
        LEFT JOIN orden_items oi ON oi.orden_id = o.id
        WHERE o.usuario_id = ?
        ORDER BY o.created_at DESC`;
    db.query(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(agruparOrdenes(rows));
    });
});

app.get('/ordenes', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    const sql = `
        SELECT o.id AS orden_id, o.total, o.estado, o.created_at,
               u.nombre AS cliente_nombre, u.email AS cliente_email,
               oi.nombre_producto, oi.cantidad, oi.precio_unitario, oi.producto_id
        FROM ordenes o
        JOIN usuarios u ON o.usuario_id = u.id
        LEFT JOIN orden_items oi ON oi.orden_id = o.id
        ORDER BY o.created_at DESC`;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(agruparOrdenes(rows));
    });
});

app.put('/ordenes/:id/estado', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    const { estado } = req.body;
    if (!['pendiente', 'completada', 'cancelada'].includes(estado))
        return res.status(400).json({ error: 'Estado inválido' });

    if (estado === 'cancelada') {
        db.query('SELECT * FROM orden_items WHERE orden_id = ?', [req.params.id], (err, items) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            let pendientes = items.length || 1;
            const actualizar = () => {
                if (--pendientes === 0) {
                    db.query('UPDATE ordenes SET estado = ? WHERE id = ?', [estado, req.params.id], (err) => {
                        if (err) return res.status(500).json({ error: 'Error del servidor' });
                        res.json({ mensaje: 'Estado actualizado' });
                    });
                }
            };
            if (items.length === 0) { actualizar(); return; }
            items.forEach(item => {
                db.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [item.cantidad, item.producto_id], actualizar);
            });
        });
    } else {
        db.query('UPDATE ordenes SET estado = ? WHERE id = ?', [estado, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            res.json({ mensaje: 'Estado actualizado' });
        });
    }
});

// ─── ERROR HANDLER GLOBAL ────────────────────────────────────────────────────
// Captura cualquier error no manejado (incluido multer) y devuelve JSON en vez de HTML

app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    const status  = err.status || err.statusCode || 500;
    const mensaje = err.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen es demasiado grande (máximo 5 MB)'
        : err.message || 'Error interno del servidor';
    res.status(status).json({ error: mensaje });
});

// ─── START ───────────────────────────────────────────────────────────────────

app.listen(5000, () => console.log('Servidor corriendo en puerto 5000'));
