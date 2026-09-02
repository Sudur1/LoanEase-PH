# ==========================================
# LoanEase PH — Beginner-Friendly App Guide PDF Generator
# Creates a comprehensive presentation handout
# ==========================================

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, ListFlowable, ListItem
)
from reportlab.platypus.flowables import HRFlowable

# Brand colors
RED = HexColor("#E31E24")
DARK_RED = HexColor("#B71C1C")
LIGHT_RED = HexColor("#FFE5E6")
GRAY_DARK = HexColor("#333333")
GRAY_MID = HexColor("#666666")
GRAY_LIGHT = HexColor("#F5F5F5")
GRAY_BORDER = HexColor("#DDDDDD")
GREEN = HexColor("#2E7D32")
BLUE = HexColor("#1976D2")

# Set up document
doc = SimpleDocTemplate(
    "LoanEase_PH_Complete_Guide.pdf",
    pagesize=letter,
    leftMargin=0.7*inch,
    rightMargin=0.7*inch,
    topMargin=0.7*inch,
    bottomMargin=0.7*inch,
    title="LoanEase PH — Complete Application Guide",
    author="LoanEase PH Development Team"
)

# ===== STYLES =====
styles = getSampleStyleSheet()

cover_title = ParagraphStyle(
    'CoverTitle',
    parent=styles['Title'],
    fontName='Helvetica-Bold',
    fontSize=42,
    textColor=RED,
    alignment=TA_CENTER,
    spaceAfter=16,
    leading=48
)

cover_sub = ParagraphStyle(
    'CoverSub',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=18,
    textColor=GRAY_DARK,
    alignment=TA_CENTER,
    spaceAfter=10,
    leading=24
)

cover_small = ParagraphStyle(
    'CoverSmall',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=12,
    textColor=GRAY_MID,
    alignment=TA_CENTER,
    spaceAfter=6
)

h1 = ParagraphStyle(
    'H1',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=22,
    textColor=RED,
    spaceBefore=14,
    spaceAfter=12,
    leading=26
)

h2 = ParagraphStyle(
    'H2',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=16,
    textColor=DARK_RED,
    spaceBefore=12,
    spaceAfter=8,
    leading=20
)

h3 = ParagraphStyle(
    'H3',
    parent=styles['Heading3'],
    fontName='Helvetica-Bold',
    fontSize=13,
    textColor=GRAY_DARK,
    spaceBefore=8,
    spaceAfter=6,
    leading=16
)

body = ParagraphStyle(
    'Body',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=10.5,
    textColor=GRAY_DARK,
    spaceAfter=8,
    leading=14,
    alignment=TA_JUSTIFY
)

body_left = ParagraphStyle(
    'BodyLeft',
    parent=body,
    alignment=TA_LEFT
)

bullet = ParagraphStyle(
    'Bullet',
    parent=body_left,
    leftIndent=18,
    bulletIndent=6,
    spaceAfter=4
)

code = ParagraphStyle(
    'Code',
    parent=styles['Code'],
    fontName='Courier',
    fontSize=9,
    textColor=GRAY_DARK,
    backColor=GRAY_LIGHT,
    borderColor=GRAY_BORDER,
    borderWidth=0.5,
    borderPadding=8,
    leftIndent=0,
    rightIndent=0,
    spaceAfter=10,
    leading=12
)

callout = ParagraphStyle(
    'Callout',
    parent=body,
    fontName='Helvetica',
    fontSize=10.5,
    textColor=GRAY_DARK,
    backColor=LIGHT_RED,
    borderColor=RED,
    borderWidth=1,
    borderPadding=10,
    leftIndent=0,
    rightIndent=0,
    spaceAfter=12,
    leading=14
)

tip = ParagraphStyle(
    'Tip',
    parent=body,
    fontName='Helvetica',
    fontSize=10.5,
    textColor=GRAY_DARK,
    backColor=HexColor("#E8F5E9"),
    borderColor=GREEN,
    borderWidth=1,
    borderPadding=10,
    leftIndent=0,
    rightIndent=0,
    spaceAfter=12,
    leading=14
)

toc_item = ParagraphStyle(
    'TocItem',
    parent=body_left,
    fontSize=11,
    spaceAfter=6,
    leading=14
)

# ===== STORY (content list) =====
story = []

def section_break(title_text):
    """Page break with section title at top"""
    story.append(PageBreak())
    story.append(Paragraph(title_text, h1))
    story.append(HRFlowable(width="100%", thickness=2, color=RED, spaceAfter=12))

def code_block(text):
    """A code block with monospace font"""
    escaped = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    escaped = escaped.replace('\n', '<br/>').replace(' ', '&nbsp;')
    story.append(Paragraph(escaped, code))

def info_box(text, kind='callout'):
    """A highlighted box"""
    if kind == 'tip':
        story.append(Paragraph(text, tip))
    else:
        story.append(Paragraph(text, callout))

# ==========================================
# COVER PAGE
# ==========================================
story.append(Spacer(1, 1.5*inch))
story.append(Paragraph("LoanEase PH", cover_title))
story.append(Paragraph("Complete Application Guide", cover_sub))
story.append(Spacer(1, 0.3*inch))
story.append(HRFlowable(width="60%", thickness=2, color=RED, hAlign='CENTER'))
story.append(Spacer(1, 0.3*inch))
story.append(Paragraph("A beginner-friendly walkthrough of every part of the app", cover_small))
story.append(Paragraph("How it works, why it's built this way, and what every file does", cover_small))
story.append(Spacer(1, 2*inch))
story.append(Paragraph("Prepared for Application Development Laboratory Final Project", cover_small))
story.append(Paragraph("&mdash; 2026 &mdash;", cover_small))

# ==========================================
# TABLE OF CONTENTS
# ==========================================
story.append(PageBreak())
story.append(Paragraph("Table of Contents", h1))
story.append(HRFlowable(width="100%", thickness=2, color=RED, spaceAfter=12))

