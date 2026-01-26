const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { district, isVerified } = req.query;
    let query = `
      SELECT h.*, u.email
      FROM hospitals h
      JOIN users u ON h.user_id = u.id
      WHERE u.is_active = true
    `;
    const params = [];

    if (district) {
      params.push(district);
      query += ` AND h.district = $${params.length}`;
    }
    if (isVerified !== undefined) {
      params.push(isVerified === 'true');
      query += ` AND h.is_verified = $${params.length}`;
    }

    query += ' ORDER BY h.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Failed to get hospitals' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT h.*, u.email
      FROM hospitals h
      JOIN users u ON h.user_id = u.id
      WHERE h.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ error: 'Failed to get hospital' });
  }
});

router.get('/:id/inventory', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT blood_type,
             COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
             COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
             COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND status = 'available' THEN 1 END) as expiring_soon
      FROM blood_inventory
      WHERE hospital_id = $1
      GROUP BY blood_type
      ORDER BY blood_type
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get hospital inventory error:', error);
    res.status(500).json({ error: 'Failed to get hospital inventory' });
  }
});

router.post('/register', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userId, name, registrationNumber, address, district, city, latitude, longitude, contactPhone, contactEmail } = req.body;

    const result = await pool.query(`
      INSERT INTO hospitals (user_id, name, registration_number, address, district, city, latitude, longitude, contact_phone, contact_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [userId, name, registrationNumber, address, district, city, latitude, longitude, contactPhone, contactEmail]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Register hospital error:', error);
    res.status(500).json({ error: 'Failed to register hospital' });
  }
});

router.put('/:id/verify', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const result = await pool.query(`
      UPDATE hospitals SET is_verified = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [isVerified, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Verify hospital error:', error);
    res.status(500).json({ error: 'Failed to verify hospital' });
  }
});

module.exports = router;
