// ==========================================
// LoanEase PH — Login Page Logic
// Validates inputs and POSTs to /api/auth/login.
// Stores user info in localStorage on success.
// ==========================================

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('error-msg');
  const successMsg = document.getElementById('success-msg');

  errorMsg.classList.remove('show');
  successMsg.classList.remove('show');

  if (!email || !password) {
    errorMsg.textContent = 'Please fill in all fields.';
    errorMsg.classList.add('show');
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = 'Password must be at least 6 characters.';
    errorMsg.classList.add('show');
    return;
  }

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('user_id', data.user.user_id);
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('user_name', `${data.user.first_name} ${data.user.last_name}`);
        localStorage.setItem('user_income', data.user.monthly_income || 0);
        localStorage.setItem('credit_limit', data.user.credit_limit || 0);
        localStorage.setItem('used_credit', data.user.used_credit || 0);
        localStorage.setItem('available_credit', data.user.available_credit || 0);
        localStorage.setItem('credit_score', data.user.credit_score || 650);

        successMsg.textContent = '✓ Login successful! Redirecting...';
        successMsg.classList.add('show');

        if (document.getElementById('remember').checked) {
          localStorage.setItem('remember_email', email);
        }

        setTimeout(() => window.location.href = '/items.html', 1500);
      } else {
        errorMsg.textContent = data.message || 'Login failed. Please try again.';
        errorMsg.classList.add('show');
      }
    })
    .catch(err => {
      console.error('Login error:', err);
      errorMsg.textContent = 'Connection error. Please check your internet and try again.';
      errorMsg.classList.add('show');
    });
}

function toggleNav() {
  document.getElementById('nav-links').classList.toggle('open');
}

// Initialize
// Note: login-form already has onsubmit="handleLogin(event)" in HTML,
// so we don't need to attach a submit listener here (would fire twice).
document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill email if remembered
  const remembered = localStorage.getItem('remember_email');
  if (remembered) {
    document.getElementById('email').value = remembered;
  }
});