toc = [
    ("1.  What is LoanEase PH?", "Big picture &amp; what the app does"),
    ("2.  The Tech Stack", "Every technology used and why"),
    ("3.  Project Structure", "What each file/folder is for"),
    ("4.  How the App Works (Flow)", "From user click to database"),
    ("5.  The Database", "Tables, columns, relationships"),
    ("6.  User Signup &amp; Login", "How accounts get created &amp; verified"),
    ("7.  The Credit Limit System", "Formula &amp; enforcement"),
    ("8.  Browsing Items", "How products load on the page"),
    ("9.  Applying for a Loan", "From clicking to database record"),
    ("10. My Loans &amp; Payments", "Dashboard and payment system"),
    ("11. Comparing Items", "Side-by-side comparison page"),
    ("12. Docker &amp; Kubernetes", "Containers and orchestration"),
    ("13. API Endpoints Cheat Sheet", "All routes in one table"),
    ("14. Common Professor Questions", "What to expect &amp; how to answer"),
    ("15. Glossary", "Tech terms in plain English"),
]

for title, desc in toc:
    story.append(Paragraph(f"<b>{title}</b>  &mdash;  {desc}", toc_item))

# ==========================================
# SECTION 1: WHAT IS LOANEASE PH
# ==========================================
section_break("1. What is LoanEase PH?")

story.append(Paragraph(
    "<b>LoanEase PH</b> is a Buy-Now-Pay-Later (BNPL) web application. It lets users browse "
    "products (phones, TVs, appliances, cars), apply for installment loans, and manage their "
    "payments &mdash; all online.",
    body
))

story.append(Paragraph(
    "Think of it like a digital appliance store that also acts as a bank: customers can buy "
    "expensive items and pay them off month-by-month instead of all at once.",
    body
))

story.append(Paragraph("What can a user do?", h2))

users_can = [
    ("Sign up for an account", "Enter income, debts, employment info &mdash; the system uses this to decide their credit limit"),
    ("Log in / log out", "Standard authentication, with a 'Remember me' option"),
    ("Browse 24+ items", "Phones, smart TVs, appliances, gadgets, and cars from multiple brands"),
    ("Compare 2 items", "Side-by-side specs and prices to help decide"),
    ("Apply for a loan", "Pick term (6&ndash;60 months), pick interest rate, see monthly payment in real time"),
    ("View their loans", "Dashboard with all loans, items, balances, and payment progress"),
    ("Make payments", "One-month payment or pay off the entire remaining balance"),
]
for label, desc in users_can:
    story.append(Paragraph(f"&bull; <b>{label}</b> &mdash; {desc}", bullet))

story.append(Paragraph("What makes it 'real'?", h2))
real_things = [
    "Passwords are <b>hashed</b> (scrambled) with bcrypt before being stored &mdash; no plaintext passwords in the database",
    "Each user has a <b>credit limit</b> calculated from their income and existing debts",
    "Loans are <b>enforced</b> against the credit limit &mdash; the server rejects loans that would exceed it",
    "<b>Database persistence</b> &mdash; user data survives even if the server crashes",
    "<b>Multi-user</b> &mdash; each user only sees their own loans (data is properly scoped)",
]
for item in real_things:
    story.append(Paragraph(f"&bull; {item}", bullet))

# ==========================================
# SECTION 2: TECH STACK
# ==========================================
section_break("2. The Tech Stack")

story.append(Paragraph(
    "The app is built with several technologies stacked together. Here's what each one does, "
    "explained in everyday language:",
    body
))

# Tech stack table
tech_data = [
    ["Technology", "What it does", "Real-life analogy"],
    ["HTML, CSS,\nJavaScript", "Frontend &mdash; what users see in the browser", "The storefront window and posters"],
    ["Node.js", "Runtime that runs JavaScript on the server", "The kitchen where orders are cooked"],
    ["Express.js", "Web framework on top of Node &mdash; handles requests", "The waiter taking orders to the kitchen"],
    ["MySQL", "Database where all data is permanently stored", "The filing cabinet of customer records"],
    ["bcrypt", "Library that scrambles passwords for security", "A locked diary; only the right key opens it"],
    ["Docker", "Packages the entire app into a portable container", "A shipping container that runs anywhere"],
    ["Kubernetes", "Manages multiple containers, restarts crashed ones", "A factory foreman supervising workers"],
    ["PersistentVolume", "Storage that survives container restarts", "An external hard drive plugged into a laptop"],
]
tech_table = Table(tech_data, colWidths=[1.4*inch, 3.0*inch, 2.4*inch])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), RED),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_LIGHT]),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(tech_table)

story.append(Spacer(1, 0.2*inch))
info_box(
    "<b>Big picture:</b> When a user clicks 'Apply for loan' on the website (HTML/CSS/JS), "
    "the browser sends a request to the Node.js server (running Express). The server uses "
    "the MySQL database to check the credit limit, save the loan, and send a response back. "
    "All of this is packaged in a Docker container, managed by Kubernetes, with a PersistentVolume "
    "for the database files."
)

# ==========================================
# SECTION 3: PROJECT STRUCTURE
# ==========================================
section_break("3. Project Structure")

story.append(Paragraph(
    "Here's the folder layout of the project. Each file has one specific job &mdash; no single "
    "file does too much.",
    body
))

