const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ==========================================
// CREDIT LIMIT FORMULA
// limit = (monthly_income * 30% - other_debts) * 24 months
// clamped between ₱10,000 and ₱2,000,000
// ==========================================
function computeCreditLimit(monthly_income, other_debts) {
  const income = parseFloat(monthly_income) || 0;
  const debts = parseFloat(other_debts) || 0;
  const safeMonthly = Math.max(income * 0.30 - debts, 0);
  let limit = safeMonthly * 24;
  if (limit < 10000) limit = 10000;
  if (limit > 2000000) limit = 2000000;
  return Math.round(limit * 100) / 100;
}

// ==========================================
// SIGNUP ROUTE
// ==========================================
router.post('/signup', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      confirm_password,
      birth_date,
      gender,
      address,
      city,
      province,
      zip_code,
      monthly_income,
      other_debts,
      job_title,
      company_name,
      years_employed
    } = req.body;

    // ===== VALIDATION =====
    if (!first_name || !last_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // ===== CHECK IF EMAIL ALREADY EXISTS =====
    const connection = await pool.getConnection();
    const [existingUser] = await connection.query(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // ===== HASH PASSWORD =====
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // ===== CALCULATE CREDIT LIMIT =====
    const creditLimit = computeCreditLimit(monthly_income, other_debts);

    // ===== INSERT USER =====
    const [result] = await connection.query(
      `INSERT INTO users (
        first_name, last_name, email, phone, password_hash,
        birth_date, gender, address, city, province, zip_code,
        monthly_income, other_debts, credit_limit, used_credit, credit_score,
        job_title, company_name, years_employed, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 650, ?, ?, ?, 'verified')`,
      [
        first_name,
        last_name,
        email,
        phone,
        password_hash,
        birth_date || null,
        gender || null,
        address || null,
        city || null,
        province || null,
        zip_code || null,
        monthly_income || null,
        other_debts || 0,
        creditLimit,
        job_title || null,
        company_name || null,
        years_employed || null
      ]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now login.',
      user_id: result.insertId,
      credit_limit: creditLimit,
      credit_score: 650,
      used_credit: 0,
      available_credit: creditLimit
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
});

// ==========================================
// LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ===== VALIDATION =====
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // ===== FETCH USER FROM DATABASE =====
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT user_id, first_name, last_name, email, password_hash, status,
              monthly_income, other_debts, credit_limit, used_credit, credit_score
       FROM users WHERE email = ?`,
      [email]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // ===== CHECK ACCOUNT STATUS =====
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.'
      });
    }

    // ===== VERIFY PASSWORD =====
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ===== LOGIN SUCCESSFUL =====
    const credit_limit = parseFloat(user.credit_limit) || 0;
    const used_credit = parseFloat(user.used_credit) || 0;
    const credit_score = user.credit_score || 650;

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        monthly_income: user.monthly_income,
        other_debts: user.other_debts,
        credit_limit: credit_limit,
        used_credit: used_credit,
        credit_score: credit_score,
        available_credit: Math.max(credit_limit - used_credit, 0)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// ==========================================
// VERIFY EMAIL ROUTE (Check if email exists)
// ==========================================
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );
    connection.release();

    res.json({
      exists: users.length > 0,
      email: email
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email',
      error: error.message
    });
  }
});

module.exports = router;
