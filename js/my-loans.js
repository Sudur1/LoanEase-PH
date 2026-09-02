// ==========================================
// LoanEase PH — My Loans Dashboard
// Shows credit limit, all user loans with items, and pay buttons.
// ==========================================

let ALL_LOANS = [];
let CURRENT_FILTER = 'all';

function fmt(n) {
  return '₱' + Math.round(parseFloat(n) || 0).toLocaleString('en-PH');
}

function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function toggleNav() {
  document.getElementById('nav-links').classList.toggle('open');
}

// ---------- Load credit + loans ----------
async function loadCredit() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    // Make sure the credit card is hidden if we're not logged in
    const card = document.getElementById('credit-card');
    if (card) card.style.display = 'none';
    return;
  }
  try {
    const r = await fetch(`/api/loans/credit/${user_id}`);
    const result = await r.json();
    if (result.success) {
      const c = result.data;
      document.getElementById('credit-card').style.display = 'block';

      // Display user's financial info and credit score
      document.getElementById('credit-limit').textContent = fmt(c.credit_limit);
      document.getElementById('credit-available').textContent = fmt(c.available_credit);
      document.getElementById('credit-used').textContent = fmt(c.used_credit);

      // Display credit score (update the credit-score display if it exists)
      const creditScoreEl = document.getElementById('credit-score');
      if (creditScoreEl) {
        creditScoreEl.textContent = c.credit_score || 650;
      }

      const pct = c.credit_limit > 0
        ? Math.min(100, (c.used_credit / c.credit_limit) * 100)
        : 0;
      document.getElementById('credit-bar-fill').style.width = pct + '%';

      // Hint text with salary and debt info
      const incomeNote = c.monthly_income > 0
        ? `Salary: ${fmt(c.monthly_income)} • Debts: ${fmt(c.other_debts)} • Credit Score: ${c.credit_score || 650}`
        : 'Your credit limit is based on your monthly income and existing debts.';
      document.getElementById('credit-hint').textContent = incomeNote;

      // Sync localStorage
      localStorage.setItem('credit_limit', c.credit_limit);
      localStorage.setItem('used_credit', c.used_credit);
      localStorage.setItem('available_credit', c.available_credit);
      localStorage.setItem('credit_score', c.credit_score || 650);
    }
  } catch (err) {
    console.error('Failed to load credit:', err);
  }
}

async function loadLoans() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    renderEmpty(true);
    return;
  }
  try {
    const r = await fetch(`/api/loans/user/${user_id}`);
    const result = await r.json();
    if (result.success) {
      ALL_LOANS = result.data || [];
      renderLoans();
    } else {
      showToast('Failed to load loans');
    }
  } catch (err) {
    console.error('Failed to load loans:', err);
    showToast('Connection error');
  }
}

function setFilter(f, el) {
  CURRENT_FILTER = f;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  renderLoans();
}

