// Mock routes for when database is not available
const express = require('express');
const router = express.Router();

// Mock data for demonstration
const mockDonors = [
  { id: 1, name: 'John Doe', blood_type: 'O+', district: 'Maseru', last_donation: '2024-01-15' },
  { id: 2, name: 'Jane Smith', blood_type: 'A-', district: 'Berea', last_donation: '2024-01-10' }
];

const mockInventory = [
  { blood_type: 'O+', units: 15, last_updated: '2024-01-20' },
  { blood_type: 'A-', units: 8, last_updated: '2024-01-20' },
  { blood_type: 'B+', units: 12, last_updated: '2024-01-20' }
];

// Mock donor routes
router.get('/donors', (req, res) => {
  res.json({ donors: mockDonors });
});

// Mock inventory routes
router.get('/inventory', (req, res) => {
  res.json({ inventory: mockInventory });
});

// Mock requests routes
router.get('/requests', (req, res) => {
  res.json({ requests: [] });
});

// Mock hospitals routes
router.get('/hospitals', (req, res) => {
  res.json({ hospitals: [] });
});

// Mock analytics routes
router.get('/analytics', (req, res) => {
  res.json({ 
    total_donors: mockDonors.length,
    total_units: mockInventory.reduce((sum, item) => sum + item.units, 0),
    recent_donations: 5
  });
});

module.exports = router;
