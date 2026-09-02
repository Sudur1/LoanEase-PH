// ==========================================
// LoanEase PH — Items Page Logic
// Fetches items from /api/items and renders the catalog,
// handles search/filter/sort, and the loan-application modal.
// ==========================================

// Interest rate + term options
const INTEREST_OPTIONS = [5, 8, 10, 12, 15, 18, 20, 22, 25];
const MONTHS_OPTIONS = [6, 12, 18, 24, 36, 48, 60];

// State
let PRODUCTS = [];
let currentCat = 'all';
let currentInterest = 12;
let selectedPlanIdx = null;
let currentProduct = null;
let monthlyIncome = 0;

// Credit info loaded from server when user is logged in
let userCredit = null; // { credit_limit, used_credit, available_credit, credit_score }

// Max DTI ratio: monthly payment must not exceed 30% of income
const MAX_DTI = 0.30;

// Debounce timer for income input
let eligibilityDebounceTimer = null;

// ---------- Helpers ----------
function fmt(n) {
  return '₱' + Math.round(n).toLocaleString('en-PH');
}

function pmt(p, r, n) {
  const mr = r / 100 / 12;
  if (mr === 0) return p / n;
  return p * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
}

// ---------- Credit Loading ----------
async function loadCredit() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    userCredit = null;
    renderCreditBanner();
    return;
  }
  try {
    const r = await fetch(`/api/loans/credit/${user_id}`);
    const result = await r.json();
    if (result.success) {
      userCredit = result.data;
      // Refresh localStorage values so other pages stay in sync
      localStorage.setItem('credit_limit', userCredit.credit_limit);
      localStorage.setItem('used_credit', userCredit.used_credit);
      localStorage.setItem('available_credit', userCredit.available_credit);
      localStorage.setItem('credit_score', userCredit.credit_score || 650);
    }
  } catch (err) {
    console.error('Failed to load credit:', err);
  }
  renderCreditBanner();
}