function renderEmpty(notLoggedIn) {
  const list = document.getElementById('loans-list');
  if (notLoggedIn) {
    list.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🔒</div>
        <h2>Sign in to view your loans</h2>
        <p>Log in to see your credit limit, active loans, and payment history.</p>
        <a href="login.html" class="btn-cta">Log in</a>
      </div>`;
    document.getElementById('filter-row').style.display = 'none';
    return;
  }
  list.innerHTML = `
    <div class="empty">
      <div class="empty-icon">📭</div>
      <h2>No loans yet</h2>
      <p>Once you apply for a loan, it'll appear here so you can track it and make payments.</p>
      <a href="items.html" class="btn-cta">Browse items</a>
    </div>`;
}

function renderLoans() {
  const list = document.getElementById('loans-list');
  let loans = ALL_LOANS;
  if (CURRENT_FILTER !== 'all') {
    loans = loans.filter(l => l.status === CURRENT_FILTER);
  }
  if (!loans.length) {
    if (ALL_LOANS.length === 0) {
      renderEmpty(false);
    } else {
      list.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div><h2>No ${CURRENT_FILTER} loans</h2><p>Try a different filter.</p></div>`;
    }
    return;
  }

  list.innerHTML = loans.map(loan => {
    const totalAmount = parseFloat(loan.total_amount) || 0;
    const paidAmount = parseFloat(loan.paid_amount) || 0;
    const remaining = Math.max(totalAmount - paidAmount, 0);
    const pct = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;
    const monthsPaid = parseInt(loan.months_paid) || 0;
    const termMonths = parseInt(loan.term_months) || 0;
    const isCompleted = loan.status === 'completed';
    const monthlyPayment = parseFloat(loan.monthly_payment) || 0;

    const itemChips = (loan.items || []).map(it => {
      const img = it.image ? `style="background-image:url('${it.image}');background-size:cover;background-position:center"` : '';
      return `<div class="loan-item-chip">
        <div class="loan-item-img" ${img}>${it.emoji || '📦'}</div>
        <span>${it.name}${it.quantity > 1 ? ` × ${it.quantity}` : ''}</span>
      </div>`;
    }).join('');

    const statusClass = `status-${loan.status}`;
    const created = new Date(loan.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

    return `
      <div class="loan-card">
        <div class="loan-head">
          <div>
            <div class="loan-id">LOAN #${loan.loan_id}</div>
            <div class="loan-title">${loan.total_items} item${loan.total_items > 1 ? 's' : ''} · ${termMonths}-month plan</div>
            <div class="loan-meta">Created ${created} · ${parseFloat(loan.interest_rate)}% annual rate</div>
          </div>
          <span class="loan-status ${statusClass}">${loan.status}</span>
        </div>

        <div class="loan-items">${itemChips || '<em style="color:#999;font-size:13px">No items linked</em>'}</div>

        <div class="loan-stats">
          <div><div class="stat-lbl">PRINCIPAL</div><div class="stat-val">${fmt(loan.loan_amount)}</div></div>
          <div><div class="stat-lbl">TOTAL DUE</div><div class="stat-val">${fmt(totalAmount)}</div></div>
          <div><div class="stat-lbl">PAID</div><div class="stat-val" style="color:#2e7d32">${fmt(paidAmount)}</div></div>
          <div><div class="stat-lbl">REMAINING</div><div class="stat-val" style="color:${isCompleted ? '#2e7d32' : '#E31E24'}">${fmt(remaining)}</div></div>
          <div><div class="stat-lbl">MONTHLY</div><div class="stat-val">${fmt(monthlyPayment)}</div></div>
        </div>

        <div class="progress-row">
          <div class="progress-row-top">
            <span>${monthsPaid} / ${termMonths} months paid</span>
            <span>${pct.toFixed(0)}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>

        <div class="loan-actions">
          ${isCompleted
            ? `<span style="color:#2e7d32;font-weight:700;font-size:14px">✅ Fully paid · loan completed</span>`
            : `<button class="btn-pay" onclick="payMonth(${loan.loan_id})">Pay ${fmt(monthlyPayment)} (1 month)</button>
               <button class="btn-payoff" onclick="payOff(${loan.loan_id}, ${remaining})">Pay off ${fmt(remaining)}</button>`}
        </div>
      </div>`;
  }).join('');
}

// ---------- Payment actions ----------
async function payMonth(loan_id) {
  if (!confirm('Make a one-month payment on this loan?')) return;
  try {
    const r = await fetch(`/api/loans/${loan_id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const result = await r.json();
    if (result.success) {
      // Show credit score change if available
      let msg = result.message;
      if (result.credit_score_change !== undefined && result.credit_score_change !== 0) {
        const change = result.credit_score_change;
        const changeMsg = change > 0 ? `(+${change} credit score)` : `(${change} credit score)`;
        msg = `${result.message} ${changeMsg}`;
      }
      showToast(msg);
      await loadCredit();
      await loadLoans();
    } else {
      showToast(result.message || 'Payment failed');
    }
  } catch (err) {
    console.error('Payment error:', err);
    showToast('Connection error');
  }
}

async function payOff(loan_id, remaining) {
  if (!confirm(`Pay off the full remaining balance of ${fmt(remaining)}?`)) return;
  try {
    const r = await fetch(`/api/loans/${loan_id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pay_full: true })
    });
    const result = await r.json();
    if (result.success) {
      // Show credit score change if available
      let msg = result.message;
      if (result.credit_score_change !== undefined && result.credit_score_change !== 0) {
        const change = result.credit_score_change;
        const changeMsg = change > 0 ? `(+${change} credit score)` : `(${change} credit score)`;
        msg = `${result.message} ${changeMsg}`;
      }
      showToast(msg);
      await loadCredit();
      await loadLoans();
    } else {
      showToast(result.message || 'Payment failed');
    }
  } catch (err) {
    console.error('Payoff error:', err);
    showToast('Connection error');
  }
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  loadCredit();
  loadLoans();
});
