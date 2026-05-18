require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Verifica que el request tenga un JWT válido
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
        req.user = payload; // { id, nombre, email, rol }
        next();
    });
}

// Verifica que el usuario tenga uno de los roles permitidos
function verificarRol(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ error: 'No tienes permiso para esta acción' });
        }
        next();
    };
}

// POST /login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const usuario = results[0];
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ token, rol: usuario.rol, nombre: usuario.nombre });
    });
});

// GET /productos — cualquier usuario autenticado puede ver
app.get('/productos', verificarToken, (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(results);
    });
});

// POST /productos — solo admin y superadmin
app.post('/productos', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    const { nombre, precio, stock } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    if (precio === undefined || precio === null || precio < 0) {
        return res.status(400).json({ error: 'El precio no puede ser negativo' });
    }

    db.query(
        'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)',
        [nombre.trim(), precio, stock],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            res.json({ id: result.insertId, nombre: nombre.trim(), precio, stock });
        }
    );
});

// DELETE /productos/:id — solo admin y superadmin
app.delete('/productos/:id', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    db.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json({ mensaje: 'Producto eliminado' });
    });
});

// GET /usuarios — solo superadmin
app.get('/usuarios', verificarToken, verificarRol('superadmin'), (req, res) => {
    db.query('SELECT id, nombre, email, rol, created_at FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(results);
    });
});

// DELETE /usuarios/:id — solo superadmin (no puede borrarse a sí mismo)
app.delete('/usuarios/:id', verificarToken, verificarRol('superadmin'), (req, res) => {
    if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }
    db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json({ mensaje: 'Usuario eliminado' });
    });
});

// ─── ÓRDENES ────────────────────────────────────────────────────────────────

// Función helper: agrupa filas planas de JOIN en arreglo de órdenes con items
function agruparOrdenes(rows) {
    const map = {};
    rows.forEach(row => {
        if (!map[row.orden_id]) {
            map[row.orden_id] = {
                id:              row.orden_id,
                total:           row.total,
                estado:          row.estado,
                created_at:      row.created_at,
                cliente_nombre:  row.cliente_nombre,
                cliente_email:   row.cliente_email,
                items:           []
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

// POST /ordenes — el cliente crea una orden desde su carrito
app.post('/ordenes', verificarToken, verificarRol('cliente'), (req, res) => {
    const { items } = req.body; // [{ producto_id, cantidad }]

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const ids = items.map(i => i.producto_id);
    db.query('SELECT * FROM productos WHERE id IN (?)', [ids], (err, productos) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });

        // Valida stock suficiente para cada item
        for (const item of items) {
            const prod = productos.find(p => p.id === item.producto_id);
            if (!prod) return res.status(400).json({ error: `Producto no encontrado: ${item.producto_id}` });
            if (prod.stock < item.cantidad) {
                return res.status(400).json({ error: `Stock insuficiente para "${prod.nombre}"` });
            }
        }

        const total = items.reduce((sum, item) => {
            const prod = productos.find(p => p.id === item.producto_id);
            return sum + parseFloat(prod.precio) * item.cantidad;
        }, 0);

        db.query(
            'INSERT INTO ordenes (usuario_id, total) VALUES (?, ?)',
            [req.user.id, total.toFixed(2)],
            (err, result) => {
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

                        // Descuenta stock de cada producto
                        let pendientes = items.length;
                        let huboError = false;
                        items.forEach(item => {
                            db.query(
                                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                                [item.cantidad, item.producto_id],
                                (err) => {
                                    if (err) huboError = true;
                                    if (--pendientes === 0) {
                                        if (huboError) return res.status(500).json({ error: 'Error actualizando stock' });
                                        res.json({ id: ordenId, total: total.toFixed(2), estado: 'pendiente' });
                                    }
                                }
                            );
                        });
                    }
                );
            }
        );
    });
});

// GET /ordenes/mis-ordenes — el cliente ve solo sus propias órdenes
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

// GET /ordenes — admin y superadmin ven todas las órdenes
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

// PUT /ordenes/:id/estado — admin cambia el estado de una orden
app.put('/ordenes/:id/estado', verificarToken, verificarRol('admin', 'superadmin'), (req, res) => {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    // Si se cancela, restaura el stock de los productos
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
                db.query(
                    'UPDATE productos SET stock = stock + ? WHERE id = ?',
                    [item.cantidad, item.producto_id],
                    actualizar
                );
            });
        });
    } else {
        db.query('UPDATE ordenes SET estado = ? WHERE id = ?', [estado, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });
            res.json({ mensaje: 'Estado actualizado' });
        });
    }
});

app.listen(5000, () => console.log('Servidor corriendo en puerto 5000'));
