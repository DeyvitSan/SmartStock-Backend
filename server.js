require('dotenv').config();

const express    = require('express');
const mysql      = require('mysql2/promise');
const cors       = require('cors');
const bodyParser = require('body-parser');
const { sendStockAlert } = require('./firebase');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Pool de conexiones con mysql2/promise
const db = mysql.createPool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Verificar conexión al arrancar
db.getConnection()
    .then(() => console.log('Conectado a MySQL exitosamente'))
    .catch(err => console.error('Error conectando a MySQL:', err));

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/login', async (req, res) => {
    console.log("-> Datos recibidos:", req.body);
    const { email, password } = req.body;
    try {
        const [results] = await db.query(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password]
        );
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [email, password, name]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── FCM TOKEN ─────────────────────────────────────────────────────────────────

app.post('/save-token', async (req, res) => {
    const { token } = req.body;
    try {
        await db.query(
            'INSERT INTO device_tokens (token) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM device_tokens WHERE token = ?)',
            [token, token]
        );
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

app.get('/products', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM products');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/products', async (req, res) => {
    const { name, price, quantity, user_id } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO products (name, price, quantity, user_id) VALUES (?, ?, ?, ?)',
            [name, price, quantity, user_id]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/products/:id', async (req, res) => {
    const { name, price, quantity } = req.body;
    const { id } = req.params;
    try {
        await db.query(
            'UPDATE products SET name=?, price=?, quantity=? WHERE id=?',
            [name, price, quantity, id]
        );
        // Notificación push si stock bajo
        if (quantity <= 5) {
            const [rows] = await db.query('SELECT token FROM device_tokens');
            const tokens = rows.map(r => r.token);
            if (tokens.length > 0) {
                await sendStockAlert(tokens, name, quantity);
            }
        }
        res.json({ success: true, message: 'Producto actualizado' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'DELETE FROM products WHERE id = ?', [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SERVER ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
});