function renderCreditBanner() {
  const banner = document.getElementById('credit-banner');
  if (!banner) return;
  if (!userCredit) {
    banner.style.display = 'none';
    return;
  }
  const pct = userCredit.credit_limit > 0
    ? Math.min(100, (userCredit.used_credit / userCredit.credit_limit) * 100)
    : 0;
  banner.style.display = 'block';
  const creditScore = userCredit.credit_score || 650;
  banner.innerHTML = `
    <div class="credit-banner-inner">
      <div class="credit-banner-row">
        <div>
          <div class="credit-banner-label">MONTHLY SALARY</div>
          <div class="credit-banner-value">${fmt(userCredit.monthly_income || 0)}</div>
        </div>
        <div>
          <div class="credit-banner-label">CREDIT SCORE</div>
          <div class="credit-banner-value" style="color:#2e7d32">${creditScore}</div>
        </div>
        <div>
          <div class="credit-banner-label">CREDIT LIMIT</div>
          <div class="credit-banner-value">${fmt(userCredit.credit_limit)}</div>
        </div>
        <div>
          <div class="credit-banner-label">AVAILABLE</div>
          <div class="credit-banner-value credit-avail">${fmt(userCredit.available_credit)}</div>
        </div>
        <a href="my-loans.html" class="credit-banner-link">My loans →</a>
      </div>
      <div class="credit-bar"><div class="credit-bar-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

// ---------- Data Loading ----------
async function loadProducts() {
  try {
    const response = await fetch('/api/items');
    const result = await response.json();
    if (result.success && result.data) {
      PRODUCTS = result.data.map((item, idx) => ({
        id: item.item_id || idx + 1,
        cat: item.category.toLowerCase(),
        name: item.name,
        spec: item.specs || '',
        price: parseFloat(item.price) || 0,
        emoji: item.emoji || '📦',
        image: item.image || null,
        agent: item.agent_name || '',
        min_credit_score: item.min_credit_score || 600,
        badge: null,
        bl: null
      }));
      updateCategoryTabs();
      renderProducts();
    } else {
      console.error('Failed to load products:', result.message);
      showToast('Failed to load products');
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Error connecting to server');
  }
}

function updateCategoryTabs() {
  const counts = {
    all: PRODUCTS.length,
    phones: PRODUCTS.filter(p => p.cat === 'phones').length,
    tv: PRODUCTS.filter(p => p.cat === 'tv').length,
    appliances: PRODUCTS.filter(p => p.cat === 'appliances').length,
    gadgets: PRODUCTS.filter(p => p.cat === 'gadgets').length,
    cars: PRODUCTS.filter(p => p.cat === 'cars').length
  };

  const setCount = (cat, n) => {
    const el = document.querySelector(`[onclick="setcat('${cat}',this)"] .cnt`);
    if (el) el.textContent = `${n} items`;
  };

  setCount('all', counts.all);
  setCount('phones', counts.phones);
  setCount('tv', counts.tv);
  setCount('appliances', counts.appliances);
  setCount('gadgets', counts.gadgets);
  setCount('cars', counts.cars);
}

// ---------- Rendering ----------
function setcat(cat, el) {
  currentCat = cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderProducts();
}

function renderProducts() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const sort = document.getElementById('sort-sel').value;
  let items = currentCat === 'all' ? [...PRODUCTS] : PRODUCTS.filter(p => p.cat === currentCat);
  if (q) items = items.filter(p => p.name.toLowerCase().includes(q) || p.spec.toLowerCase().includes(q));
  if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
  else if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));

  document.getElementById('result-count').textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
  const catLabels = { phones: 'Smartphones', tv: 'Smart TVs', appliances: 'Appliances', gadgets: 'Gadgets', cars: 'Vehicles' };
  const grid = document.getElementById('products-grid');

  if (!items.length) {
    grid.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div><p>No items found. Try a different search or category.</p></div>';
    return;
  }

  grid.innerHTML = items.map(p => {
    const mo = pmt(p.price, 12, 12);
    const b = p.badge ? `<span class="prod-badge b-${p.badge}">${p.bl}</span>` : '';
    const bgImg = p.image ? `style="background-image:url('${p.image}');background-size:cover;background-position:center"` : '';
    return `<div class="product-card fu">
      <div class="prod-img" ${bgImg}>${b}<span>${p.emoji}</span></div>
      <div class="prod-body">
        <div class="prod-cat">${catLabels[p.cat] || p.cat}</div>
        <div class="prod-name">${p.name}</div>
        <div class="prod-spec">${p.spec}</div>
        <div class="prod-price">${fmt(p.price)}</div>
        <div class="prod-monthly">from ${fmt(mo)}/mo (12 mos, 12%)</div>
        <div class="prod-actions">
          <button class="btn-loan" onclick="openModal(${p.id})">Apply for loan</button>
          <button class="btn-save" onclick="toggleSave(this)" title="Save">♡</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleSave(btn) {
  btn.classList.toggle('saved');
  btn.innerHTML = btn.classList.contains('saved') ? '♥' : '♡';
  showToast(btn.classList.contains('saved') ? 'Added to wishlist' : 'Removed from wishlist');
}

// ---------- Loan Modal ----------
function openModal(id) {
  currentProduct = PRODUCTS.find(x => x.id === id);
  selectedPlanIdx = null;
  monthlyIncome = 0;
  document.getElementById('modal-overlay').classList.add('open');
  // Render asynchronously to avoid blocking UI
  requestAnimationFrame(() => renderModal());
}

function renderModal() {
  const p = currentProduct;
  const ratePills = INTEREST_OPTIONS.map(r =>
    `<span class="rate-pill${r === currentInterest ? ' active' : ''}" onclick="setRate(${r},this)">${r}%</span>`
  ).join('');

  // Credit-limit and credit-score info (if logged in)
  let creditBlock = '';
  let creditScoreDisplay = '';

  if (userCredit) {
    const creditScore = userCredit.credit_score || 650;
    const fits = p.price <= userCredit.available_credit;
    const meetsScore = creditScore >= p.min_credit_score;

    // Credit score info box
    creditScoreDisplay = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm)">
        <div style="text-align:center">
          <div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--text-muted);margin-bottom:4px">YOUR CREDIT SCORE</div>
          <div style="font-size:24px;font-weight:800;color:#2e7d32">${creditScore}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--text-muted);margin-bottom:4px">MINIMUM REQUIRED</div>
          <div style="font-size:24px;font-weight:800;color:${meetsScore ? '#2e7d32' : '#E31E24'}">${p.min_credit_score}</div>
        </div>
      </div>`;

    let warnings = [];
    if (!meetsScore) {
      warnings.push(`🚫 Your credit score (${creditScore}) does not meet the minimum requirement (${p.min_credit_score}) for this item.`);
    }
    if (!fits) {
      warnings.push(`🚫 This item costs <strong>${fmt(p.price)}</strong> but you only have <strong>${fmt(userCredit.available_credit)}</strong> available credit.`);
    }

    if (warnings.length > 0) {
      creditBlock = `
        <div class="elig-result elig-warn" style="display:block;margin-bottom:14px">
          ${warnings.join('<br>')}
        </div>`;
    } else {
      creditBlock = `
        <div class="elig-result elig-ok" style="display:block;margin-bottom:14px">
          ✅ Your credit score and available credit meet all requirements for this item.
        </div>`;
    }
  } else {
    creditBlock = `
      <div class="elig-result elig-info" style="display:block;margin-bottom:14px">
        💡 <a href="login.html" style="color:inherit;text-decoration:underline">Log in</a> or
        <a href="signup.html" style="color:inherit;text-decoration:underline">sign up</a> to apply for this loan with your personal credit limit and score.
      </div>`;
  }

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-prod-header">
      <div class="modal-emoji">${p.emoji}</div>
      <div>
        <div class="modal-pname">${p.name}</div>
        <div class="modal-pspec">${p.spec}</div>
        <div class="modal-pprice">${fmt(p.price)}</div>
      </div>
    </div>

    ${creditScoreDisplay}
    ${creditBlock}

    <div class="elig-section">
      <div class="elig-title">📊 Eligibility check</div>
      <div class="elig-row">
        <div class="elig-field">
          <label>Your monthly income (₱)</label>
          <input type="number" id="income-input" placeholder="e.g. 30000" min="0" oninput="checkEligibility()" />
        </div>
      </div>
      <div class="elig-result elig-info" id="elig-result" style="display:block">
        Enter your monthly income to see which plans you qualify for.
      </div>
    </div>

    <div class="plans-label">Interest rate</div>
    <div class="rate-selector">${ratePills}</div>
    <div class="plans-label">Payment plans</div>
    <div class="plans-grid" id="plans-grid"></div>
    <div class="modal-footer">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-apply" id="btn-apply" disabled onclick="confirmLoan()">Select a plan</button>
    </div>`;

  renderPlans();
}

