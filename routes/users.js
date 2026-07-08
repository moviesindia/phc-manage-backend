const express = require('express');
const router = express.Router();
const db = require('../db');

// @route   GET /api/users
// @desc    Get all users (Hackathon demo: includes passwords for admin visibility)
router.get('/', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, password, role, name FROM users ORDER BY role ASC');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// @route   POST /api/users
// @desc    Add a new Doctor, Staff, or Admin
router.post('/', async (req, res) => {
  const { username, password, role, name } = req.body;
  
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: 'Please provide all fields' });
  }

  try {
    await db.query(
      'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
      [username, password, role, name]
    );
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    // Catch duplicate username errors from MySQL
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists. Choose another.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Remove a user from the system
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;