# LoanEase PH - Setup Guide

Welcome! This guide will help you set up and run the complete LoanEase PH application with database integration.

## 📋 Prerequisites

- **Node.js** v24+ and npm installed
- **MySQL** 8.0+ installed and running
- Basic command line experience

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd /path/to/Victor_App
npm install
```

### Step 2: Create the Database
Open a MySQL client and run:
```bash
source database/database.sql
```

Or if you prefer command line:
```bash
mysql -u root -p loanease_ph < database/database.sql
```

### Step 3: Start the Server
```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 LoanEase PH Server running on http://localhost:3000
```

### Step 4: Open in Browser
Navigate to: **http://localhost:3000**

---

## 🏗️ Project Structure

```
Victor_App/
├── server.js                 # Main Express server (entry point)
├── config/
│   └── db.js               # MySQL connection pool
├── routes/
│   ├── auth.js             # Authentication endpoints (signup, login)
│   └── items.js            # Product catalog endpoints
├── database/
│   ├── database.sql        # Database schema & sample data
│   └── README.md           # Database documentation
├── public/
│   ├── index.html          # Homepage
│   ├── items.html          # Product catalog (fetches from API)
│   ├── login.html          # Login page (authenticates via API)
│   ├── signup.html         # Signup page (creates accounts via API)
│   ├── calculator.html
│   ├── about.html
│   ├── contact.html
│   └── css/                # Separated CSS files
│       ├── shared.css
│       ├── index.css
│       └── ...
├── .env                     # Environment configuration
├── package.json            # Dependencies
└── SETUP_GUIDE.md         # This file
```

---

## 🔧 Configuration

Edit `.env` to match your MySQL setup:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=loanease_ph
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

---

## 📡 API Endpoints

### Items Catalog
- `GET /api/items` - Get all in-stock items
- `GET /api/items/:id` - Get specific item by ID
- `GET /api/items/category/:category` - Get items by category
- `POST /api/items` - Create new item

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/check-email/:email` - Check if email is available

### Health Check
- `GET /api/health` - Server status

---

## ✅ Testing the Integration

### Test 1: View Products
1. Go to http://localhost:3000/items.html
2. You should see 24 products loaded from the database
3. Try filtering by category or searching

### Test 2: Create Account
1. Go to http://localhost:3000/signup.html
2. Fill out all 4 steps of the signup form
3. Click "Create Account"
4. Should see success message and be able to check the database

```sql
SELECT * FROM users WHERE email = 'test@email.com';
```

### Test 3: Login
1. Go to http://localhost:3000/login.html
2. Use the email and password from signup
3. Should redirect to items.html after successful login
4. User info is stored in browser localStorage

### Test 4: Add New Item
Using a tool like Postman or curl, you can add new items to the database:

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "category": "phones",
    "name": "Samsung Galaxy A25",
    "specs": "128GB · Blue",
    "price": 24990,
    "emoji": "📱",
    "base_interest_rate": 12
  }'
```

Then refresh items.html and the new item will appear!

---

## 🐛 Troubleshooting

### "Error: Cannot find module 'express'"
```bash
npm install
```

### "Database connection failed"
- Check MySQL is running: `mysql -u root -p`
- Verify `.env` credentials
- Ensure database exists: `SHOW DATABASES;`

### "Port 3000 already in use"
Change in `.env`:
```env
PORT=3001
```

### Products not loading on items.html
1. Open browser console (F12)
2. Check for CORS errors
3. Verify server is running
4. Check `/api/health` in address bar

### Users can't sign up
1. Check `.env` database settings
2. Verify `users` table exists: `DESC users;`
3. Check server console for SQL errors

---

## 📊 Database Tables

### users
- `user_id` - Primary key
- `first_name`, `last_name` - User info
- `email`, `phone` - Contact
- `password_hash` - Bcrypt hashed password
- `birth_date`, `gender`, `address` - Personal info
- `monthly_income`, `employment_status` - Financial info
- `status` - Account status (verified, suspended, etc.)

### items
- `item_id` - Primary key
- `category` - Product category
- `name`, `specs` - Product details
- `price` - Cost in PHP
- `emoji` - Display emoji
- `base_interest_rate` - Default interest rate
- `in_stock` - Availability flag

### loans
- `loan_id` - Primary key
- `user_id` - Foreign key to users
- `item_id` - Foreign key to items
- `loan_amount`, `monthly_payment` - Loan details
- `interest_rate`, `months` - Terms

---

## 🚦 Development Commands

```bash
# Start development server (auto-restarts on code changes)
npm run dev

# Start production server
npm start

# Install new packages
npm install package-name

# Reset database
mysql -u root -p loanease_ph < database/database.sql
```

---

## 🔐 Security Notes

- **Passwords** are hashed with bcryptjs (10 rounds)
- **CORS** is enabled for all origins (for development)
- **Sensitive data** (IDs, tokens) should use JWT in production
- **Environment variables** store database credentials

---

## 📝 What's Next?

### Implemented ✅
- Frontend pages with light theme (red/white)
- Database schema with 24 sample items
- Product catalog API with filtering
- User registration with validation
- User authentication
- Database integration

### Recommended Future Features
- JWT token-based session management
- Loan application system
- Payment tracking
- Admin dashboard
- Email notifications
- SMS verification

---

## 💡 Tips

- **Separate terminal windows**: Keep server running in one, use another for commands
- **Use Postman**: Test API endpoints without frontend
- **Check logs**: Server console shows detailed error messages
- **Browser DevTools**: Network tab shows all API requests/responses
- **Database logs**: Enable MySQL query logging for debugging

---

## ❓ Questions?

If something doesn't work:
1. Check the server console for error messages
2. Check browser console (F12) for client-side errors
3. Verify `.env` configuration
4. Ensure database is running and accessible
5. Check that ports aren't in use

---

**Ready to go!** Run `npm run dev` and start building! 🎉
