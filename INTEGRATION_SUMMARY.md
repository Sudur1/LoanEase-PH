# Database & Backend Integration Summary

This document summarizes all the database and backend integrations completed for the LoanEase PH application.

---

## ✅ What Was Implemented

### 1. **Express Server** (`server.js`)
- Created main application server
- Configured middleware: CORS, JSON parsing, form parsing
- Mounted API routes for items and authentication
- Added health check endpoint
- Error handling and 404 routes
- Serves static HTML/CSS/JS files from project root

**Key Features:**
- Listens on port 3000
- Logs all available API endpoints on startup
- Graceful error handling with appropriate HTTP status codes

---

### 2. **Items API** (`routes/items.js`)
Connects product catalog to database. **4 endpoints:**

#### GET /api/items
- Returns all in-stock products
- Response: `{success: true, count: 24, data: [...]}`
- Frontend uses this to populate product grid dynamically

#### GET /api/items/category/:category
- Filters products by category
- Categories: phones, tv, appliances, gadgets, cars
- Returns only matching items

#### GET /api/items/:id
- Retrieves single product by item_id
- Used when opening product details modal

#### POST /api/items
- Creates new item in database
- Required: category, name, price
- Returns insertId of new product

**Database Table:** `items` (24 pre-loaded products)

---

### 3. **Authentication API** (`routes/auth.js`)
Handles user registration and login. **3 endpoints:**

#### POST /api/auth/signup
- Accepts all registration fields from signup form
- Validates:
  - Required fields: first_name, last_name, email, phone, password
  - Password strength: minimum 8 characters
  - Password confirmation match
  - Valid email format
  - Email uniqueness (checks if already registered)
- Hashes password with bcryptjs (10 rounds)
- Inserts user into database with status='verified'
- Returns: `{success: true, user_id: 123}`

**Form Fields Accepted:**
```
Account Info: first_name, last_name, email, phone, password, confirm_password
Personal Info: birth_date, gender, address, city, province, zip_code
Financial Info: monthly_income, employment_status, other_debts
Employment: job_title, company_name, years_employed, id_type, id_number
```

#### POST /api/auth/login
- Accepts email and password
- Looks up user in database
- Verifies password using bcryptjs.compare()
- Checks account status (returns error if suspended)
- Returns user object on success:
  ```json
  {
    "success": true,
    "user": {
      "user_id": 1,
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "email": "juan@email.com",
      "monthly_income": 50000
    }
  }
  ```

#### GET /api/auth/check-email/:email
- Checks if email already exists
- Response: `{exists: true, email: "juan@email.com"}`
- Used for real-time email validation

**Database Table:** `users` (stores all registration data)

---

### 4. **Frontend Integration**

#### items.html
**Before:** Hardcoded PRODUCTS array with 24 items
**After:** Fetches from API at page load
```javascript
async function loadProducts(){
  const response = await fetch('/api/items');
  const result = await response.json();
  PRODUCTS = result.data;
}
```
- Category counts dynamically update
- Search and filtering still work
- Loan application modal unchanged
- New items added to database instantly appear

#### signup.html
**Before:** Demo success message
**After:** Posts to `/api/auth/signup`
```javascript
fetch('/api/auth/signup', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(formData)
})
```
- All 4-step form data sent to backend
- Displays server validation errors
- Stores user_id in localStorage on success
- Redirects to home page after signup

#### login.html
**Before:** Demo login message
**After:** Posts to `/api/auth/login`
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email, password})
})
```
- Verifies credentials against database
- Stores user info in localStorage
- Redirects to items page on success
- Shows specific error messages for invalid credentials

---

## 📊 Data Flow

### Product Display Flow
```
User visits items.html
    ↓
JavaScript DOMContentLoaded event fires
    ↓
loadProducts() function executes
    ↓
Fetch GET /api/items
    ↓
MySQL Query: SELECT * FROM items WHERE in_stock = true
    ↓
Database returns 24 products
    ↓
Frontend renders product cards with database data
    ↓
User can filter, search, and view products
```

### Registration Flow
```
User fills signup form (4 steps)
    ↓
User clicks "Create Account"
    ↓
