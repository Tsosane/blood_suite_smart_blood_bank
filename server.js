require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = require('./src/config/database');

// Conditional route loading based on database availability
if (pool) {
  const authRoutes = require('./src/routes/auth');
  const donorRoutes = require('./src/routes/donors');
  const inventoryRoutes = require('./src/routes/inventory');
  const requestRoutes = require('./src/routes/requests');
  const hospitalRoutes = require('./src/routes/hospitals');
  const notificationRoutes = require('./src/routes/notifications');
  const analyticsRoutes = require('./src/routes/analytics');

  app.use('/api/auth', authRoutes);
  app.use('/api/donors', donorRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/hospitals', hospitalRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
} else {
  console.log('Using mock routes - database not configured');
  const mockRoutes = require('./routes-mock');
  app.use('/api/donors', mockRoutes);
  app.use('/api/inventory', mockRoutes);
  app.use('/api/requests', mockRoutes);
  app.use('/api/hospitals', mockRoutes);
  app.use('/api/analytics', mockRoutes);
  
  // Mock auth route
  app.post('/api/auth/login', (req, res) => {
    res.json({ 
      message: 'Mock login - database not configured',
      user: { id: 1, email: 'demo@example.com', role: 'admin' },
      token: 'mock-token'
    });
  });
  
  app.post('/api/auth/register', (req, res) => {
    res.json({ 
      message: 'Mock registration - database not configured',
      user: { id: 1, email: req.body.email, role: 'donor' }
    });
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Blood Suite API is running' });
});

app.get('/api/districts', (req, res) => {
  res.json([
    'Maseru', 'Berea', 'Leribe', 'Butha-Buthe', 'Mokhotlong',
    'Thaba-Tseka', 'Qacha\'s Nek', 'Quthing', 'Mohale\'s Hoek', 'Mafeteng'
  ]);
});

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const initDatabase = async () => {
  try {
    if (!pool) {
      console.log('Database not configured - skipping schema initialization');
      return;
    }
    
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
