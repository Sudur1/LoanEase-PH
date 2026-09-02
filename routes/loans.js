const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ==========================================
// GET USER CREDIT SUMMARY
// Returns credit_limit, used_credit, available_credit
// ==========================================
router.get('/credit/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT user_id, first_name, monthly_income, other_debts, credit_limit, used_credit, credit_score FROM users WHERE user_id = ?',
      [user_id]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = users[0];
    const credit_limit = parseFloat(u.credit_limit) || 0;
    const used_credit = parseFloat(u.used_credit) || 0;
    const credit_score = u.credit_score || 650;
    res.json({
      success: true,
      data: {
        user_id: u.user_id,
        first_name: u.first_name,
        monthly_income: parseFloat(u.monthly_income) || 0,
        other_debts: parseFloat(u.other_debts) || 0,
        credit_limit,
        used_credit,
        credit_score,
        available_credit: Math.max(credit_limit - used_credit, 0)
      }
    });
  } catch (err) {
    console.error('Error fetching credit summary:', err);
    res.status(500).json({ success: false, message: 'Error fetching credit', error: err.message });
  }
});

// ==========================================
// CREATE LOAN WITH MULTIPLE ITEMS
// Enforces user credit limit.
// ==========================================
router.post('/create', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_id, items, interest_rate, term_months } = req.body;

    if (!user_id || !items || items.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Missing required fields: user_id, items array' });
    }
    if (!interest_rate || !term_months) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Missing required fields: interest_rate, term_months' });
    }

    // ===== 1. Get user credit info =====
    const [userRows] = await connection.query(
      'SELECT user_id, credit_limit, used_credit, credit_score FROM users WHERE user_id = ?',
      [user_id]
    );
    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const credit_limit = parseFloat(userRows[0].credit_limit) || 0;
    const used_credit = parseFloat(userRows[0].used_credit) || 0;
    const credit_score = userRows[0].credit_score || 650;
    const available_credit = Math.max(credit_limit - used_credit, 0);

    // ===== 2. Calculate loan principal & validate credit score for each item =====
    let total_loan_amount = 0;
    const itemDetails = [];

    for (let item of items) {
      const [itemData] = await connection.query(
        'SELECT item_id, price, min_credit_score FROM items WHERE item_id = ?',
        [item.item_id]
      );
      if (itemData.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, message: `Item ${item.item_id} not found` });
      }

      const min_credit_score = itemData[0].min_credit_score || 600;
      if (credit_score < min_credit_score) {
        connection.release();
        return res.status(403).json({
          success: false,
          message: `Your credit score (${credit_score}) does not meet the minimum requirement (${min_credit_score}) for this item.`,
          user_credit_score: credit_score,
          item_min_credit_score: min_credit_score,
          item_id: item.item_id
        });
      }

      const quantity = item.quantity || 1;
      const itemTotal = parseFloat(itemData[0].price) * quantity;
      total_loan_amount += itemTotal;
      itemDetails.push({
        item_id: item.item_id,
        price: parseFloat(itemData[0].price),
        quantity: quantity,
        subtotal: itemTotal
      });
    }

    // ===== 3. Enforce credit limit =====
    if (total_loan_amount > available_credit) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: `Loan exceeds your available credit limit. Available: ₱${available_credit.toLocaleString('en-PH')}, Requested: ₱${total_loan_amount.toLocaleString('en-PH')}`,
        credit_limit,
        used_credit,
        available_credit,
        requested: total_loan_amount
      });
    }

    // ===== 4. Calculate monthly payment =====
    const monthlyRate = interest_rate / 100 / 12;
    const monthlyPayment = monthlyRate === 0
      ? total_loan_amount / term_months
      : (total_loan_amount * (monthlyRate * Math.pow(1 + monthlyRate, term_months))) /
        (Math.pow(1 + monthlyRate, term_months) - 1);
    const total_amount = monthlyPayment * term_months;

    // ===== 5. Insert loan =====
    const [loanResult] = await connection.query(
      `INSERT INTO loans (user_id, loan_amount, monthly_payment, interest_rate, term_months, total_amount, total_items, status, start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
      [user_id, total_loan_amount, monthlyPayment, interest_rate, term_months, total_amount, itemDetails.length]
    );
    const loan_id = loanResult.insertId;

    // ===== 6. Insert loan items =====
    for (let item of itemDetails) {
      await connection.query(
        `INSERT INTO loan_items (loan_id, item_id, quantity, item_price)
         VALUES (?, ?, ?, ?)`,
        [loan_id, item.item_id, item.quantity, item.price]
      );
    }

    // ===== 7. Build payment schedule =====
    for (let i = 1; i <= term_months; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      const principalAmount = total_loan_amount / term_months;
      const interestAmount = monthlyPayment - principalAmount;
      await connection.query(
        `INSERT INTO payment_schedules (loan_id, payment_number, due_date, principal_amount, interest_amount, payment_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [loan_id, i, dueDate, principalAmount, interestAmount, monthlyPayment]
      );
    }

    // ===== 8. Reserve credit (used_credit += loan principal) =====
    const new_used_credit = used_credit + total_loan_amount;
    await connection.query(
      'UPDATE users SET used_credit = ? WHERE user_id = ?',
      [new_used_credit, user_id]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      loan_id,
      loan_amount: total_loan_amount,
      monthly_payment: monthlyPayment,
      total_amount,
      total_items: itemDetails.length,
      credit_score,
      credit_limit,
      used_credit: new_used_credit,
      available_credit: credit_limit - new_used_credit
    });
  } catch (error) {
    connection.release();
    console.error('Error creating loan:', error);
    res.status(500).json({ success: false, message: 'Error creating loan', error: error.message });
  }
});