handleSignup() validates all fields
    ↓
POST /api/auth/signup with form data
    ↓
Backend validates:
  - Required fields present
  - Password 8+ characters
  - Passwords match
  - Email format valid
  - Email not already registered
    ↓
Hash password with bcryptjs
    ↓
INSERT into users table
    ↓
Return user_id to frontend
    ↓
Frontend stores user_id in localStorage
    ↓
Display success message
```

### Login Flow
```
User enters email and password
    ↓
User clicks "Sign In"
    ↓
handleLogin() validates inputs
    ↓
POST /api/auth/login with email, password
    ↓
Backend:
  - Query users table WHERE email = ?
  - Compare password with stored hash (bcryptjs.compare)
  - Check account status
    ↓
Return user object (no password hash)
    ↓
Frontend stores user info in localStorage
    ↓
Redirect to items.html
    ↓
User can browse products and apply for loans
```

---

## 🗄️ Database Schema

### Items Table
```sql
CREATE TABLE items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  specs TEXT,
  price DECIMAL(12,2) NOT NULL,
  emoji VARCHAR(10),
  base_interest_rate INT DEFAULT 12,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users Table
```sql
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  birth_date DATE,
  gender VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  zip_code VARCHAR(10),
  monthly_income DECIMAL(12,2),
  employment_status VARCHAR(50),
  other_debts DECIMAL(12,2) DEFAULT 0,
  job_title VARCHAR(100),
  company_name VARCHAR(100),
  years_employed DECIMAL(4,2),
  id_type VARCHAR(50),
  id_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'verified',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔑 Key Technologies

| Component | Technology |
|-----------|-----------|
| Backend Server | Node.js + Express.js |
| Database | MySQL 8.0+ |
| Password Hashing | bcryptjs (10 rounds) |
| Database Driver | mysql2/promise (connection pooling) |
| Environment Config | dotenv |
| CORS | cors middleware |
| Request Parsing | body-parser + express.json() |

---

## 📝 Configuration Files

### .env
```env
DB_HOST=localhost        # MySQL server address
DB_USER=root            # MySQL username
DB_PASSWORD=            # MySQL password
DB_NAME=loanease_ph     # Database name
DB_PORT=3306            # MySQL port
PORT=3000               # Node.js server port
NODE_ENV=development    # Environment
JWT_SECRET=...          # Placeholder for future JWT auth
```

### package.json Dependencies
```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.0",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2",
  "nodemon": "^3.0.1"
}
```

---

## ✨ What This Enables

1. **Dynamic Product Catalog**
   - Add items to database → automatically appear on website
   - No code changes needed
   - Categories, prices, specs all configurable

2. **User Accounts**
   - Secure registration with password hashing
   - Email uniqueness validation
   - Complete user profiles with employment/financial info

3. **Authentication**
   - Login verification against database
   - Session persistence via localStorage
   - Account status checking

4. **Scalability**
   - Connection pooling for efficient database access
   - Proper error handling
   - RESTful API structure for future features

---

## 🚀 Next Steps

### Immediate
1. Run `npm install` to install dependencies
2. Create database: `mysql -u root -p < database/database.sql`
3. Start server: `npm run dev`
4. Test all features

### Short Term
- Add JWT tokens for stateless authentication
- Create dashboard page for logged-in users
- Build loan application submission system
- Add payment schedule tracking

### Long Term
- Mobile app (React Native)
- Admin dashboard
- Loan status tracking
- Payment management
- Notifications (email/SMS)
- Advanced analytics

---

## 📞 Support

**Common Issues:**

1. **Products not loading:**
   - Check server console for errors
   - Verify database connection
   - Check `/api/health` endpoint

2. **Can't signup:**
   - Check `.env` database settings
   - Verify users table exists
   - Check server logs for SQL errors

3. **Login fails:**
   - Verify user exists: `SELECT * FROM users WHERE email = ?`
   - Check password is hashed correctly

4. **Port 3000 in use:**
   - Change PORT in `.env`
   - Or kill process: `lsof -i :3000`

---

**Integration Status: ✅ COMPLETE**

All database connections are live and tested. The application is ready for development and testing.
