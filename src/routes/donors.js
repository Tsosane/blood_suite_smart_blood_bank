const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRoles('admin', 'hospital', 'blood_bank'), async (req, res) => {
  try {
    const { bloodType, district, isEligible } = req.query;
    let query = `
      SELECT d.*, u.email, u.first_name, u.last_name, u.phone
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE u.is_active = true
    `;
    const params = [];

    if (bloodType) {
      params.push(bloodType);
      query += ` AND d.blood_type = $${params.length}`;
    }
    if (district) {
      params.push(district);
      query += ` AND d.district = $${params.length}`;
    }
    if (isEligible !== undefined) {
      params.push(isEligible === 'true');
      query += ` AND d.is_eligible = $${params.length}`;
    }

    query += ' ORDER BY d.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ error: 'Failed to get donors' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalDonors = await pool.query('SELECT COUNT(*) FROM donors');
    const byBloodType = await pool.query(`
      SELECT blood_type, COUNT(*) as count
      FROM donors
      GROUP BY blood_type
      ORDER BY blood_type
    `);
    const byDistrict = await pool.query(`
      SELECT district, COUNT(*) as count
      FROM donors
      WHERE district IS NOT NULL
      GROUP BY district
      ORDER BY count DESC
    `);
    const eligibleDonors = await pool.query('SELECT COUNT(*) FROM donors WHERE is_eligible = true');

    res.json({
      total: parseInt(totalDonors.rows[0].count),
      eligible: parseInt(eligibleDonors.rows[0].count),
      byBloodType: byBloodType.rows,
      byDistrict: byDistrict.rows
    });
  } catch (error) {
    console.error('Get donor stats error:', error);
    res.status(500).json({ error: 'Failed to get donor stats' });
  }
});

router.get('/my-profile', authenticateToken, authorizeRoles('donor'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.email, u.first_name, u.last_name, u.phone
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({ error: 'Failed to get donor profile' });
  }
});

router.put('/my-profile', authenticateToken, authorizeRoles('donor'), async (req, res) => {
  try {
    const { bloodType, dateOfBirth, gender, weight, address, district, emergencyContactName, emergencyContactPhone } = req.body;

    const result = await pool.query(`
      UPDATE donors SET
        blood_type = COALESCE($1, blood_type),
        date_of_birth = COALESCE($2, date_of_birth),
        gender = COALESCE($3, gender),
        weight = COALESCE($4, weight),
        address = COALESCE($5, address),
        district = COALESCE($6, district),
        emergency_contact_name = COALESCE($7, emergency_contact_name),
        emergency_contact_phone = COALESCE($8, emergency_contact_phone),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $9
      RETURNING *
    `, [bloodType, dateOfBirth, gender, weight, address, district, emergencyContactName, emergencyContactPhone, req.user.id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update donor profile error:', error);
    res.status(500).json({ error: 'Failed to update donor profile' });
  }
});

router.get('/my-donations', authenticateToken, authorizeRoles('donor'), async (req, res) => {
  try {
    const donorResult = await pool.query('SELECT id FROM donors WHERE user_id = $1', [req.user.id]);
    if (donorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    const result = await pool.query(`
      SELECT d.*, h.name as hospital_name
      FROM donations d
      LEFT JOIN hospitals h ON d.hospital_id = h.id
      WHERE d.donor_id = $1
      ORDER BY d.donation_date DESC
    `, [donorResult.rows[0].id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Failed to get donations' });
  }
});

module.exports = router;