code_block(
    "Victor_App/\n"
    "|-- Dockerfile               # Recipe to build the Docker image\n"
    "|-- .dockerignore            # Files to NOT include in the image\n"
    "|-- package.json             # Lists Node.js dependencies\n"
    "|-- server.js                # The main entry point\n"
    "|\n"
    "|-- config/                  # Database connection and setup\n"
    "|   |-- db.js                # MySQL connection pool + retry logic\n"
    "|   `-- initDatabase.js      # Auto-creates tables + seeds data\n"
    "|\n"
    "|-- routes/                  # Backend API endpoints\n"
    "|   |-- auth.js              # Signup and login\n"
    "|   |-- items.js             # Product catalog\n"
    "|   `-- loans.js             # Loans, payments, credit\n"
    "|\n"
    "|-- js/                      # Frontend JavaScript files\n"
    "|   |-- items.js             # Items page logic\n"
    "|   |-- signup.js            # Signup form and validation\n"
    "|   |-- login.js             # Login form\n"
    "|   |-- my-loans.js          # My Loans dashboard\n"
    "|   |-- compare.js           # Compare items page\n"
    "|   `-- nav.js               # Login/logout state in navbar\n"
    "|\n"
    "|-- *.html                   # Pages: index, items, signup, login, etc.\n"
    "|\n"
    "`-- kubernetes/              # 8 YAML files for deployment\n"
    "    |-- db-credentials.yaml  # Database password (Secret)\n"
    "    |-- db-config.yaml       # Database hostname (ConfigMap)\n"
    "    |-- db-pv.yaml           # Persistent volume\n"
    "    |-- db-pvc.yaml          # Persistent volume claim\n"
    "    |-- mysql-deployment.yaml  # MySQL pod\n"
    "    |-- mysql-service.yaml   # Internal address for MySQL\n"
    "    |-- app-deployment.yaml  # The app pod\n"
    "    `-- lb-service.yaml      # Public address (LoadBalancer)"
)

story.append(Paragraph("Why split things into so many files?", h2))
story.append(Paragraph(
    "Three reasons:",
    body
))
story.append(Paragraph(
    "&bull; <b>Easier to find things</b> &mdash; if there's a bug in login, you know to look at routes/auth.js",
    bullet
))
story.append(Paragraph(
    "&bull; <b>Easier to work as a team</b> &mdash; two people can edit different files without conflict",
    bullet
))
story.append(Paragraph(
    "&bull; <b>Easier to test</b> &mdash; you can test one piece without running everything",
    bullet
))

# ==========================================
# SECTION 4: HOW THE APP WORKS (FLOW)
# ==========================================
section_break("4. How the App Works (Flow)")

story.append(Paragraph(
    "Let's trace what happens when a user clicks 'Apply for loan' on an item. This is a great "
    "example because it touches every layer of the application.",
    body
))

story.append(Paragraph("Step-by-step flow", h2))

flow_steps = [
    ("1. User clicks the button", "On items.html, the user clicks 'Apply for loan' on, say, an iPhone 16. The onclick attribute calls a JavaScript function: openModal(itemId)."),
    ("2. JavaScript runs in the browser", "js/items.js opens the loan modal, shows the item info, the interest rate options, and payment plans (6&ndash;60 months)."),
    ("3. User picks a plan and clicks 'Apply now'", "The frontend calls confirmLoan(), which builds a JSON request and sends it to the server."),
    ("4. The request travels over the network", "Browser sends POST /api/loans/create with a JSON body containing user_id, item_id, interest_rate, term_months."),
    ("5. Express receives the request", "server.js routes the request to routes/loans.js. The file's POST '/create' handler runs."),
    ("6. The server checks credit limit", "It queries the database: 'How much credit does this user have left?' If the loan exceeds their limit, it sends back an error and stops."),
    ("7. The server calculates the loan", "Using the amortization formula, it computes the monthly payment and total amount."),
    ("8. The server saves to the database", "INSERT INTO loans, then INSERT INTO loan_items for each product, then UPDATE users SET used_credit."),
    ("9. The server sends a response", "200 OK with the new loan_id and updated credit info."),
    ("10. The browser updates the UI", "js/items.js shows a success message, updates the credit banner, and offers a link to 'View my loans'."),
]

for label, desc in flow_steps:
    story.append(Paragraph(f"<b>{label}</b><br/>{desc}", body_left))
    story.append(Spacer(1, 4))

info_box(
    "<b>Key insight:</b> The frontend NEVER touches the database directly. It always goes "
    "through the backend API. This is for security &mdash; users can't tamper with the database "
    "from their browser."
)

# ==========================================
# SECTION 5: THE DATABASE
# ==========================================
section_break("5. The Database")

story.append(Paragraph(
    "The database is where all the permanent data lives: users, items, loans, payments. "
    "It uses <b>MySQL</b>, which organizes data into tables (like Excel spreadsheets that can "
    "link to each other).",
    body
))

story.append(Paragraph("Tables in the database", h2))

tables_info = [
    ("agents", "Brands/sellers of items (Apple, Samsung, LG, Toyota...)", "13 rows"),
    ("users", "Customer accounts with login info, income, credit limit", "Grows as people sign up"),
    ("items", "Products for sale (24 items across 5 categories)", "24 rows"),
    ("loans", "Loan records &mdash; one per loan application", "Grows as loans are made"),
    ("loan_items", "Links each loan to its items (a loan can have multiple items)", "Grows with loans"),
    ("payment_schedules", "Monthly payment plan for each loan", "Grows with loans"),
]

table_data = [["Table name", "What it stores", "Size"]]
for name, desc, size in tables_info:
    table_data.append([name, desc, size])

t = Table(table_data, colWidths=[1.3*inch, 4.0*inch, 1.5*inch])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), RED),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('FONTNAME', (0, 1), (0, -1), 'Courier-Bold'),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_LIGHT]),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(t)

story.append(Paragraph("How tables connect to each other", h2))

story.append(Paragraph(
    "Tables link together using <b>foreign keys</b>. Think of it like an ID number reference:",
    body
))

code_block(
    "users (user_id = 1, name = 'Juan')\n"
    "  &darr;\n"
    "loans (loan_id = 5, user_id = 1)        &larr; loan belongs to user 1\n"
    "  &darr;\n"
    "loan_items (loan_id = 5, item_id = 3)   &larr; loan 5 has item 3\n"
    "  &darr;\n"
    "items (item_id = 3, name = 'iPhone 16') &larr; item 3 is iPhone 16"
)

