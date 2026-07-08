const express = require('express');
const router = express.Router();
const db = require('../db');

// @route   POST /api/auth/login
// @desc    Authenticate user & get role
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    // Note: In production, passwords must be hashed (e.g., bcrypt). 
    // Using plain text here purely for hackathon demonstration speed.
    const [users] = await db.query(
      'SELECT id, username, role, name FROM users WHERE username = ? AND password = ?', 
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user details without the password
    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;