function setRate(r, el) {
  currentInterest = r;
  selectedPlanIdx = null;
  document.querySelectorAll('.rate-pill').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  renderPlans();
}

function checkEligibility() {
  // Debounce: only recalculate 500ms after user stops typing
  clearTimeout(eligibilityDebounceTimer);
  eligibilityDebounceTimer = setTimeout(() => {
    const val = parseFloat(document.getElementById('income-input').value) || 0;
    monthlyIncome = val;
    selectedPlanIdx = null;
    document.getElementById('btn-apply').disabled = true;
    document.getElementById('btn-apply').textContent = 'Select a plan';
    const res = document.getElementById('elig-result');

    if (!val || val <= 0) {
      res.className = 'elig-result elig-info';
      res.style.display = 'block';
      res.textContent = 'Enter your monthly income to see which plans you qualify for.';
    } else {
      const maxPmt = val * MAX_DTI;
      const minPmt = pmt(currentProduct.price, currentInterest, MONTHS_OPTIONS[MONTHS_OPTIONS.length - 1]);
      if (minPmt > maxPmt) {
        res.className = 'elig-result elig-warn';
        res.style.display = 'block';
        res.innerHTML = `⚠️ Based on your income of ${fmt(val)}, your max safe monthly payment is ${fmt(maxPmt)} (30% of income). This item's minimum monthly cost (${fmt(minPmt)}) may exceed this. Plans you qualify for are greyed out.`;
      } else {
        res.className = 'elig-result elig-ok';
        res.style.display = 'block';
        res.innerHTML = `✅ Good news! Based on your income of ${fmt(val)}, you qualify for plans with monthly payments up to ${fmt(maxPmt)}.`;
      }
    }
    renderPlans();
  }, 500);
}

function renderPlans() {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;
  const maxPmt = monthlyIncome > 0 ? monthlyIncome * MAX_DTI : Infinity;

  // Build HTML asynchronously to prevent blocking
  const html = MONTHS_OPTIONS.map((mo, i) => {
    const monthly = pmt(currentProduct.price, currentInterest, mo);
    const total = monthly * mo;
    const eligible = monthly <= maxPmt;
    const incomeSet = monthlyIncome > 0;
    let tag = '';
    if (incomeSet) {
      tag = eligible
        ? `<span class="plan-tag tag-ok">✓ Eligible</span>`
        : `<span class="plan-tag tag-no">✗ Exceeds safe limit</span>`;
    }
    const sel = selectedPlanIdx === i;
    const disabled = incomeSet && !eligible;
    return `<div class="plan-card${sel ? ' selected' : ''}${disabled ? ' ineligible' : ''}" onclick="selectPlan(${i},${disabled})">
      <div>
        <div class="plan-months">${mo} months</div>
        <div class="plan-rate">${currentInterest}% annual interest</div>
        ${tag}
      </div>
      <div>
        <div class="plan-mo">${fmt(monthly)}/mo</div>
        <div class="plan-total">Total: ${fmt(total)}</div>
      </div>
    </div>`;
  }).join('');

  // Update DOM asynchronously on next frame to avoid blocking
  requestAnimationFrame(() => {
    grid.innerHTML = html;
  });
}