story.append(Paragraph(
    "This means we never duplicate data. We don't store 'Juan' in the loans table &mdash; "
    "we just store user_id = 1. If we ever need Juan's full name, we look it up in the users table.",
    body
))

story.append(Paragraph("Key columns in the users table", h2))

users_cols = [
    ["Column", "Type", "Purpose"],
    ["user_id", "INT (auto)", "Unique ID, auto-generated"],
    ["email", "VARCHAR(100)", "Login email (must be unique)"],
    ["password_hash", "VARCHAR(255)", "Hashed password (NEVER stored as plain text)"],
    ["monthly_income", "DECIMAL", "User's income (for credit calc)"],
    ["other_debts", "DECIMAL", "Existing debts (reduces credit limit)"],
    ["credit_limit", "DECIMAL", "Maximum total loan amount allowed"],
    ["used_credit", "DECIMAL", "How much credit is currently locked in loans"],
    ["status", "ENUM", "pending / verified / suspended"],
]
t = Table(users_cols, colWidths=[1.5*inch, 1.3*inch, 4.0*inch])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), RED),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTNAME', (0, 1), (0, -1), 'Courier-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_LIGHT]),
    ('PADDING', (0, 0), (-1, -1), 6),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(t)

# ==========================================
# SECTION 6: USER SIGNUP & LOGIN
# ==========================================
section_break("6. User Signup &amp; Login")

story.append(Paragraph("Signup &mdash; what happens when a user creates an account", h2))

signup_steps = [
    ("1. Multi-step form", "The signup page (signup.html) has 4 steps: Account info, Personal info, Financial info, Employment info. The user fills them one at a time."),
    ("2. Client-side validation", "js/signup.js checks: passwords match, password is 8+ characters, email is valid, income is at least ₱5,000."),
    ("3. POST to /api/auth/signup", "When the form is submitted, the browser sends all 17 fields as JSON to the server."),
    ("4. Server checks if email exists", "routes/auth.js queries: SELECT email FROM users WHERE email = ?. If found, return error 'Email already registered'."),
    ("5. Hash the password", "Using bcrypt: password_hash = bcrypt.hash(password, salt). The original password is NEVER stored."),
    ("6. Calculate credit limit", "Formula: (income &times; 30% &minus; debts) &times; 24 months, clamped to ₱10,000 – ₱2,000,000."),
    ("7. INSERT INTO users", "All the data is saved, including the new credit_limit."),
    ("8. Server responds with success", "Returns the new user_id and credit_limit. The frontend shows a success card with the credit amount."),
]

for label, desc in signup_steps:
    story.append(Paragraph(f"<b>{label}</b><br/>{desc}", body_left))
    story.append(Spacer(1, 4))

story.append(Paragraph("Why hash passwords?", h2))
info_box(
    "If someone steals our database, they shouldn't be able to log in as anyone. Hashing turns "
    "'mypassword123' into something like '$2b$10$abc...xyz' &mdash; a one-way scramble. Even WE "
    "can't reverse it. When a user logs in, we hash their attempt and compare to the stored hash. "
    "<br/><br/>"
    "<b>bcrypt</b> is specifically designed for passwords: it's slow (which is good &mdash; "
    "stops brute-force attacks) and uses a 'salt' (random data) so two users with the same password "
    "get different hashes."
)

story.append(Paragraph("Login &mdash; what happens when a user signs in", h2))

login_steps = [
    ("1. User enters email and password", "The login.html form collects them."),
    ("2. POST to /api/auth/login", "The browser sends them as JSON."),
    ("3. Server fetches the user", "SELECT password_hash FROM users WHERE email = ?. If no user found, return 'Invalid email or password'."),
    ("4. Compare hashes", "bcrypt.compare(submittedPassword, storedHash). If they match, the password is correct."),
    ("5. Server responds with user data", "Returns user_id, name, email, credit info."),
    ("6. Browser stores in localStorage", "js/login.js saves user_id, user_name, credit_limit to the browser's localStorage. This is how the app 'remembers' the user across pages."),
    ("7. Redirect to items page", "Window location changes to /items.html. Now the user is 'logged in'."),
]

for label, desc in login_steps:
    story.append(Paragraph(f"<b>{label}</b><br/>{desc}", body_left))
    story.append(Spacer(1, 4))

info_box(
    "<b>What is localStorage?</b> It's a small storage area inside the user's browser (key-value pairs). "
    "Once we save user_id there, every page can read it. Logging out simply clears it. This is why we "
    "had to add a proper Logout button &mdash; closing the tab does NOT clear localStorage."
)

# ==========================================
# SECTION 7: CREDIT LIMIT SYSTEM
# ==========================================
section_break("7. The Credit Limit System")

story.append(Paragraph(
    "This is the heart of the BNPL system. Each user gets a personal credit limit, and they "
    "can't borrow more than that. The limit is based on what they can realistically afford.",
    body
))

story.append(Paragraph("The formula", h2))

code_block(
    "Safe monthly payment = (monthly_income &times; 30%) &minus; other_debts\n"
    "Credit limit         = Safe monthly payment &times; 24 months\n"
    "\n"
    "Then clamp:\n"
    "  if credit_limit &lt; ₱10,000  &rarr; credit_limit = ₱10,000  (minimum)\n"
    "  if credit_limit &gt; ₱2,000,000 &rarr; credit_limit = ₱2,000,000 (maximum)"
)

story.append(Paragraph("Examples", h2))

examples = [
    ["Income", "Debts", "Safe Monthly", "Credit Limit"],
    ["₱15,000", "₱0", "₱4,500", "₱108,000"],
    ["₱30,000", "₱2,000", "₱7,000", "₱168,000"],
    ["₱50,000", "₱5,000", "₱10,000", "₱240,000"],
    ["₱100,000", "₱10,000", "₱20,000", "₱480,000"],
    ["₱8,000", "₱5,000", "₱-2,600", "₱10,000 (min)"],
]
t = Table(examples, colWidths=[1.3*inch, 1.3*inch, 1.6*inch, 1.6*inch])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), RED),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_LIGHT]),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(t)