// ==========================================
// GET ALL LOANS FOR USER (with items)
// ==========================================
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const connection = await pool.getConnection();

    const [loans] = await connection.query(
      `SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    // Attach items + computed remaining balance to each loan
    for (let loan of loans) {
      const [items] = await connection.query(
        `SELECT li.loan_item_id, li.item_id, li.quantity, li.item_price,
                i.name, i.emoji, i.category, a.agent_name
         FROM loan_items li
         JOIN items i ON li.item_id = i.item_id
         JOIN agents a ON i.agent_id = a.agent_id
         WHERE li.loan_id = ?`,
        [loan.loan_id]
      );
      loan.items = items;
      const totalAmount = parseFloat(loan.total_amount) || 0;
      const paidAmount = parseFloat(loan.paid_amount) || 0;
      loan.remaining_balance = Math.max(totalAmount - paidAmount, 0);
    }

    connection.release();
    res.json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    console.error('Error fetching user loans:', error);
    res.status(500).json({ success: false, message: 'Error fetching user loans', error: error.message });
  }
});

// ==========================================
// GET SINGLE LOAN
// ==========================================
router.get('/:loan_id', async (req, res) => {
  try {
    const { loan_id } = req.params;
    const connection = await pool.getConnection();

    const [loans] = await connection.query('SELECT * FROM loans WHERE loan_id = ?', [loan_id]);
    if (loans.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    const loan = loans[0];

    const [loanItems] = await connection.query(
      `SELECT li.loan_item_id, li.item_id, li.quantity, li.item_price,
              i.name, i.emoji, i.category, a.agent_name
       FROM loan_items li
       JOIN items i ON li.item_id = i.item_id
       JOIN agents a ON i.agent_id = a.agent_id
       WHERE li.loan_id = ?`,
      [loan_id]
    );

    const [paymentSchedule] = await connection.query(
      'SELECT * FROM payment_schedules WHERE loan_id = ? ORDER BY payment_number',
      [loan_id]
    );

    connection.release();
    res.json({ success: true, data: { loan, items: loanItems, payment_schedule: paymentSchedule } });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({ success: false, message: 'Error fetching loan', error: error.message });
  }
});

// ==========================================
// MAKE A PAYMENT (fictional)
// Restores credit proportionally as principal is paid down.
// ==========================================
router.post('/:loan_id/payment', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { loan_id } = req.params;
    let { payment_amount, pay_full } = req.body;

    const [loans] = await connection.query('SELECT * FROM loans WHERE loan_id = ?', [loan_id]);
    if (loans.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    const loan = loans[0];

    if (loan.status === 'completed') {
      connection.release();
      return res.status(400).json({ success: false, message: 'Loan is already fully paid' });
    }

    const monthlyPayment = parseFloat(loan.monthly_payment) || 0;
    const totalAmount = parseFloat(loan.total_amount) || 0;
    const paidAmount = parseFloat(loan.paid_amount) || 0;
    const remaining = Math.max(totalAmount - paidAmount, 0);

    // Default: pay one month. pay_full: pay off entire remaining balance.
    if (pay_full) {
      payment_amount = remaining;
    } else if (!payment_amount || payment_amount <= 0) {
      payment_amount = monthlyPayment;
    }
    payment_amount = Math.min(payment_amount, remaining);

    const new_paid_amount = paidAmount + payment_amount;
    const monthsPaidNow = Math.min(
      Math.floor(new_paid_amount / monthlyPayment) || 0,
      loan.term_months
    );

    // Fraction of principal freed by this payment (proportional)
    const loanPrincipal = parseFloat(loan.loan_amount) || 0;
    const principalFreed = totalAmount > 0 ? (payment_amount / totalAmount) * loanPrincipal : 0;

    // Update loan
    let newStatus = loan.status;
    let endDate = null;
    if (new_paid_amount >= totalAmount - 0.01) {
      newStatus = 'completed';
      endDate = new Date();
    }
    await connection.query(
      `UPDATE loans
       SET paid_amount = ?, months_paid = ?, last_payment_date = NOW(),
           status = ?, end_date = COALESCE(?, end_date)
       WHERE loan_id = ?`,
      [new_paid_amount, monthsPaidNow, newStatus, endDate, loan_id]
    );

    // Mark next pending payment schedule(s) as paid & calculate credit score impact
    const monthsCoveredByThisPayment = Math.max(monthsPaidNow - (parseInt(loan.months_paid) || 0), 0);
    let scoreChange = 0;

    if (monthsCoveredByThisPayment > 0) {
      const [pending] = await connection.query(
        'SELECT schedule_id, due_date FROM payment_schedules WHERE loan_id = ? AND status = "pending" ORDER BY payment_number LIMIT ?',
        [loan_id, monthsCoveredByThisPayment]
      );

      // For each payment being made, calculate if it's on-time/late and adjust score
      for (const row of pending) {
        const dueDate = new Date(row.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        let paymentScore = 0;
        if (daysLate <= 0) {
          paymentScore = 10;  // On-time or early payment
        } else if (daysLate <= 30) {
          paymentScore = -15; // Late payment (1-30 days)
        } else {
          paymentScore = -30; // Very late payment (>30 days)
        }
        scoreChange += paymentScore;

        await connection.query(
          'UPDATE payment_schedules SET status = "paid", paid_date = NOW() WHERE schedule_id = ?',
          [row.schedule_id]
        );
      }
    }

    if (newStatus === 'completed') {
      const [remaining] = await connection.query(
        'SELECT schedule_id, due_date FROM payment_schedules WHERE loan_id = ? AND status = "pending"',
        [loan_id]
      );
      // Score any final remaining pending payments
      for (const row of remaining) {
        const dueDate = new Date(row.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        let paymentScore = 0;
        if (daysLate <= 0) {
          paymentScore = 10;
        } else if (daysLate <= 30) {
          paymentScore = -15;
        } else {
          paymentScore = -30;
        }
        scoreChange += paymentScore;
      }

      await connection.query(
        'UPDATE payment_schedules SET status = "paid", paid_date = COALESCE(paid_date, NOW()) WHERE loan_id = ? AND status = "pending"',
        [loan_id]
      );
    }

    // Free credit on the user and update credit score
    const [userRow] = await connection.query(
      'SELECT used_credit, credit_limit, credit_score FROM users WHERE user_id = ?',
      [loan.user_id]
    );
    const usedNow = Math.max((parseFloat(userRow[0].used_credit) || 0) - principalFreed, 0);
    let newCreditScore = (userRow[0].credit_score || 650) + scoreChange;
    // Clamp credit score between 300 and 850
    newCreditScore = Math.max(300, Math.min(850, newCreditScore));

    await connection.query(
      'UPDATE users SET used_credit = ?, credit_score = ? WHERE user_id = ?',
      [usedNow, newCreditScore, loan.user_id]
    );

    connection.release();
    const creditLimitVal = parseFloat(userRow[0].credit_limit) || 0;
    const scoreChangeMsg = scoreChange > 0 ? `+${scoreChange} points` : `${scoreChange} points`;
    res.json({
      success: true,
      message: newStatus === 'completed' ? 'Loan paid off in full! 🎉' : 'Payment recorded successfully',
      loan_id,
      payment_amount,
      paid_amount: new_paid_amount,
      remaining_balance: Math.max(totalAmount - new_paid_amount, 0),
      months_paid: monthsPaidNow,
      remaining_months: loan.term_months - monthsPaidNow,
      status: newStatus,
      credit_score: newCreditScore,
      credit_score_change: scoreChange > 0 ? `+${scoreChange}` : String(scoreChange),
      credit_score_change_message: scoreChange === 0 ? 'No change' : scoreChangeMsg,
      credit_limit: creditLimitVal,
      used_credit: usedNow,
      available_credit: Math.max(creditLimitVal - usedNow, 0)
    });
  } catch (error) {
    connection.release();
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Error recording payment', error: error.message });
  }
});

// ==========================================
// UPDATE LOAN STATUS
// ==========================================
router.put('/:loan_id/status', async (req, res) => {
  try {
    const { loan_id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'active', 'completed', 'defaulted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.query('UPDATE loans SET status = ? WHERE loan_id = ?', [status, loan_id]);
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    res.json({ success: true, message: 'Loan status updated', loan_id, status });
  } catch (error) {
    console.error('Error updating loan status:', error);
    res.status(500).json({ success: false, message: 'Error updating loan status', error: error.message });
  }
});

module.exports = router;
