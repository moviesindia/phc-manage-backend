const express = require('express');
const router = express.Router();
const db = require('../db');
const { SimpleLinearRegression } = require('ml-regression');

// @route   GET /api/predict/forecast
// @desc    Train model on past 30 days and forecast next 7 days + restock needs
router.get('/forecast', async (req, res) => {
  try {
    // 1. Fetch Footfall Data (Last 30 Days)
    const [footfallRows] = await db.query(`
      SELECT DATE(visit_date) as date, COUNT(*) as count 
      FROM footfall 
      WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
      GROUP BY DATE(visit_date) 
      ORDER BY date ASC
    `);

    // 2. Prepare Data for ML (Ensure continuous 30-day timeline, filling missing days with 0)
    const x = []; // Day indices (1 to 30)
    const y = []; // Footfall counts
    const chartData = []; // Combined array for Recharts frontend

    let totalPastFootfall = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const record = footfallRows.find(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
      const count = record ? record.count : 0;

      const dayIndex = 30 - i;
      x.push(dayIndex);
      y.push(count);
      totalPastFootfall += count;

      chartData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual: count,
        predicted: null // Actual data doesn't use the predicted line
      });
    }

    // 3. Train the Simple Linear Regression Model
    let regression;
    if (totalPastFootfall > 0) {
      regression = new SimpleLinearRegression(x, y);
    }

    // 4. Predict the Next 7 Days
    let totalPredictedFootfall = 0;
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const dayIndex = 30 + i;
      // If we don't have enough data, fallback to average, otherwise use model
      let predictedCount = 0;
      if (regression) {
        predictedCount = Math.max(0, Math.round(regression.predict(dayIndex)));
      } else {
        predictedCount = 0; 
      }
      
      totalPredictedFootfall += predictedCount;

      chartData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual: null,
        predicted: predictedCount
      });
    }

    // 5. Cross-Reference with Inventory to Predict Restock Needs
    // Assumption for ML: On average, 1 patient consumes 0.5 units of general medicine
    const USAGE_MULTIPLIER = 0.5; 
    const expectedDemand = Math.round(totalPredictedFootfall * USAGE_MULTIPLIER);

    const [inventory] = await db.query('SELECT * FROM inventory');
    
    const restockSuggestions = inventory.map(med => {
      let status = 'Sufficient';
      let suggestedQuantity = 0;

      // If stock cannot cover the expected demand for the next 7 days based on patient influx
      if (med.stock_quantity < expectedDemand) {
        status = 'Restock Needed';
        // Suggest ordering enough to meet demand + a 20% safety buffer
        suggestedQuantity = Math.round((expectedDemand - med.stock_quantity) * 1.2);
      } else if (med.stock_quantity < (expectedDemand * 1.5)) {
        status = 'Monitor';
      }

      return {
        id: med.id,
        name: med.medicine_name,
        currentStock: med.stock_quantity,
        expectedDemand,
        status,
        suggestedQuantity: Math.max(0, suggestedQuantity)
      };
    }).filter(med => med.status !== 'Sufficient'); // Only return actionable items

    res.json({
      chartData,
      summary: {
        totalPredictedFootfall,
        expectedDemand
      },
      restockSuggestions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating predictions' });
  }
});

module.exports = router;