story.append(Paragraph("How the limit is enforced", h2))

story.append(Paragraph(
    "When a user applies for a loan, the server does this check:",
    body
))

code_block(
    "available_credit = credit_limit &minus; used_credit\n"
    "\n"
    "if (loan_amount &gt; available_credit) {\n"
    "    return error('Loan exceeds your available credit')\n"
    "} else {\n"
    "    // Create the loan\n"
    "    // Then: used_credit = used_credit + loan_amount\n"
    "}"
)

story.append(Paragraph(
    "When a user pays off a loan, their <b>used_credit</b> decreases proportionally, freeing up "
    "credit to borrow again.",
    body
))

info_box(
    "<b>Real bank vibes:</b> This is exactly how credit cards work. Your limit is fixed, your "
    "available credit changes based on outstanding balances, and paying down a balance restores "
    "your available credit. We built a mini version of that system.",
    'tip'
)

# ==========================================
# SECTION 8: BROWSING ITEMS
# ==========================================
section_break("8. Browsing Items")

story.append(Paragraph(
    "The Items page (items.html) shows all 24 products in a grid. Users can search, filter by "
    "category, and sort by price or name. Here's how it works under the hood.",
    body
))

story.append(Paragraph("How items appear on the page", h2))

items_steps = [
    ("1. Page loads", "items.html loads, including js/items.js."),
    ("2. JavaScript runs", "loadProducts() is called. It does fetch('/api/items')."),
    ("3. Server returns JSON", "routes/items.js queries the database: SELECT * FROM items JOIN agents. Returns all 24 items with their brand names."),
    ("4. Frontend builds HTML", "renderProducts() loops through the items and builds a product card for each one. The HTML is injected into the page."),
    ("5. User sees the grid", "All 24 cards appear with product images, names, prices, and an 'Apply for loan' button."),
]

for label, desc in items_steps:
    story.append(Paragraph(f"<b>{label}</b><br/>{desc}", body_left))
    story.append(Spacer(1, 4))

story.append(Paragraph("Search, sort, filter &mdash; all on the client side", h2))
story.append(Paragraph(
    "After we have all 24 items loaded into memory (the PRODUCTS array), search/sort/filter "
    "happen instantly in JavaScript &mdash; no server round-trip needed. This makes the page "
    "feel snappy.",
    body
))

story.append(Paragraph("The credit banner", h2))
story.append(Paragraph(
    "If the user is logged in, a banner at the top shows their <b>credit limit</b>, "
    "<b>available credit</b>, and <b>used credit</b>, with a progress bar. This is fetched from "
    "GET /api/loans/credit/:user_id and displayed via renderCreditBanner().",
    body
))

# ==========================================
# SECTION 9: APPLYING FOR A LOAN
# ==========================================
section_break("9. Applying for a Loan")

story.append(Paragraph(
    "Clicking 'Apply for loan' opens a modal (popup) where the user picks the term and interest "
    "rate. This is the most complex flow in the app.",
    body
))

story.append(Paragraph("Inside the modal", h2))
modal_features = [
    "<b>Eligibility check</b>: User enters their income; the app shows which plans they qualify for. Max safe monthly payment = income &times; 30%.",
    "<b>Interest rate pills</b>: 9 options (5%, 8%, 10%, 12%, 15%, 18%, 20%, 22%, 25%). Default is 12%.",
    "<b>Payment plans</b>: 7 options (6, 12, 18, 24, 36, 48, 60 months). Each shows the monthly payment using the amortization formula.",
    "<b>Credit-limit awareness</b>: If the item costs more than the user's available credit, the apply button is replaced with a 'Credit limit exceeded' message.",
]
for f in modal_features:
    story.append(Paragraph(f"&bull; {f}", bullet))

story.append(Paragraph("The amortization formula", h2))
story.append(Paragraph(
    "This is the math behind the monthly payment calculation. Don't worry about memorizing &mdash; "
    "it's just a standard finance formula:",
    body
))

code_block(
    "monthly_rate = annual_interest / 100 / 12\n"
    "\n"
    "monthly_payment = (principal &times; monthly_rate &times; (1 + monthly_rate)^n)\n"
    "                  / ((1 + monthly_rate)^n &minus; 1)\n"
    "\n"
    "where n = number of months"
)

story.append(Paragraph(
    "Example: ₱50,000 loan at 12% for 12 months = ₱4,442/month, total ₱53,309. "
    "The interest you pay over the year is ₱3,309.",
    body
))

story.append(Paragraph("What gets saved to the database", h2))
story.append(Paragraph(
    "When the user clicks 'Apply now' and the credit check passes, three things happen in the database:",
    body
))

savings = [
    ("1. Insert into <b>loans</b>", "user_id, loan_amount, monthly_payment, interest_rate, term_months, total_amount, status='active', start_date=today"),
    ("2. Insert into <b>loan_items</b>", "One row per item in the loan (with quantity and price at time of purchase)"),
    ("3. Insert into <b>payment_schedules</b>", "One row for each month, with due_date, principal_amount, interest_amount"),
    ("4. Update <b>users</b>", "used_credit = used_credit + loan_amount (so the credit limit reduces)"),
]
for label, desc in savings:
    story.append(Paragraph(f"&bull; {label}: {desc}", bullet))

# ==========================================
# SECTION 10: MY LOANS & PAYMENTS
# ==========================================
section_break("10. My Loans &amp; Payments")

story.append(Paragraph(
    "After making a loan, users go to <b>My Loans</b> to track their loans and make payments.",
    body
))

story.append(Paragraph("What's on the page", h2))

