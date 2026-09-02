// ==========================================
// LoanEase PH — Compare Items Page
// Loads all items, lets user pick two, then renders side-by-side comparison.
// Supports URL params ?left=ID&right=ID for sharable comparison links.
// ==========================================

let ALL_ITEMS = [];
let leftItem = null;
let rightItem = null;

function fmt(n) {
  return '₱' + Math.round(parseFloat(n) || 0).toLocaleString('en-PH');
}

function pmt(p, r, n) {
  const mr = r / 100 / 12;
  if (mr === 0) return p / n;
  return p * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
}

function toggleNav() {
  document.getElementById('nav-links').classList.toggle('open');
}

// ---------- Load items ----------
async function loadItems() {
  try {
    const r = await fetch('/api/items');
    const result = await r.json();
    if (result.success && result.data) {
      ALL_ITEMS = result.data;
      populateSelects();

      // Auto-load comparison from URL params if present
      const params = new URLSearchParams(location.search);
      const left = params.get('left');
      const right = params.get('right');
      if (left) {
        document.getElementById('select-left').value = left;
      }
      if (right) {
        document.getElementById('select-right').value = right;
      }
      if (left || right) onSelectChange();
    }
  } catch (err) {
    console.error('Failed to load items:', err);
  }
}

function populateSelects() {
  // Group items by category for nicer dropdown
  const byCat = {};
  ALL_ITEMS.forEach(it => {
    const cat = it.category || 'other';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(it);
  });

  const catLabels = {
    phones: 'Smartphones',
    tv: 'Smart TVs',
    appliances: 'Appliances',
    gadgets: 'Gadgets',
    cars: 'Vehicles',
    other: 'Other'
  };

  let html = '<option value="">— Choose an item —</option>';
  Object.keys(byCat).sort().forEach(cat => {
    html += `<optgroup label="${catLabels[cat] || cat}">`;
    byCat[cat].forEach(it => {
      html += `<option value="${it.item_id}">${it.emoji || ''} ${it.name} — ${fmt(it.price)}</option>`;
    });
    html += '</optgroup>';
  });

  document.getElementById('select-left').innerHTML = html;
  document.getElementById('select-right').innerHTML = html;
}

// ---------- Selection ----------
function onSelectChange() {
  const leftId = document.getElementById('select-left').value;
  const rightId = document.getElementById('select-right').value;

  leftItem = leftId ? ALL_ITEMS.find(x => x.item_id == leftId) : null;
  rightItem = rightId ? ALL_ITEMS.find(x => x.item_id == rightId) : null;

  // Update URL for shareability
  const params = new URLSearchParams();
  if (leftId) params.set('left', leftId);
  if (rightId) params.set('right', rightId);
  const newUrl = params.toString() ? `?${params.toString()}` : location.pathname;
  history.replaceState(null, '', newUrl);

  renderComparison();
}

// ---------- Render ----------
function renderComparison() {
  const grid = document.getElementById('compare-grid');
  const summaryCard = document.getElementById('summary-card');

  // Compute winners for highlighting (only when BOTH items selected)
  let cheaperSide = null;
  let lowerInterestSide = null;
  let lowerMonthlySide = null;

  if (leftItem && rightItem) {
    const lp = parseFloat(leftItem.price);
    const rp = parseFloat(rightItem.price);
    cheaperSide = lp < rp ? 'left' : (rp < lp ? 'right' : null);

    const li = parseFloat(leftItem.base_interest_rate);
    const ri = parseFloat(rightItem.base_interest_rate);
    lowerInterestSide = li < ri ? 'left' : (ri < li ? 'right' : null);

    const lm = pmt(lp, li, 12);
    const rm = pmt(rp, ri, 12);
    lowerMonthlySide = lm < rm ? 'left' : (rm < lm ? 'right' : null);

    // Show summary
    renderSummary(cheaperSide, lowerInterestSide, lowerMonthlySide);
    summaryCard.classList.add('show');
  } else {
    summaryCard.classList.remove('show');
  }

  const leftHTML = leftItem
    ? renderItemCard(leftItem, cheaperSide === 'left' ? 'CHEAPER' : null, cheaperSide === 'left')
    : renderEmpty('Pick an item from the LEFT dropdown above.');

  const rightHTML = rightItem
    ? renderItemCard(rightItem, cheaperSide === 'right' ? 'CHEAPER' : null, cheaperSide === 'right')
    : renderEmpty('Pick an item from the RIGHT dropdown above.');

  grid.innerHTML = leftHTML + rightHTML;
}

function renderEmpty(message) {
  return `
    <div class="compare-empty">
      <div class="compare-empty-icon">📦</div>
      <h3>No item selected</h3>
      <p>${message}</p>
    </div>`;
}

