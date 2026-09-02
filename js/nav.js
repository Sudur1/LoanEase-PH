// ==========================================
// LoanEase PH — Shared navigation logic
// Renders Login/Logout state in the navbar of every page,
// and shows "My loans" only when the user is signed in.
// Included on every HTML page right before </body>.
// ==========================================

function isLoggedIn() {
  return !!localStorage.getItem('user_id');
}

function getDisplayName() {
  const full = localStorage.getItem('user_name');
  if (full && full.trim()) return full.split(' ')[0]; // first name only
  const email = localStorage.getItem('user_email');
  if (email) return email.split('@')[0];
  return 'Account';
}

function logout() {
  if (!confirm('Log out of your LoanEase account?')) return;
  // Clear EVERYTHING user-related so loans can't leak across accounts
  const keys = [
    'user_id',
    'user_email',
    'user_name',
    'user_income',
    'credit_limit',
    'used_credit',
    'available_credit'
    // intentionally keep 'remember_email' so login page can prefill it
  ];
  keys.forEach(k => localStorage.removeItem(k));
  window.location.href = '/login.html';
}

function renderNavAuth() {
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  const loggedIn = isLoggedIn();

  // Show/hide "My loans" link
  const myLoansLi = document.getElementById('nav-my-loans-li');
  if (myLoansLi) {
    myLoansLi.style.display = loggedIn ? '' : 'none';
  }

  // Populate the auth slot
  const authLi = document.getElementById('nav-auth-li');
  if (!authLi) return;

  if (loggedIn) {
    const name = getDisplayName();
    authLi.innerHTML = `
      <a href="#" onclick="logout();return false;" class="nav-cta" title="Click to log out">
        👤 ${name} · Logout
      </a>`;
  } else {
    authLi.innerHTML = `<a href="login.html" class="nav-cta">Login</a>`;
  }
}

// Run as early as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNavAuth);
} else {
  renderNavAuth();
}