my_loans_features = [
    "<b>Credit summary card</b> at the top: limit, available, used (with progress bar)",
    "<b>Filter pills</b>: All / Active / Completed / Pending",
    "<b>Loan cards</b>: Each loan with all its items, stats (principal, total due, paid, remaining, monthly), progress bar showing months paid, and payment buttons",
    "<b>Pay buttons</b>: 'Pay [monthly amount] (1 month)' and 'Pay off [remaining]'",
]
for f in my_loans_features:
    story.append(Paragraph(f"&bull; {f}", bullet))

story.append(Paragraph("How payments work", h2))

payment_steps = [
    ("1. User clicks 'Pay' button", "js/my-loans.js calls payMonth(loanId)."),
    ("2. POST /api/loans/:loan_id/payment", "Server-side: routes/loans.js handles it."),
    ("3. Server fetches the loan", "Gets the current paid_amount, monthly_payment, and total_amount."),
    ("4. Calculate new state", "new_paid_amount = current_paid + payment_amount. Cap at total_amount."),
    ("5. Update payment_schedules", "Mark the next 'pending' schedule row as 'paid' with paid_date=now()."),
    ("6. Restore credit proportionally", "Free up part of the user's used_credit based on how much principal was paid."),
    ("7. Mark loan completed if fully paid", "If new_paid_amount &gt;= total_amount, status becomes 'completed'."),
    ("8. Send response", "Browser refreshes the credit card and loan list."),
]

for label, desc in payment_steps:
    story.append(Paragraph(f"<b>{label}</b><br/>{desc}", body_left))
    story.append(Spacer(1, 4))

info_box(
    "<b>Important:</b> Loans are <b>user-scoped</b>. The query is "
    "<i>SELECT * FROM loans WHERE user_id = ?</i> &mdash; so each user only sees their own loans. "
    "Logging out clears the user_id from localStorage so the next person can't see them either."
)

# ==========================================
# SECTION 11: COMPARING ITEMS
# ==========================================
section_break("11. Comparing Items")

story.append(Paragraph(
    "The Compare page (compare.html) lets users pick any 2 items and see their specs side-by-side. "
    "It's like the 'iPhone 16 vs iPhone 16 Plus' charts you see online.",
    body
))

story.append(Paragraph("How it works", h2))

compare_steps = [
    ("1. Page loads, fetches all items", "loadItems() in js/compare.js calls /api/items and populates both dropdowns."),
    ("2. Items are grouped by category", "Smartphones, TVs, Appliances, Gadgets, Vehicles &mdash; using HTML <i>&lt;optgroup&gt;</i>."),
    ("3. User picks 2 items", "onSelectChange() runs whenever a dropdown changes."),
    ("4. Comparison renders", "renderComparison() builds two side-by-side cards with: image, brand, price, specs, monthly payments for 12/24/36 months, availability."),
    ("5. Cheaper item gets a badge", "The card with the lower price gets a green border and a ' CHEAPER ' badge."),
    ("6. Summary card explains differences", "Shows price difference, which has lower interest, monthly savings."),
    ("7. URL updates for sharing", "Pick items and the URL becomes ?left=1&right=5. Send that link to a friend and they see the same comparison."),
]

for label, desc in compare_steps:
    story.append(Paragraph(f"<b>{label}</b><br/>{desc}", body_left))
    story.append(Spacer(1, 4))

# ==========================================
# SECTION 12: DOCKER & KUBERNETES
# ==========================================
section_break("12. Docker &amp; Kubernetes")

story.append(Paragraph(
    "These two technologies are what make the app run on a 'real server' instead of just on your "
    "laptop. They're often the most confusing part for beginners, so let's break it down.",
    body
))

story.append(Paragraph("Docker &mdash; the shipping container", h2))
story.append(Paragraph(
    "<b>Problem:</b> When you give your app to someone else, it often doesn't work because they "
    "have a different version of Node.js, or are missing a library, or use Windows instead of Mac.",
    body
))
story.append(Paragraph(
    "<b>Solution:</b> Docker packages your app + ALL its dependencies into a 'container'. "
    "It includes the operating system, Node.js, npm packages, your code &mdash; everything. "
    "Anyone who runs the container gets the exact same environment.",
    body
))
story.append(Paragraph(
    "<b>The Dockerfile</b> is the recipe for building the container:",
    body
))

code_block(
    "FROM node:18              # Start with Node.js 18\n"
    "WORKDIR /app               # Create a working folder\n"
    "COPY package*.json ./      # Copy dependency lists\n"
    "RUN npm install            # Install dependencies\n"
    "COPY . .                   # Copy all the code\n"
    "EXPOSE 3000                # The app listens on port 3000\n"
    "CMD [\"node\", \"server.js\"]  # Start the app"
)

story.append(Paragraph("Kubernetes &mdash; the factory foreman", h2))
story.append(Paragraph(
    "<b>Problem:</b> If you have one container running and it crashes, your app goes down. Or "
    "if too many users visit, one server isn't enough.",
    body
))
story.append(Paragraph(
    "<b>Solution:</b> Kubernetes (often shortened to k8s) manages multiple containers. If one "
    "crashes, it starts a new one automatically. It can scale up to many containers when traffic "
    "is high.",
    body
))
story.append(Paragraph(
    "Kubernetes uses YAML files to describe what should be running. We have 8 of them:",
    body
))

k8s_files = [
    ("db-credentials.yaml", "<b>Secret</b> &mdash; the MySQL password (encoded so it's not in plain text)"),
    ("db-config.yaml", "<b>ConfigMap</b> &mdash; settings like database hostname"),
    ("db-pv.yaml", "<b>PersistentVolume</b> &mdash; storage on the host for MySQL data"),
    ("db-pvc.yaml", "<b>PersistentVolumeClaim</b> &mdash; a request for storage"),
    ("mysql-deployment.yaml", "<b>Deployment</b> &mdash; tells k8s to run the MySQL container"),
    ("mysql-service.yaml", "<b>Service</b> &mdash; gives MySQL a stable internal address"),
    ("app-deployment.yaml", "<b>Deployment</b> &mdash; tells k8s to run our LoanEase container"),
    ("lb-service.yaml", "<b>LoadBalancer Service</b> &mdash; exposes the app on a public URL"),
]
for name, desc in k8s_files:
    story.append(Paragraph(f"&bull; <font name=\"Courier-Bold\">{name}</font> &mdash; {desc}", bullet))