function selectPlan(i, disabled) {
  if (disabled) return;
  selectedPlanIdx = i;
  renderPlans();
  const btn = document.getElementById('btn-apply');
  btn.disabled = false;
  btn.textContent = 'Apply now →';
}

async function confirmLoan() {
  if (selectedPlanIdx === null) return;
  const mo = MONTHS_OPTIONS[selectedPlanIdx];
  const monthly = pmt(currentProduct.price, currentInterest, mo);
  const total = monthly * mo;

  const user_id = localStorage.getItem('user_id');

  // Must be logged in to use credit-based borrowing
  if (!user_id) {
    showToast('Please log in or sign up to apply for a loan.');
    setTimeout(() => window.location.href = '/login.html', 1500);
    return;
  }

  // Client-side credit score check
  if (userCredit) {
    const creditScore = userCredit.credit_score || 650;
    if (creditScore < currentProduct.min_credit_score) {
      document.getElementById('modal-content').innerHTML = `
        <div class="success-state">
          <div class="success-icon" style="color:#E31E24">🚫</div>
          <div class="success-title">Credit score requirement not met</div>
          <p class="success-msg">
            This item requires a minimum credit score of <strong>${currentProduct.min_credit_score}</strong>, but your credit score is <strong>${creditScore}</strong>.<br><br>
            Improve your credit score by making on-time payments on your existing loans. Each on-time payment increases your score by 10 points.
          </p>
          <button class="btn-apply" style="margin-top:18px" onclick="window.location.href='my-loans.html'">View my loans</button>
        </div>`;
      return;
    }
  }

  // Client-side credit limit check
  if (userCredit && currentProduct.price > userCredit.available_credit) {
    document.getElementById('modal-content').innerHTML = `
      <div class="success-state">
        <div class="success-icon" style="color:#E31E24">🚫</div>
        <div class="success-title">Credit limit exceeded</div>
        <p class="success-msg">
          This item costs <strong>${fmt(currentProduct.price)}</strong> but you only have
          <strong>${fmt(userCredit.available_credit)}</strong> of available credit.<br><br>
          Your credit limit: <strong>${fmt(userCredit.credit_limit)}</strong><br>
          Already used: <strong>${fmt(userCredit.used_credit)}</strong><br><br>
          Pay off some existing loans to free up credit.
        </p>
        <button class="btn-apply" style="margin-top:18px" onclick="window.location.href='my-loans.html'">View my loans</button>
      </div>`;
    return;
  }

  try {
    const response = await fetch('/api/loans/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(user_id),
        interest_rate: currentInterest,
        term_months: mo,
        items: [{ item_id: currentProduct.id, quantity: 1 }]
      })
    });
    const result = await response.json();
    if (!result.success) {
      document.getElementById('modal-content').innerHTML = `
        <div class="success-state">
          <div class="success-icon" style="color:#E31E24">🚫</div>
          <div class="success-title">Loan declined</div>
          <p class="success-msg">${result.message || 'Could not create this loan.'}</p>
          <button class="btn-apply" style="margin-top:18px" onclick="closeModal()">OK</button>
        </div>`;
      return;
    }

    // Update local credit state from server response
    userCredit = {
      credit_limit: result.credit_limit,
      used_credit: result.used_credit,
      available_credit: result.available_credit,
      credit_score: result.credit_score || 650,
      monthly_income: userCredit.monthly_income
    };
    localStorage.setItem('credit_score', userCredit.credit_score);
    renderCreditBanner();

    document.getElementById('modal-content').innerHTML = `
      <div class="success-state">
        <div class="success-icon">🎉</div>
        <div class="success-title">Loan approved!</div>
        <p class="success-msg">
          Your loan for <strong>${currentProduct.name}</strong> has been created.<br><br>
          Plan: <strong>${mo} months · ${currentInterest}% interest</strong><br>
          Monthly: <strong>${fmt(monthly)}</strong> · Total: <strong>${fmt(total)}</strong><br><br>
          Remaining credit: <strong>${fmt(result.available_credit)}</strong>
        </p>
        <button class="btn-apply" style="margin-top:18px" onclick="window.location.href='my-loans.html'">View my loans →</button>
      </div>`;
    showToast('Loan approved!');
  } catch (err) {
    console.error('Loan create error:', err);
    showToast('Connection error. Please try again.');
  }
}

function overlayClose(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
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

// ---------- Bootstrap ----------
const urlCat = new URLSearchParams(location.search).get('cat');
if (urlCat) {
  currentCat = urlCat;
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadCredit();
});
