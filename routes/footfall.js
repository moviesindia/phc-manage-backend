const express = require('express');
const router = express.Router();
const db = require('../db');

// @route   GET /api/footfall/today
// @desc    Get total number of visits for today
router.get('/today', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM footfall WHERE DATE(visit_date) = CURDATE()'
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching today\'s footfall' });
  }
});

// @route   GET /api/footfall/recent
// @desc    Get the 10 most recent visits
router.get('/recent', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, patient_name, age, gender, symptoms, visit_date FROM footfall ORDER BY visit_date DESC LIMIT 10'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching recent visits' });
  }
});

// @route   POST /api/footfall
// @desc    Register a new patient visit
router.post('/', async (req, res) => {
  const { patient_name, age, gender, symptoms } = req.body;
  
  if (!patient_name || !age || !gender) {
    return res.status(400).json({ error: 'Please provide name, age, and gender' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO footfall (patient_name, age, gender, symptoms) VALUES (?, ?, ?, ?)',
      [patient_name, age, gender, symptoms || '']
    );
    
    // Fetch the newly inserted record to return to frontend
    const [newRecord] = await db.query('SELECT * FROM footfall WHERE id = ?', [result.insertId]);
    res.status(201).json(newRecord[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding new visit' });
  }
});

module.exports = router;