const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, urgency, hospitalId } = req.query;
    let query = `
      SELECT br.*, h.name as hospital_name,
             u.first_name || ' ' || u.last_name as requested_by_name
      FROM blood_requests br
      JOIN hospitals h ON br.hospital_id = h.id
      LEFT JOIN users u ON br.requested_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND br.status = $${params.length}`;
    }
    if (urgency) {
      params.push(urgency);
      query += ` AND br.urgency = $${params.length}`;
    }
    if (hospitalId) {
      params.push(hospitalId);
      query += ` AND br.hospital_id = $${params.length}`;
    }

    query += ' ORDER BY CASE br.urgency WHEN \'critical\' THEN 1 WHEN \'urgent\' THEN 2 ELSE 3 END, br.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pending = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status = 'pending'");
    const urgent = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE urgency IN ('urgent', 'critical') AND status = 'pending'");
    const fulfilled = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status = 'fulfilled'");
    const byBloodType = await pool.query(`
      SELECT blood_type, COUNT(*) as count, SUM(units_needed) as units_needed
      FROM blood_requests
      WHERE status = 'pending'
      GROUP BY blood_type
    `);

    res.json({
      pending: parseInt(pending.rows[0].count),
      urgent: parseInt(urgent.rows[0].count),
      fulfilled: parseInt(fulfilled.rows[0].count),
      byBloodType: byBloodType.rows
    });
  } catch (error) {
    console.error('Get request stats error:', error);
    res.status(500).json({ error: 'Failed to get request stats' });
  }
});

router.post('/', authenticateToken, authorizeRoles('hospital', 'blood_bank', 'admin'), async (req, res) => {
  try {
    const { hospitalId, bloodType, unitsNeeded, urgency, patientName, patientCondition, notes } = req.body;

    const result = await pool.query(`
      INSERT INTO blood_requests (hospital_id, blood_type, units_needed, urgency, patient_name, patient_condition, notes, requested_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [hospitalId, bloodType, unitsNeeded, urgency || 'normal', patientName, patientCondition, notes, req.user.id]);

    if (urgency === 'critical' || urgency === 'urgent') {
      const donors = await pool.query(`
        SELECT d.id, u.id as user_id FROM donors d
        JOIN users u ON d.user_id = u.id
        WHERE d.blood_type = $1 AND d.is_eligible = true
      `, [bloodType]);

      for (const donor of donors.rows) {
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, priority, related_request_id)
          VALUES ($1, 'urgent_request', 'Urgent Blood Request', $2, 'high', $3)
        `, [donor.user_id, `Urgent need for ${bloodType} blood type. Please donate if you can.`, result.rows[0].id]);
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

router.put('/:id/status', authenticateToken, authorizeRoles('hospital', 'blood_bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, unitsFulfilled } = req.body;

    let query = 'UPDATE blood_requests SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (unitsFulfilled !== undefined) {
      params.push(unitsFulfilled);
      query += `, units_fulfilled = $${params.length}`;
    }
    if (status === 'fulfilled') {
      query += ', fulfilled_at = CURRENT_TIMESTAMP';
    }
    if (status === 'approved') {
      params.push(req.user.id);
      query += `, approved_by = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING *`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

module.exports = router;