function renderItemCard(item, badge, isWinner) {
  const price = parseFloat(item.price) || 0;
  const interest = parseFloat(item.base_interest_rate) || 12;
  const monthly12 = pmt(price, interest, 12);
  const monthly24 = pmt(price, interest, 24);
  const monthly36 = pmt(price, interest, 36);
  const inStock = item.in_stock !== false && item.in_stock !== 0;

  const bgStyle = item.image
    ? `style="background-image:url('${item.image}')"`
    : '';

  const winnerBadge = badge ? `<div class="winner-badge">💰 ${badge}</div>` : '';

  return `
    <div class="compare-col ${isWinner ? 'winner' : ''}">
      <div class="compare-img" ${bgStyle}>
        ${winnerBadge}
        ${!item.image ? (item.emoji || '📦') : ''}
      </div>
      <div class="compare-header">
        <div class="compare-brand">${item.agent_name || 'Generic'}</div>
        <div class="compare-name">${item.name}</div>
        <div class="compare-cat">${item.category || ''}</div>
      </div>
      <div class="spec-list">
        <div class="spec-row">
          <div class="spec-icon">💰</div>
          <div class="spec-label">Price</div>
          <div class="spec-value highlight">${fmt(price)}</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">📋</div>
          <div class="spec-label">Specifications</div>
          <div class="spec-value">${item.specs || '—'}</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">🏷️</div>
          <div class="spec-label">Category</div>
          <div class="spec-value" style="text-transform:capitalize">${item.category || '—'}</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">🏢</div>
          <div class="spec-label">Brand</div>
          <div class="spec-value">${item.agent_name || '—'}</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">📊</div>
          <div class="spec-label">Interest rate</div>
          <div class="spec-value">${interest}% annual</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">📆</div>
          <div class="spec-label">12-mo plan</div>
          <div class="spec-value">${fmt(monthly12)}/mo</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">📅</div>
          <div class="spec-label">24-mo plan</div>
          <div class="spec-value">${fmt(monthly24)}/mo</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">🗓️</div>
          <div class="spec-label">36-mo plan</div>
          <div class="spec-value">${fmt(monthly36)}/mo</div>
        </div>
        <div class="spec-row">
          <div class="spec-icon">${inStock ? '✅' : '❌'}</div>
          <div class="spec-label">Availability</div>
          <div class="spec-value ${inStock ? 'green' : ''}">${inStock ? 'In stock' : 'Out of stock'}</div>
        </div>
      </div>
      <div class="compare-actions">
        <a href="items.html" class="btn-loan-compare">Apply for loan →</a>
      </div>
    </div>`;
}

function renderSummary(cheaperSide, lowerInterestSide, lowerMonthlySide) {
  const body = document.getElementById('summary-body');
  const leftName = leftItem.name;
  const rightName = rightItem.name;
  const priceDiff = Math.abs(parseFloat(leftItem.price) - parseFloat(rightItem.price));

  const sideName = (side) => side === 'left' ? leftName : rightName;
  const sideTie = (side) => side === null;

  let rows = [];

  if (sideTie(cheaperSide)) {
    rows.push(`<div class="summary-row">💰 <strong>Same price</strong> — both cost ${fmt(leftItem.price)}.</div>`);
  } else {
    rows.push(`<div class="summary-row">💰 <strong>${sideName(cheaperSide)}</strong> is cheaper by ${fmt(priceDiff)}.</div>`);
  }

  if (sideTie(lowerInterestSide)) {
    rows.push(`<div class="summary-row">📊 Both items have the <strong>same interest rate</strong> (${parseFloat(leftItem.base_interest_rate)}%).</div>`);
  } else {
    const li = parseFloat(leftItem.base_interest_rate);
    const ri = parseFloat(rightItem.base_interest_rate);
    rows.push(`<div class="summary-row">📊 <strong>${sideName(lowerInterestSide)}</strong> has a lower interest rate (${Math.min(li, ri)}% vs ${Math.max(li, ri)}%).</div>`);
  }

  if (!sideTie(lowerMonthlySide)) {
    const lm = pmt(parseFloat(leftItem.price), parseFloat(leftItem.base_interest_rate), 12);
    const rm = pmt(parseFloat(rightItem.price), parseFloat(rightItem.base_interest_rate), 12);
    const monthlyDiff = Math.abs(lm - rm);
    rows.push(`<div class="summary-row">📆 <strong>${sideName(lowerMonthlySide)}</strong> has a lower 12-month payment, saving you ${fmt(monthlyDiff)}/mo.</div>`);
  }

  body.innerHTML = rows.join('');
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', loadItems);
