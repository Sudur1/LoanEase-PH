// ==========================================
// LoanEase PH — Signup Page Logic
// Multi-step form, password strength, and POST /api/auth/signup.
// ==========================================

let currentStep = 1;
const totalSteps = 4;

function updateProgress() {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((step, i) => {
    if (i + 1 < currentStep) step.classList.add('completed');
    else if (i + 1 === currentStep) step.classList.add('active');
    else { step.classList.remove('active', 'completed'); }
  });
}

function showStep(step) {
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');

  document.getElementById('btn-prev').style.display = step > 1 ? 'inline-flex' : 'none';
  document.getElementById('btn-next').style.display = step < totalSteps ? 'inline-flex' : 'none';
  document.getElementById('btn-submit').style.display = step === totalSteps ? 'inline-flex' : 'none';

  updateProgress();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function nextStep() {
  if (validateStep(currentStep)) {
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

function validateStep(step) {
  const errorMsg = document.getElementById('error-msg');
  errorMsg.classList.remove('show');

  const required = document.querySelectorAll(`#step-${step} input[required], #step-${step} select[required]`);
  for (let field of required) {
    if (!field.value.trim()) {
      errorMsg.textContent = `Please fill in all required fields.`;
      errorMsg.classList.add('show');
      return false;
    }
  }

  if (step === 1) {
    const email = document.getElementById('email').value;
    if (!email.includes('@')) {
      errorMsg.textContent = 'Please enter a valid email address.';
      errorMsg.classList.add('show');
      return false;
    }
    const password = document.getElementById('password').value;
    if (password.length < 8) {
      errorMsg.textContent = 'Password must be at least 8 characters.';
      errorMsg.classList.add('show');
      return false;
    }
    const confirm = document.getElementById('confirm-password').value;
    if (password !== confirm) {
      errorMsg.textContent = 'Passwords do not match.';
      errorMsg.classList.add('show');
      return false;
    }
  }

  if (step === 3) {
    const income = parseFloat(document.getElementById('monthly-income').value);
    if (income < 5000) {
      errorMsg.textContent = 'Monthly income must be at least ₱5,000.';
      errorMsg.classList.add('show');
      return false;
    }
  }

  return true;
}

function handleSignup(event) {
  event.preventDefault();

  if (!validateStep(totalSteps)) return;

  const formData = {
    first_name: document.getElementById('first-name').value,
    last_name: document.getElementById('last-name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    password: document.getElementById('password').value,
    confirm_password: document.getElementById('confirm-password').value,
    birth_date: document.getElementById('birth-date').value,
    gender: document.getElementById('gender').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    province: document.getElementById('province').value,
    zip_code: document.getElementById('zip-code').value,
    monthly_income: parseFloat(document.getElementById('monthly-income').value),
    other_debts: parseFloat(document.getElementById('other-debts').value) || 0,
    job_title: document.getElementById('job-title').value,
    company_name: document.getElementById('company-name').value,
    years_employed: parseFloat(document.getElementById('years-employed').value)
  };

  fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_email', formData.email);
        if (data.credit_limit !== undefined) {
          localStorage.setItem('credit_limit', data.credit_limit);
          localStorage.setItem('used_credit', data.used_credit || 0);
          localStorage.setItem('available_credit', data.available_credit || data.credit_limit);
          localStorage.setItem('credit_score', data.credit_score || 650);
        }
        showSuccessState(data.credit_limit, data.credit_score);
      } else {
        const errorMsg = document.getElementById('error-msg');
        errorMsg.textContent = data.message || 'Signup failed. Please try again.';
        errorMsg.classList.add('show');
      }
    })
    .catch(err => {
      console.error('Signup error:', err);
      const errorMsg = document.getElementById('error-msg');
      errorMsg.textContent = 'Connection error. Please check your internet and try again.';
      errorMsg.classList.add('show');
    });
}

function showSuccessState(creditLimit, creditScore) {
  document.getElementById('signup-form').style.display = 'none';
  const successEl = document.getElementById('success-state');
  successEl.style.display = 'block';

  // Inject credit limit and credit score info if provided
  if (creditLimit !== undefined && creditLimit !== null) {
    const formatted = '₱' + Math.round(creditLimit).toLocaleString('en-PH');
    const score = creditScore || 650;
    const creditBox = document.createElement('div');
    creditBox.style.cssText = 'margin:20px auto;max-width:500px;background:linear-gradient(135deg,#fff,#fafafa);border:1px solid rgba(227,30,36,0.25);border-radius:12px;padding:28px;text-align:center;box-shadow:0 6px 18px rgba(227,30,36,0.08)';
    creditBox.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.12em;color:#666;margin-bottom:8px">CREDIT LIMIT</div>
          <div style="font-size:28px;font-weight:800;color:#E31E24">${formatted}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.12em;color:#666;margin-bottom:8px">CREDIT SCORE</div>
          <div style="font-size:28px;font-weight:800;color:#2e7d32">${score}</div>
        </div>
      </div>
      <div style="font-size:13px;color:#666;line-height:1.6">
        <p style="margin:0 0 10px 0"><strong>Credit Limit:</strong> The maximum total amount of items you can loan at once, based on your income and existing debts.</p>
        <p style="margin:0"><strong>Credit Score:</strong> Starts at 650. Improves with on-time payments (+10) and decreases with late payments (-15 to -30).</p>
      </div>
    `;
    successEl.appendChild(creditBox);
  }

  document.querySelector('.error-msg').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkPasswordStrength() {
  const pwd = document.getElementById('password').value;
  const fill = document.getElementById('strength-fill');
  const text = document.getElementById('strength-text');

  let strength = 0;
  if (pwd.length >= 8) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[^A-Za-z0-9]/.test(pwd)) strength++;

  const widths = ['0%', '25%', '50%', '75%', '100%'];
  const colors = ['#F44336', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];
  const texts = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  fill.style.width = widths[strength];
  fill.style.backgroundColor = colors[strength];
  text.textContent = `Password strength: ${texts[strength]}`;
}

function toggleNav() {
  document.getElementById('nav-links').classList.toggle('open');
}

// Initialize
// Note: signup-form already has onsubmit="handleSignup(event)" in HTML,
// so we don't need to attach a submit listener here (would fire twice).
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('password').addEventListener('input', checkPasswordStrength);
  document.getElementById('monthly-income').addEventListener('input', (e) => {
    e.target.value = Math.max(0, e.target.value);
  });
  showStep(1);
});
