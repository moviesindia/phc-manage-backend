const express = require('express');
const router = express.Router();
const db = require('../db');
const { SimpleLinearRegression } = require('ml-regression');

// Helper function to calculate AI metrics for a medicine
const calculateAiMetrics = (dispenses, currentStock) => {
  if (dispenses.length < 2) {
    return { 
      dailyConsumption: 0, 
      daysUntilStockout: 999, 
      suggestedReorder: 0,
      status: currentStock < 50 ? 'Low Stock' : 'Good'
    };
  }

  const x = dispenses.map((_, index) => index + 1);
  const y = dispenses.map(d => d.quantity);

  const regression = new SimpleLinearRegression(x, y);
  
  const nextDayX = x.length + 1;
  const predictedDailyConsumption = Math.max(0, Math.round(regression.predict(nextDayX)));
  
  const avgConsumption = y.reduce((a, b) => a + b, 0) / y.length;
  const dailyConsumption = predictedDailyConsumption > 0 ? predictedDailyConsumption : Math.round(avgConsumption);

  const daysUntilStockout = dailyConsumption > 0 ? Math.floor(currentStock / dailyConsumption) : 999;
  const suggestedReorder = dailyConsumption * 15;

  let status = 'Good';
  if (daysUntilStockout <= 7 || currentStock < 20) status = 'Critical';
  else if (daysUntilStockout <= 15) status = 'Warning';

  return { dailyConsumption, daysUntilStockout, suggestedReorder, status };
};

// @route   GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const [medicines] = await db.query('SELECT * FROM inventory ORDER BY medicine_name ASC');
    
    const [allDispenses] = await db.query(
      'SELECT medicine_id, quantity, dispensed_at FROM medicine_dispenses WHERE dispensed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY dispensed_at ASC'
    );

    const inventoryWithAi = medicines.map(med => {
      const medDispenses = allDispenses.filter(d => d.medicine_id === med.id);
      const aiMetrics = calculateAiMetrics(medDispenses, med.stock_quantity);
      return { ...med, ai: aiMetrics };
    });

    res.json(inventoryWithAi);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching inventory' });
  }
});

// @route   POST /api/inventory/dispense/:id
router.post('/dispense/:id', async (req, res) => {
  const medicineId = req.params.id;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Invalid quantity' });

  try {
    const [meds] = await db.query('SELECT stock_quantity FROM inventory WHERE id = ?', [medicineId]);
    if (meds.length === 0) return res.status(404).json({ error: 'Medicine not found' });
    
    if (meds[0].stock_quantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    await db.query('START TRANSACTION');
    await db.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, medicineId]);
    await db.query('INSERT INTO medicine_dispenses (medicine_id, quantity) VALUES (?, ?)', [medicineId, quantity]);
    await db.query('COMMIT');

    res.json({ message: 'Medicine dispensed successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Server error dispensing medicine' });
  }
});

// --- NEW V2 ROUTES BELOW ---

// @route   POST /api/inventory
// @desc    Add a brand new medicine to the PHC inventory
router.post('/', async (req, res) => {
  const { medicine_name, stock_quantity, expiry_date } = req.body;
  if (!medicine_name || !stock_quantity || !expiry_date) {
    return res.status(400).json({ error: 'Please provide all fields' });
  }
  try {
    await db.query(
      'INSERT INTO inventory (medicine_name, stock_quantity, expiry_date) VALUES (?, ?, ?)',
      [medicine_name, stock_quantity, expiry_date]
    );
    res.status(201).json({ message: 'Medicine added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error adding medicine' });
  }
});

// @route   PUT /api/inventory/restock/:id
// @desc    Update stock when new medicine shipment arrives
router.put('/restock/:id', async (req, res) => {
  const { added_quantity, new_expiry } = req.body;
  if (!added_quantity || added_quantity <= 0 || !new_expiry) {
    return res.status(400).json({ error: 'Invalid quantity or expiry date' });
  }

  try {
    await db.query(
      'UPDATE inventory SET stock_quantity = stock_quantity + ?, expiry_date = ? WHERE id = ?',
      [added_quantity, new_expiry, req.params.id]
    );
    res.json({ message: 'Stock replenished successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error restocking medicine' });
  }
});

module.exports = router;