require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error(' Error conectando a MySQL:', err);
        return;
    }
    console.log(' Conectado a MySQL exitosamente');
});


app.post('/login', (req, res) => {
    console.log("-> Datos recibidos:", req.body);
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    });
});

app.post('/register', (req, res) => {
    const { email, password, name } = req.body;
    const query = 'INSERT INTO users (email, password, name) VALUES (?, ?, ?)';
    
    db.query(query, [email, password, name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});


// LEER (Read) - Obtener todos
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// CREAR (Create) - Insertar uno nuevo
app.post('/products', (req, res) => {
    const { name, price, quantity, user_id } = req.body;
    const query = 'INSERT INTO products (name, price, quantity, user_id) VALUES (?, ?, ?, ?)';
    
    db.query(query, [name, price, quantity, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// ACTUALIZAR (Update) -
app.put('/products/:id', (req, res) => {
    const { id } = req.params; 
    const { name, price, quantity } = req.body;
    
    const query = 'UPDATE products SET name = ?, price = ?, quantity = ? WHERE id = ?';
    
    db.query(query, [name, price, quantity, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        res.json({ success: true, message: 'Producto actualizado' });
    });
});

// ELIMINAR (Delete) -
app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM products WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        res.json({ success: true, message: 'Producto eliminado' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor CRUD listo en http://localhost:${PORT}`);
});