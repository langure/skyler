const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 80; // Choose your desired port

// Environment variable setup
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'SUPER_SECRET_KEY';

// Database setup
const db = new sqlite3.Database('errors.db');
db.run(`CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Middleware for authentication
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader.split(' ')[1] !== AUTH_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// API Endpoints
app.use(express.json());

app.post('/registerError', authenticate, (req, res) => {
    const errorData = req.body;
    db.run('INSERT INTO errors (error) VALUES (?)', [errorData], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Error registered successfully' });
    });
});

app.get('/returnErrors', authenticate, (req, res) => {
    const { start, finish } = req.query;
    // Date validation
    const isValidDate = (dateStr) => {
        const timestamp = Date.parse(dateStr);
        return !isNaN(timestamp);
    };

    if (!isValidDate(start) || !isValidDate(finish)) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid date format. Please provide dates in a valid format (e.g., ISO 8601).',
            receivedDates: { start, finish } // Echo back the received dates
        });
    }

    db.all('SELECT * FROM errors WHERE timestamp BETWEEN ? AND ?', [start, finish], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/getLast', authenticate, (req, res) => {
    const limit = parseInt(req.query.limit, 10); // Get limit from query parameter

    if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid limit. Please provide a positive integer.'
        });
    }

    db.all(`SELECT * FROM errors ORDER BY timestamp DESC LIMIT ?`, [limit], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/test', authenticate, (req, res) => {
    res.send('ok');
});

app.get('/', (req, res) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Skyler</title>
        </head>
        <body>
            <h1>Skyler rules</h1>
            <p>Your error service is up and running.</p>
        </body>
        </html>
    `;
    res.send(html);
});

app.listen(port, () => {
    console.log(`Error service listening at http://localhost:${port}`);
});
