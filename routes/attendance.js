const express = require('express');
const router = express.Router();
const db = require('../db');

// @route   GET /api/attendance/today
router.get('/today', async (req, res) => {
  const { doctor_name } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM attendance WHERE doctor_name = ? AND date = CURDATE()',
      [doctor_name]
    );
    res.json({ record: rows[0] });
  } catch (err) {
    console.error("Fetch Today Error:", err);
    res.status(500).json({ error: 'Database error fetching record' });
  }
});

// @route   POST /api/attendance/check-in
router.post('/check-in', async (req, res) => {
  const { doctor_name } = req.body;
  if (!doctor_name) return res.status(400).json({ error: 'Doctor name is required' });

  try {
    // 1. Shift Time Validation
    const [settings] = await db.query('SELECT shift_start, shift_end FROM shift_settings WHERE id = 1');
    if (settings.length > 0) {
      const { shift_start, shift_end } = settings[0];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [sH, sM] = shift_start.split(':').map(Number);
      const [eH, eM] = shift_end.split(':').map(Number);
      
      // If outside shift hours, reject the check-in
      if (currentTime < (sH * 60 + sM) || currentTime > (eH * 60 + eM)) {
        return res.status(400).json({ error: 'Check-in is only allowed during active shift hours' });
      }
    }

    // 2. Prevent Double Check-in
    const [existing] = await db.query(
      'SELECT id FROM attendance WHERE doctor_name = ? AND date = CURDATE()',
      [doctor_name]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'Already checked in today' });

    // 3. BULLETPROOF INSERT
    await db.query(
      "INSERT INTO attendance (doctor_name, date, check_in_time, status) VALUES (?, CURDATE(), NOW(), 'Active')",
      [doctor_name]
    );
    
    res.json({ message: 'Checked in successfully' });
  } catch (err) {
    console.error("Check-in Error:", err);
    res.status(500).json({ error: 'Server error during check-in' });
  }
});

// @route   POST /api/attendance/check-out
router.post('/check-out', async (req, res) => {
  const { doctor_name } = req.body;
  try {
    await db.query(
      "UPDATE attendance SET check_out_time = NOW(), status = 'Completed' WHERE doctor_name = ? AND date = CURDATE()",
      [doctor_name]
    );
    res.json({ message: 'Checked out successfully' });
  } catch (err) {
    console.error("Check-out Error:", err);
    res.status(500).json({ error: 'Server error during check-out' });
  }
});

// @route   GET /api/attendance/logs
router.get('/logs', async (req, res) => {
  try {
    const [logs] = await db.query('SELECT * FROM attendance ORDER BY date DESC, check_in_time DESC');
    res.json(logs);
  } catch (err) {
    console.error("Logs Error:", err);
    res.status(500).json({ error: 'Server error fetching logs' });
  }
});

// @route   GET & PUT /api/attendance/settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shift_settings WHERE id = 1');
    res.json(rows[0] || { shift_start: '09:00', shift_end: '17:00' });
  } catch (err) {
    console.error("Settings Error:", err);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
});

router.put('/settings', async (req, res) => {
  const { shift_start, shift_end } = req.body;
  try {
    await db.query('CREATE TABLE IF NOT EXISTS shift_settings (id INT PRIMARY KEY, shift_start VARCHAR(10), shift_end VARCHAR(10))');
    await db.query('INSERT IGNORE INTO shift_settings (id, shift_start, shift_end) VALUES (1, ?, ?)', [shift_start, shift_end]);
    await db.query('UPDATE shift_settings SET shift_start = ?, shift_end = ? WHERE id = 1', [shift_start, shift_end]);
    res.json({ message: 'Shift timings updated successfully' });
  } catch (err) {
    console.error("Update Settings Error:", err);
    res.status(500).json({ error: 'Server error updating settings' });
  }
});

module.exports = router;