story.append(Paragraph("Why PersistentVolume matters", h2))
info_box(
    "Containers are <b>disposable</b> &mdash; they can be deleted and recreated at any moment. "
    "If MySQL's data was stored inside the container, deleting the container would delete all "
    "user data. <br/><br/>"
    "A <b>PersistentVolume</b> is storage that lives OUTSIDE the container. When MySQL writes data, "
    "it goes to /var/lib/mysql inside the container, but that folder is actually mapped to "
    "/mnt/data on the host machine. So even if we delete the MySQL container 100 times, the data is safe.",
    'tip'
)

# ==========================================
# SECTION 13: API ENDPOINTS
# ==========================================
section_break("13. API Endpoints Cheat Sheet")

story.append(Paragraph(
    "Every interaction between the frontend and backend goes through one of these URLs. Here's "
    "the complete list:",
    body
))

api_data = [
    ["Method", "URL", "What it does"],
    ["POST", "/api/auth/signup", "Create a new user account"],
    ["POST", "/api/auth/login", "Verify credentials, return user info"],
    ["GET", "/api/auth/check-email/:email", "Check if an email is already registered"],
    ["GET", "/api/items", "Get all 24 items"],
    ["GET", "/api/items/:id", "Get one item by ID"],
    ["GET", "/api/items/category/:cat", "Get items filtered by category"],
    ["POST", "/api/loans/create", "Create a new loan (with credit check)"],
    ["GET", "/api/loans/credit/:user_id", "Get user's credit limit info"],
    ["GET", "/api/loans/user/:user_id", "Get all loans for a user (with items)"],
    ["GET", "/api/loans/:loan_id", "Get one loan with full details"],
    ["POST", "/api/loans/:loan_id/payment", "Make a payment on a loan"],
    ["PUT", "/api/loans/:loan_id/status", "Update loan status"],
    ["GET", "/api/health", "Health check (server is alive?)"],
]
t = Table(api_data, colWidths=[0.8*inch, 2.6*inch, 3.4*inch])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), RED),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTNAME', (0, 1), (1, -1), 'Courier'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_LIGHT]),
    ('PADDING', (0, 0), (-1, -1), 6),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(t)

story.append(Paragraph("Anatomy of an API request", h2))
code_block(
    "// Frontend code (in js/login.js)\n"
    "fetch('/api/auth/login', {\n"
    "    method: 'POST',\n"
    "    headers: { 'Content-Type': 'application/json' },\n"
    "    body: JSON.stringify({ email: 'juan@email.com', password: '12345678' })\n"
    "})\n"
    ".then(res =&gt; res.json())\n"
    ".then(data =&gt; {\n"
    "    if (data.success) {\n"
    "        // Redirect to items page\n"
    "    }\n"
    "});"
)

# ==========================================
# SECTION 14: COMMON PROFESSOR QUESTIONS
# ==========================================
section_break("14. Common Professor Questions")

story.append(Paragraph(
    "Here are likely questions your professor might ask, with concise answers you can use:",
    body
))

faq = [
    ("Why use Docker?",
     "Three reasons: <b>consistency</b> (same environment everywhere &mdash; my laptop, your laptop, "
     "the cloud), <b>portability</b> (one command runs the entire stack), and <b>isolation</b> "
     "(the app doesn't interfere with other software on the host machine)."),

    ("Why use Kubernetes when we could just use Docker alone?",
     "Docker runs containers; Kubernetes <i>manages</i> them. K8s automatically restarts crashed pods, "
     "load-balances traffic, handles rolling updates, and lets us scale. For a real app with users, "
     "you need this. Plus the lab required it."),

    ("What is a PersistentVolume and why do we need it?",
     "Containers are stateless &mdash; they can be deleted/recreated at any time. Data written inside "
     "a container is lost. A PersistentVolume stores files on the host machine, mounted into the "
     "container. So MySQL data survives pod restarts."),

    ("Why hash passwords instead of storing them?",
     "If our database leaks, attackers shouldn't be able to log in as our users. Hashing is one-way: "
     "we can verify a password is correct, but we can't reverse-engineer it from the hash. We use "
     "<b>bcrypt</b> because it's slow on purpose (resistant to brute-force) and uses a salt (so two "
     "users with the same password get different hashes)."),

    ("Why do you separate routes into auth.js, items.js, loans.js?",
     "Modularity. Each file has one responsibility. Bug in login? Look at auth.js. Adding a new "
     "item endpoint? Edit items.js. This is the <b>Separation of Concerns</b> principle &mdash; "
     "easier to maintain, easier for teammates to work without conflicts."),

    ("How does credit limit work?",
     "On signup: limit = (income &times; 30% &minus; debts) &times; 24 months, clamped to "
     "₱10,000–₱2,000,000. Each loan reduces available credit. Paying off loans "
     "restores it proportionally. The server enforces this &mdash; the frontend can't bypass it."),

    ("Why use ConfigMaps and Secrets?",
     "Hardcoding the database password into Docker would be a security risk &mdash; anyone with "
     "access to the image could see it. <b>Secrets</b> store sensitive data (base64-encoded) "
     "separately, and <b>ConfigMaps</b> hold non-secret settings (like hostnames). Both are "
     "injected into the container as environment variables at runtime."),

    ("How does the app know the user is logged in?",
     "After successful login, we save user_id, user_name, and credit info into the browser's "
     "<b>localStorage</b>. Every page checks for user_id &mdash; if it's there, the user is "
     "logged in. Logout clears localStorage."),

    ("What happens if MySQL is not ready when the app starts?",
     "We built a retry loop in config/db.js. The app tries to connect to MySQL 30 times with "
     "2-second delays. This handles the Kubernetes startup ordering &mdash; sometimes the app "
     "pod starts before MySQL is ready, and we don't want it to crash."),

    ("How are loans linked to multiple items?",
     "We use a <b>join table</b> called loan_items. One loan can have many loan_items rows, each "
     "linking to an item_id. This is the standard way to model many-to-many relationships in SQL."),

    ("Why do you store the item_price in loan_items if the items table already has price?",
     "<b>Historical accuracy</b>. If we change a product's price tomorrow, we don't want yesterday's "
     "loans to retroactively change. By capturing item_price at purchase time, the loan record "
     "stays consistent."),
]

