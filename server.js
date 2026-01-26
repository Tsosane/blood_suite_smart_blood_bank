require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const pool = require('./src/config/database');

const authRoutes = require('./src/routes/auth');
const donorRoutes = require('./src/routes/donors');
const inventoryRoutes = require('./src/routes/inventory');
const requestRoutes = require('./src/routes/requests');
const hospitalRoutes = require('./src/routes/hospitals');
const notificationRoutes = require('./src/routes/notifications');
const analyticsRoutes = require('./src/routes/analytics');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Blood Suite API is running' });
});

app.get('/api/districts', (req, res) => {
  res.json([
    'Maseru', 'Berea', 'Leribe', 'Butha-Buthe', 'Mokhotlong',
    'Thaba-Tseka', 'Qacha\'s Nek', 'Quthing', 'Mohale\'s Hoek', 'Mafeteng'
  ]);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const initDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
};

const PORT = 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Blood Suite server running on http://0.0.0.0:${PORT}`);
  await initDatabase();
});
