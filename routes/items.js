const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all items with agent information
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [items] = await connection.query(
      `SELECT i.*, a.agent_name, a.website as agent_website
       FROM items i
       JOIN agents a ON i.agent_id = a.agent_id
       WHERE i.in_stock = true
       ORDER BY i.category, i.name`
    );
    connection.release();

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
});

// GET items by category with agent information
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const connection = await pool.getConnection();
    const [items] = await connection.query(
      `SELECT i.*, a.agent_name, a.website as agent_website
       FROM items i
       JOIN agents a ON i.agent_id = a.agent_id
       WHERE i.category = ? AND i.in_stock = true
       ORDER BY i.name`,
      [category]
    );
    connection.release();

    res.json({
      success: true,
      category: category,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching category items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
});

// GET single item by ID with agent information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [items] = await connection.query(
      `SELECT i.*, a.agent_name, a.website as agent_website, a.contact_email as agent_email
       FROM items i
       JOIN agents a ON i.agent_id = a.agent_id
       WHERE i.item_id = ?`,
      [id]
    );
    connection.release();

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: items[0]
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
  }
});

// CREATE new item (Admin only - no authentication check for now)
router.post('/', async (req, res) => {
  try {
    const { agent_id, category, name, specs, price, emoji, image, base_interest_rate } = req.body;

    // Validation
    if (!agent_id || !category || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: agent_id, category, name, price'
      });
    }

    const connection = await pool.getConnection();

    // Verify agent exists
    const [agent] = await connection.query(
      'SELECT agent_id FROM agents WHERE agent_id = ?',
      [agent_id]
    );

    if (agent.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    const [result] = await connection.query(
      'INSERT INTO items (agent_id, category, name, specs, price, emoji, image, base_interest_rate, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)',
      [agent_id, category, name, specs || null, price, emoji || '📦', image || null, base_interest_rate || 12]
    );
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error.message
    });
  }
});

module.exports = router;
