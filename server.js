const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); // This triggers the DB connection test

const app = express();

// Middleware
app.use(cors()); // Allows our React frontend to talk to this API
app.use(express.json()); // Allows us to parse JSON request bodies


//auth
app.use('/api/auth', require('./routes/auth'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'PHC API is running beautifully! 🚀' });
});

// Placeholder for future routes (we will uncomment these in upcoming phases)
app.use('/api/footfall', require('./routes/footfall'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});