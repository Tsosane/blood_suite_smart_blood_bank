const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { bloodType, status, hospitalId } = req.query;
    let query = `
      SELECT bi.*, h.name as hospital_name
      FROM blood_inventory bi
      JOIN hospitals h ON bi.hospital_id = h.id
      WHERE 1=1
    `;
    const params = [];

    if (bloodType) {
      params.push(bloodType);
      query += ` AND bi.blood_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND bi.status = $${params.length}`;
    }
    if (hospitalId) {
      params.push(hospitalId);
      query += ` AND bi.hospital_id = $${params.length}`;
    }

    query += ' ORDER BY bi.expiry_date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const summary = await pool.query(`
      SELECT 
        blood_type,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
        COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND status = 'available' THEN 1 END) as expiring_soon
      FROM blood_inventory
      GROUP BY blood_type
      ORDER BY blood_type
    `);

    const total = await pool.query(`
      SELECT 
        COUNT(*) as total_units,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_units,
        COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '3 days' AND status = 'available' THEN 1 END) as critical_expiry
      FROM blood_inventory
    `);

    res.json({
      byBloodType: summary.rows,
      totals: total.rows[0]
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({ error: 'Failed to get inventory summary' });
  }
});

router.post('/', authenticateToken, authorizeRoles('hospital', 'blood_bank', 'admin'), async (req, res) => {
  try {
    const { hospitalId, bloodType, unitNumber, collectionDate, expiryDate, volumeMl, storageLocation } = req.body;

    const result = await pool.query(`
      INSERT INTO blood_inventory (hospital_id, blood_type, unit_number, collection_date, expiry_date, volume_ml, storage_location)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [hospitalId, bloodType, unitNumber, collectionDate, expiryDate, volumeMl || 450, storageLocation]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Failed to add inventory' });
  }
});

router.put('/:id/status', authenticateToken, authorizeRoles('hospital', 'blood_bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(`
      UPDATE blood_inventory SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blood unit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update inventory status error:', error);
    res.status(500).json({ error: 'Failed to update inventory status' });
  }
});

router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const result = await pool.query(`
      SELECT bi.*, h.name as hospital_name
      FROM blood_inventory bi
      JOIN hospitals h ON bi.hospital_id = h.id
      WHERE bi.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1
        AND bi.status = 'available'
      ORDER BY bi.expiry_date ASC
    `, [days]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get expiring inventory error:', error);
    res.status(500).json({ error: 'Failed to get expiring inventory' });
  }
});

module.exports = router;
