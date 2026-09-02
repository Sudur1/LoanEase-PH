const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import database utilities
const pool = require('./config/db');
const { waitForDatabase, ensureDatabaseExists } = require('./config/db');
const { initDatabase } = require('./config/initDatabase');

// Import routes
const itemsRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
const loansRoutes = require('./routes/loans');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root URL → redirect to login page (must come BEFORE static middleware,
// otherwise express.static would serve index.html for "/" first)
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Serve static files (HTML, CSS, JS) from root directory
// (index.html is still reachable directly at /index.html)
app.use(express.static(__dirname, { index: false }));

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/items', itemsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/loans', loansRoutes);

// ==========================================
// HEALTH CHECK ROUTE
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('\n🚀 Starting LoanEase PH Server...');
    console.log(`📡 DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`📡 DB_NAME: ${process.env.DB_NAME || 'loanease_ph'}\n`);

    // 1. Wait for MySQL to be reachable (important for Kubernetes pod startup order)
    await waitForDatabase();

    // 2. Make sure the database itself exists
    await ensureDatabaseExists();

    // 3. Create tables + seed initial data if empty
    await initDatabase();

    // 4. Start listening
    app.listen(PORT, () => {
      console.log(`✅ LoanEase PH Server running on http://localhost:${PORT}`);
      console.log(`\n📝 API Endpoints:`);
      console.log(`   📦 ITEMS:    GET/POST /api/items, /api/items/:id, /api/items/category/:cat`);
      console.log(`   💳 LOANS:    POST /api/loans/create, GET /api/loans/:id, /api/loans/user/:uid`);
      console.log(`               POST /api/loans/:id/payment, GET /api/loans/credit/:uid`);
      console.log(`   👤 AUTH:     POST /api/auth/signup, /api/auth/login`);
      console.log(`   💚 HEALTH:   GET  /api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
