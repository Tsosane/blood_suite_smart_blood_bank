const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const totalDonors = await pool.query('SELECT COUNT(*) FROM donors');
    const totalHospitals = await pool.query('SELECT COUNT(*) FROM hospitals WHERE is_verified = true');
    const availableUnits = await pool.query("SELECT COUNT(*) FROM blood_inventory WHERE status = 'available'");
    const pendingRequests = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status = 'pending'");
    const urgentRequests = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status = 'pending' AND urgency IN ('urgent', 'critical')");
    const expiringUnits = await pool.query("SELECT COUNT(*) FROM blood_inventory WHERE status = 'available' AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'");

    const recentDonations = await pool.query(`
      SELECT COUNT(*) FROM donations
      WHERE donation_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    const bloodTypeStock = await pool.query(`
      SELECT blood_type,
             COUNT(CASE WHEN status = 'available' THEN 1 END) as available
      FROM blood_inventory
      GROUP BY blood_type
      ORDER BY blood_type
    `);

    res.json({
      stats: {
        totalDonors: parseInt(totalDonors.rows[0].count),
        totalHospitals: parseInt(totalHospitals.rows[0].count),
        availableUnits: parseInt(availableUnits.rows[0].count),
        pendingRequests: parseInt(pendingRequests.rows[0].count),
        urgentRequests: parseInt(urgentRequests.rows[0].count),
        expiringUnits: parseInt(expiringUnits.rows[0].count),
        recentDonations: parseInt(recentDonations.rows[0].count)
      },
      bloodTypeStock: bloodTypeStock.rows
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

router.get('/donations-trend', authenticateToken, authorizeRoles('admin', 'blood_bank'), async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', donation_date) as month,
        COUNT(*) as donations,
        SUM(volume_ml) as total_volume
      FROM donations
      WHERE donation_date >= CURRENT_DATE - INTERVAL '1 month' * $1
      GROUP BY DATE_TRUNC('month', donation_date)
      ORDER BY month
    `, [months]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get donations trend error:', error);
    res.status(500).json({ error: 'Failed to get donations trend' });
  }
});

router.get('/district-summary', authenticateToken, authorizeRoles('admin', 'blood_bank'), async (req, res) => {
  try {
    const donorsByDistrict = await pool.query(`
      SELECT district, COUNT(*) as donor_count
      FROM donors
      WHERE district IS NOT NULL
      GROUP BY district
      ORDER BY donor_count DESC
    `);

    const hospitalsByDistrict = await pool.query(`
      SELECT district, COUNT(*) as hospital_count
      FROM hospitals
      WHERE is_verified = true
      GROUP BY district
      ORDER BY hospital_count DESC
    `);

    res.json({
      donors: donorsByDistrict.rows,
      hospitals: hospitalsByDistrict.rows
    });
  } catch (error) {
    console.error('Get district summary error:', error);
    res.status(500).json({ error: 'Failed to get district summary' });
  }
});

module.exports = router;