for q, a in faq:
    story.append(Paragraph(f"<b>Q: {q}</b>", body_left))
    story.append(Paragraph(f"A: {a}", body))
    story.append(Spacer(1, 6))

# ==========================================
# SECTION 15: GLOSSARY
# ==========================================
section_break("15. Glossary")

story.append(Paragraph(
    "Quick definitions of every tech term you might be asked about:",
    body
))

glossary = [
    ("API", "Application Programming Interface. A set of URLs that the frontend can call to talk to the backend."),
    ("Backend", "Server-side code that the user doesn't see. Handles database, security, business logic."),
    ("bcrypt", "A password hashing library. Designed to be slow to resist brute-force attacks."),
    ("ConfigMap", "Kubernetes object for storing non-sensitive configuration (hostnames, settings)."),
    ("Container", "A lightweight package containing an app and everything it needs to run."),
    ("CSS", "Cascading Style Sheets. Controls how HTML elements look (colors, fonts, layout)."),
    ("Database", "Organized storage for data. We use MySQL."),
    ("Deployment", "Kubernetes object that ensures a certain number of pods are always running."),
    ("Docker", "Platform for building and running containers."),
    ("Endpoint", "A single URL/route that the backend responds to (e.g., /api/auth/login)."),
    ("Express.js", "A web framework for Node.js. Makes it easy to define routes and handle requests."),
    ("Foreign Key", "A column in one table that references the primary key of another table."),
    ("Frontend", "The part of the app that runs in the user's browser (HTML/CSS/JavaScript)."),
    ("Hash", "A one-way scramble of data. Used for passwords so the original can't be recovered."),
    ("HTML", "HyperText Markup Language. The skeleton of every web page."),
    ("JavaScript", "The programming language that runs in browsers (frontend) and in Node.js (backend)."),
    ("JSON", "JavaScript Object Notation. A text format for sending data between frontend and backend."),
    ("Kubernetes (k8s)", "System for managing containers at scale."),
    ("localStorage", "Browser storage where small data persists across pages (e.g., user_id)."),
    ("MySQL", "Popular relational database. Stores data in tables with rows and columns."),
    ("Node.js", "JavaScript runtime for the server. Lets us run JS outside a browser."),
    ("Pod", "The smallest unit in Kubernetes. Usually contains one container."),
    ("Pool (connection pool)", "A set of reusable database connections. Faster than opening a new connection every time."),
    ("PersistentVolume (PV)", "Kubernetes storage that survives pod restarts."),
    ("PersistentVolumeClaim (PVC)", "A request for storage. The deployment claims a PV via a PVC."),
    ("Port", "A number identifying a network service. Our app uses port 3000 inside, exposed as 80 externally."),
    ("REST", "An API design pattern using HTTP verbs (GET, POST, PUT, DELETE)."),
    ("Salt", "Random data added to a password before hashing. Prevents identical passwords from having identical hashes."),
    ("Secret", "Kubernetes object for storing sensitive data (passwords, API keys) base64-encoded."),
    ("Service (k8s)", "An internal address for a pod. Pods can find MySQL at 'mysql-service' regardless of its IP."),
    ("SQL", "Structured Query Language. How we ask the database for things (SELECT, INSERT, UPDATE)."),
    ("YAML", "A configuration file format used by Kubernetes."),
]

# Render glossary as a 2-column table
glossary_rows = [["Term", "Definition"]]
for term, definition in glossary:
    glossary_rows.append([term, definition])

t = Table(glossary_rows, colWidths=[1.5*inch, 5.3*inch])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), RED),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('GRID', (0, 0), (-1, -1), 0.5, GRAY_BORDER),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_LIGHT]),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t)

# ==========================================
# FINAL PAGE
# ==========================================
story.append(PageBreak())
story.append(Spacer(1, 2*inch))
story.append(Paragraph("You're ready! 🎉", cover_title))
story.append(Spacer(1, 0.3*inch))
story.append(HRFlowable(width="60%", thickness=2, color=RED, hAlign='CENTER'))
story.append(Spacer(1, 0.3*inch))
story.append(Paragraph(
    "If you understand the contents of this document, you understand the entire LoanEase PH application.",
    cover_sub
))
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph("Final tips for the presentation:", h2))
story.append(Paragraph("&bull; Don't memorize &mdash; understand the <b>flow</b>", bullet))
story.append(Paragraph("&bull; If asked about code, point to the relevant file (auth.js, loans.js, etc.)", bullet))
story.append(Paragraph("&bull; The professor wants to see you understand <b>why</b>, not just what", bullet))
story.append(Paragraph("&bull; Demo flow: signup &rarr; show credit limit &rarr; loan &rarr; my loans &rarr; pay &rarr; show credit restored", bullet))
story.append(Paragraph("&bull; Mention persistence: 'If we delete the pod, the data stays because of the PersistentVolume'", bullet))

story.append(Spacer(1, 0.8*inch))
story.append(Paragraph("Good luck! &mdash; LoanEase PH Team", cover_small))

# ==========================================
# BUILD THE PDF
# ==========================================
doc.build(story)
print("✅ PDF generated: LoanEase_PH_Complete_Guide.pdf")
